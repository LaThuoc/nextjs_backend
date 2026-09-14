import { CouponService } from "@/src/modules/coupons/coupon.service";
import { CouponRepository } from "@/src/modules/coupons/coupon.repository";
import { prisma } from "@/src/lib/db";
import { CreateCouponSchema } from "@/src/modules/coupons/coupon.dto";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { NextResponse } from "next/server";
import { Role } from "@/src/generated/prisma";

const couponRepository = new CouponRepository(prisma)
const couponService = new CouponService(couponRepository, prisma)

export async function GET(){
    try{
        const coupons = await couponService.getActiveCoupons()

        return NextResponse.json(
            {
                success: true,
                data: coupons
            }
    )
    }catch(error){
        return NextResponse.json({
            success: false,
            message: (error as Error).message
        },{status: 500})
    }
}

export const POST = withAuth(async(req: AuthenticatedRequest) =>{
    try{
        // const userRole: Role = req.user?.role?.toUpperCase() === 'ADMIN' ? Role.ADMIN : Role.USER;
        // if(userRole !== Role.ADMIN ){
        //     throw new Error('Bạn không có quyền thực hiện chức năng này')
        // }
        const body = await req.json()
        const validatedCoupon = CreateCouponSchema.parse(body)
        const newCoupon = await couponService.createCoupon(validatedCoupon)
        return NextResponse.json({
            success: true,
            message: "Tạo mã giảm giá thành công",
            data: newCoupon
        }, {status: 201})
    }catch(error){
        return NextResponse.json({
            success:false,
            message: (error as Error).message
        },{status: 400})
    }
})


export const DELETE = withAuth( async(req: AuthenticatedRequest) => {
    try{
        const rawRole = req.user?.role
        const userRole: 'USER' | 'ADMIN' = rawRole?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
        if(userRole !== 'ADMIN'){
            return NextResponse.json({
                success: false, message: 'Bạn không có quyền thực hiện chức năng này'
            }, {status: 403})
        }
        const body = await req.json()
        const ids: string[] = body.ids || (body.id ? [body.id] : [])
        
        const result = await couponService.deleteCoupon(ids)
        return NextResponse.json({
            success: true, 
            data: result,
        }, {status: 200})
    }catch(error){
        return NextResponse.json({
            success: false,
            message: (error as Error).message
        }, {status: 400})
    }
})