import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { CouponRepository } from "@/src/modules/coupons/coupon.repository";
import { CouponService } from "@/src/modules/coupons/coupon.service";
import { prisma } from "@/src/lib/db";
import { ZodError } from "zod";
import { ValidateCouponSchema } from "@/src/modules/coupons/coupon.dto";

const couponRepository = new CouponRepository(prisma)
const couponService = new CouponService(couponRepository, prisma)

export const POST = withAuth(async(req: AuthenticatedRequest) => {
    try{
        const userId = req.user!.userId
        const body = await req.json()
        const validated = ValidateCouponSchema.parse(body)

        const result = await couponService.validateAndCalculateDiscount(userId, validated)
        return NextResponse.json({
            success: true, 
            data: {
                couponId: result.coupon.id,
                couponCode: result.coupon.code,
                discountAmount: result.discountAmount,
                description: result.coupon.description
            }
        },{status: 200})
    }catch(error){
        if(error instanceof ZodError){
            return NextResponse.json({
                success:false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.issues
            },{status: 400})
        }
        return NextResponse.json({
            success: false,
            message: (error as Error).message
        }, {status: 400})
    }
})