import { NextResponse } from 'next/server';
import { OrderRepository } from '@/src/modules/orders/order.repository';
import { OrderService } from '@/src/modules/orders/order.service';
import { UpdateOrderStatusSchema, CancelOrderSchema } from '@/src/modules/orders/order.dto';
import { ZodError } from 'zod';
import { prisma } from '@/src/lib/db';
import { withAuth,AuthenticatedRequest } from '@/src/middleware/with-auth';
import { Role } from '@/src/generated/prisma';
import { CouponRepository } from "@/src/modules/coupons/coupon.repository";
import { CouponService } from "@/src/modules/coupons/coupon.service";

const orderRepository = new OrderRepository(prisma)
const couponRepository = new CouponRepository(prisma);        // 👈 3. Khởi tạo couponRepository
const couponService = new CouponService(couponRepository, prisma);    // 👈 4. Khởi tạo couponService
const orderService = new OrderService(orderRepository, prisma, couponService);

interface RouteParams {
    params: Promise<{id: string}>
}


export const GET = withAuth( async(req: AuthenticatedRequest, context: RouteParams) => {
    try{
        const userId = req.user!.userId
        const {id} = await context.params

        const order = await orderService.getOrderById(userId, id)
        if(!order){
            throw new Error('Không tìm thấy đơn hàng')
        }
        return NextResponse.json({
            success: true, data: order
        }, {status: 200})
    }catch(error){
        return NextResponse.json({
            success: false, message: (error as Error).message
        }, {status: 400})
    }
})
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteParams) => {
    try{
        const userId = req.user!.userId
        const userRole: Role = req.user?.role?.toUpperCase() === 'ADMIN' ? Role.ADMIN : Role.USER;
        const {id} = await context.params
        const body = await req.json()

        if(body.status !== undefined){
            if(userRole !== Role.ADMIN){
                return NextResponse.json(
                    {success: false, message: 'Bạn không có quyền cập nhật trang thái'},
                    {status: 403}
                )
            }
            const validatedData = UpdateOrderStatusSchema.parse(body)
            const updateOrder = await orderService.updateStatus(id, validatedData)
            return NextResponse.json(
                {success: true, message: 'Cập nhật trạng thái thành công', data: updateOrder}
            )
        }
        if(body.cancelReason !== undefined){
            const validatedData = CancelOrderSchema.parse(body)

            const cancelledOrder = await orderService.cancelOrder(
                id,
                userId,
                validatedData,
                userRole,
            )
            return NextResponse.json({
                success: true, message: 'Hủy đơn hàng thành công',
                data: cancelledOrder
            })   
        }
        return NextResponse.json({
            success: false, message: 'Yêu cầu không hợp lệ.Cần truyền status or cancelReason'
        }, {status: 400})
        
    }catch(error){
        if(error instanceof ZodError){
            return NextResponse.json({
                success: false, message: 'Yêu cầu không hợp lệ', errors: error.issues
            }, {status: 400})
        }
        return NextResponse.json({
            success: false, message: (error as Error).message || 'Lỗi hệ thống nội bộ'
        }, {status: 500})
    }
})

