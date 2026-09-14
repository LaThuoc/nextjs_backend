import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { UpdateCouponSchema } from "@/src/modules/coupons/coupon.dto";
import { CouponRepository } from "@/src/modules/coupons/coupon.repository";
import { CouponService } from "@/src/modules/coupons/coupon.service";
import { prisma } from "@/src/lib/db";
import prismaConfig from "@/prisma.config";
import { ZodError } from "zod";

const couponRepository = new CouponRepository(prisma)
const couponService = new CouponService(couponRepository, prisma)

export async function GET(req: Request, {params} : {params: {id: string}}){
    try{
        const coupon = await couponService.getCouponId(params.id)
        return NextResponse.json({
            success: true,
            data: coupon
        },)
    }catch(error){
        return NextResponse.json({
            success: false,
            message: (error as Error).message
        }, {status: 404})
    }
}
export const PATCH = withAuth(async(req: AuthenticatedRequest, {params} : {params: {id: string}})=> {
    try{
        const rawRole = req.user?.role
        const userRole: 'USER' | 'ADMIN' = rawRole?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
        if(userRole !== 'ADMIN'){
            return NextResponse.json({
                success: false, message: 'Bạn không có quyền thực hiện chức năng này'
            }, {status: 403})
        }
        const body = await req.json()
        
        const validatedData = UpdateCouponSchema.parse(body)
        const updatedCoupon = await couponService.updateCoupon(params.id, validatedData)
        return NextResponse.json({
            success: true,
            message:'Cập nhật mã giảm giá thành công thành công',
            data: updatedCoupon
        })

    }catch(error){
        if(error instanceof ZodError){
            return NextResponse.json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                error: error.issues
            }, {status: 400})
        }
        return NextResponse.json({
             success: false,
             message: (error as Error).message 
        }, {status: 400}
    )
    }
})

