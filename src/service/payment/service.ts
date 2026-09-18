import { prisma } from "@/src/lib/db";
import { buildVNPayUrl } from "@/src/lib/vnpay";
import { createMoMoPaymentUrl } from "@/src/lib/momo";


export class PaymentService{
    static async processCheckout({
        orderId, 
        paymentMethod,
        ipAddr,
    }: {
        orderId: string,
        paymentMethod: 'VNPAY' | 'MOMO' | 'COD'
        ipAddr: string
    }){
        const order = await prisma.order.findUnique({
            where: {id: orderId}
        })
        if(!order){
            throw new Error('Đơn hàng không tồn tại')
        }
        const numericAmount = Number(order.totalAmount)
        const referenceId = `${paymentMethod}_${order.code}_${Date.now()}`
        
        if(paymentMethod === 'COD'){
            await prisma.$transaction([
                prisma.paymentTransaction.create({
                     data: {
                    orderId: order.id,
                    provider: 'COD',
                    referenceId: referenceId,
                    amount: order.totalAmount,
                    status: 'PENDING'
                }
                }),
                prisma.order.update({
                    where: {
                        id: order.id
                    },
                    data: {
                        status: 'PROCESSING',
                        paymentMethod: 'COD'
                    }
                })
            ])
            return `${process.env.NEXT_PUBLIC_APP_URL}/checkout/result?orderId=${order.code}&paymentMethod=COD&success=true`;
        }

        const transaction =  await prisma.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    provider: paymentMethod,
                    referenceId,
                    amount: order.totalAmount,
                    status: 'PENDING',
                }
            })

        let payUrl = '';
        
        if(paymentMethod === 'VNPAY'){
            payUrl = buildVNPayUrl({
                referenceId: referenceId,
                amount: numericAmount,
                ipAddr,
            }) 
            
        } else if(paymentMethod === 'MOMO'){
            const momoRes = await createMoMoPaymentUrl({
                referenceId: transaction.referenceId,
                amount: numericAmount,
                orderInfo: `Thanh toán thành công $${order.code}`
            })
            if(momoRes.resultCode === 0){
                payUrl = momoRes.payUrl
            }else {
                await prisma.paymentTransaction.update({
                    where: {id: transaction.id},
                    data: {
                        status: 'FAILED',
                        rawResponse: JSON.stringify(momoRes)
                    }
                })
                throw new Error(momoRes.message || 'Khởi tạo thanh toán MoMo thất bại')
            }
        }
        await prisma.paymentTransaction.update({
            where: {id: transaction.id},
            data: {payUrl}
        })
        return payUrl
    }
   
}