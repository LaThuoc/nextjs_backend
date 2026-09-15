import { prisma } from "@/src/lib/db";
import { buildVNPayUrl } from "@/src/lib/vnpay";
import { createMoMoPaymentUrl } from "@/src/lib/momo";
import { PaymentMethod } from "@/src/generated/prisma";


export class PaymentSerivce{
    static async processCheckout({
        orderId, 
        paymentMethod,
        ipAddr,
    }: {
        orderId: string,
        paymentMethod: 'VNPAY' | 'MOMO'
        ipAddr: string
    }){
        const order = await prisma.order.findUnique({
            where: {id: orderId}
        })
        if(!order){
            throw new Error('Đơn hàng không tồn tại')
        }
        const numericAmount = Number(order.totalAmount)
        const referenceId = `VNP_${order.id}_${Date.now()}`
        
        const transaction =  await prisma.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    provider: 'VNPAY',
                    referenceId,
                    amount: order.totalAmount,
                    status: 'PENDING',
                    payUrl,

                }
            })

        let url = '';
        if(paymentMethod === 'COD'){
            await prisma.order.update({
                where: {id: orderId},
                data: {
                    paymentMethod: 'COD',
                    status: 'PENDING',
                    isPaid: false
                }
            })
            return {
                successs: true,
                method: 'COD',
                redirectUrl: `/checkout/result?orderId=${orderId}&status=success`,
            }
        }
        if(method === 'VNPAY'){
            const referenceId = `VNP_${order.id}_${Date.now()}`
            const payUrl = buildVNPayUrl({
                orderId: order.id,
                amount: numericAmount,
                ipAddr,
            })

            await prisma.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    provider: 'VNPAY',
                    referenceId,
                    amount: order.totalAmount,
                    status: 'PENDING',
                    payUrl,

                }
            })
            await prisma.order.update({
                where: {id: order.id },
                data: {
                    paymentMethod: 'VNPAY'
                }
            })
            return {
                success: true,
                method: 'VNPAY',
                redirectUrl: payUrl,
                qrCodeUrl: `https://img.vietqr.io/image/NCB-9704198526191432198-compact2.png?amount=${numericAmount}&addInfo=${order.code}`,
        
            }
        } 
        if(method === 'MOMO'){
            const {payUrl, qrCodeUrl, requestId} = await createMoMoPaymentUrl({
                orderId: order.id,
                amount: numericAmount,
            })

            await prisma.paymentTransaction.create({
                data:{
                    orderId: order.id,
                    provider: 'MOMO',
                    referenceId: requestId,
                    amount: order.totalAmount,
                    status: 'PENDING',
                    payUrl,
                }
            })
            await prisma.order.update({
                where: {id: orderId
                },
                data: {paymentMethod: 'MOMO'}
            })
            return {
                success: true,
                method: 'MOMO',
                redirectUrl: payUrl,
                qrCodeUrl,
            }
        }
        throw new Error('Phương thức thanh toán không hợp lệ')
    }
    static async markOrderAsPaid(orderId: string, transactionNo: string, provider: 'MOMO' | 'VNPAY', referenceId?: string){
        const order = await prisma.order.findUnique({
            where: {id: orderId}
        })
        if(!order) return 
        await prisma.$transaction([
            prisma.coupon.update({
                where: {id: orderId},
                data: {
                    isPaid: true,
                    status: 'PROCESSING',
                    paidAt: new Date(),
                }
            }),
            prisma.paymentTransaction.updateMany({
                where: {orderId,
                    provider,
                    status: 'PENDING'
                },
                data: {
                    status: 'SUCCESS',
                    transactionNo
                }
            })
        ])
    }
}