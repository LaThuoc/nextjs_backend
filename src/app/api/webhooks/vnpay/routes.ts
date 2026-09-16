import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto'
import querystring from 'qs'
import { prisma } from "@/src/lib/db";


function sortObject(obj: Record<string, string>){
    const sorted: Record<string, string> = {}
    const keys = Object.keys(obj).sort()

    for(const key of keys){
        if(obj[key] !== null && obj[key] !== undefined && obj[key] !== ''){
            sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+')
        }
    }
    return sorted
}

export async function GET(req: NextRequest){
    try{
        const searchParams = req.nextUrl.searchParams
        let vnp_Params: Record<string, string> = {}

        searchParams.forEach((value, key) => {
            vnp_Params[key] = value
        })
        const secureHash = vnp_Params['vnp_SecureHash']
        delete vnp_Params['vnp_SecureHash']
        delete vnp_Params['vnp_SecureHashType']

        vnp_Params = sortObject(vnp_Params)
        const secretKey = process.env.VNP_HASH_SECRET!
        const signData = querystring.stringify(vnp_Params, {encode: false})
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData,'utf-8')).digest('hex')

        if(secureHash !== signed){
            return NextResponse.json(
                {RspCode: '97', message: 'Invalid Checksum'}
            )
        }
        
        const referenceId = vnp_Params['vnp_TxnRef']
        const rpsCode = vnp_Params['vnp_ResponseCode'];
        const vnp_Amount = Number(vnp_Params['vnp_Amount'])/100;
        const vnp_TransactionNo = vnp_Params['vnp_TransactionNo']

        const transaction = await prisma.paymentTransaction.findUnique({
            where: { referenceId },
            include: {order: true}
        })
        if(!transaction){
            return NextResponse.json({rpsCode: '01', message: 'Order not found'})
        }
        if(Math.round(Number(transaction.amount)) !== Math.round(vnp_Amount)){
            return NextResponse.json({RspCode: '04', messgae: 'Invalid amount'})
        }

        if(transaction.status !== 'PENDING'){
            return NextResponse.json({
                RpsCode: '02',
                message: 'Order already confirmed'
            })
        }

        if(rpsCode == '00'){
            await prisma.$transaction([
                prisma.paymentTransaction.update({
                    where: { id: transaction.id},
                    data: {
                        status: 'SUCCESS',
                        transactionNo: vnp_TransactionNo,
                        rawResponse: JSON.stringify(vnp_Params)
                    }
                }),
                prisma.order.update({
                    where: {id: transaction.orderId},
                    data: {
                        isPaid: true,
                        paidAt: new Date(),
                        status: 'PROCESSING'
                    }
                })
            ])
        }else {
            await prisma.paymentTransaction.update({
                where: {id: transaction.id},
                data: {
                    status: 'FAILED',
                    transactionNo: vnp_TransactionNo,
                    rawResponse: JSON.stringify(vnp_Params)
                }
            })
        }
        return NextResponse.json({RspCode: '00', message: 'Confirm Succeess'})
    }catch(error){
        console.error('Lỗi VNPAY IPN', error);
        return NextResponse.json({RpsCode: '99', message: 'Unknown Error'})
    }
}