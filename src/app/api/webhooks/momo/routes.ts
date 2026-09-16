import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto"
import { prisma } from "@/src/lib/db";


export async function POST(req: NextRequest){
    try{ 
        const body = await req.json()
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            responseTime,
            extraData,
            signature
        } = body;
        const accessKey = process.env.MOMO_ACCESS_KEY!
        const secretKey = process.env.MOMO_SECRET_KEY!

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const expectedSignature = crypto 
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex')   

        if(signature !== expectedSignature){
            return NextResponse.json(
                {success: false, message: 'Invalid checksum'},
                {status: 400}
            )
        }

        const transaction = await prisma.paymentTransaction.findUnique({
            where: {referenceId: orderId},
            include: {order: true}
        })
        if(!transaction){
            return NextResponse.json({
                success: false,
                message: 'Transaction not found'
            })
        }
        if(Math.round(Number(transaction.amount)) !== Math.round(Number(amount))){
            return NextResponse.json({
                success: false,
                message:'Transaction already processed'
            }, {status: 200})
        }
        if(Number(resultCode) === 0){
            await prisma.$transaction([
                prisma.paymentTransaction.update({
                    where: { id: transaction.id},
                    data: {
                        status: 'SUCCESS',
                        transactionNo: String(transId),
                        rawResponse: JSON.stringify(body)
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
        } else {
            await prisma.paymentTransaction.update({
                where: {id: transaction.id},
                data: {
                    status: "FAILED",
                    trsanctionNo: String(transId),
                    rawResponse: JSON.stringify(body)
                }
            })
        }
        return NextResponse.json({
            success: true,
            message: 'Success'
        },{status: 200})
    }catch(error){
        console.error('Lỗi MoMo IPN', error);
        return NextResponse.json({
            success: false,
            message: (error as Error).message || 'Internal Server Error'
        },{status: 500})
    }
}