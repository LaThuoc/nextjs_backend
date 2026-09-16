import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/src/service/payment/service";

export async function POST(req: NextRequest){
    try{
        const body = await req.json()
        const {orderId, paymentMethod} = body

        if(!orderId || !paymentMethod){
            return NextResponse.json({
                error: 'Thiếu orderId hoặc paymentMethod',
                
            }, {status: 400})
        }

        if(!['VNPAY', 'MOMO'].includes(paymentMethod)){
            return NextResponse.json(
                {error: 'Phương thức thanh toán không hợp lệ'},
                {status: 400}
            )
        }

        const forward = req.headers.get('x-forwarded-for')
        const ipAddr = forward ? forward.split(',')[0].trim() : '127.0.0.1'

        const payUrl = await PaymentService.processCheckout({
            orderId,
            paymentMethod,
            ipAddr
        })
        return NextResponse.json({payUrl})
    } catch(error){
        return NextResponse.json(
            {error: (error as Error).message || 'Lỗi hệ thống'},
            {status: 500}
        )
    }
}