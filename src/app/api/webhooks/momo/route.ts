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

        if(transaction.status !== 'PENDING'){
            return NextResponse.json({
                success: false,
                message: 'Order already confirmed',

            }, {status: 200})
        }
        if(Number(resultCode) === 0){
            const result =  await prisma.$transaction( async (tx) => {
                const updateResult = await tx.paymentTransaction.updateMany({
                    where: { id: transaction.id, status: 'PENDING'},
                    data: {
                        status: 'SUCCESS',
                        transactionNo: String(transId),
                        rawResponse: JSON.stringify(body)
                    }
                })
                if(updateResult.count === 0 ) {
                    return {success: false, message: 'Order already confirmed'}
                }
                await tx.order.update({
                    where: {id: transaction.orderId},
                    data: {
                        isPaid: true,
                        paidAt: new Date(),
                        status: 'PROCESSING',
                        paymentMethod: transaction.provider
                    }
                })
                return {success: true, message: 'Success'}
            })
            return NextResponse.json(result, {status: 200})
        } else {
            const upodateResult = await prisma.paymentTransaction.updateMany({
                where: {id: transaction.id, status: 'PENDING'},
                data: {
                    status: "FAILED",
                    transacctionNo: String(transId),
                    rawResponse: JSON.stringify(body)
                }
            })
            if(upodateResult.count === 0){
                return NextResponse.json({
                    success: false,
                    message: 'Order already confirmed',

                }, {status: 200})
            }
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