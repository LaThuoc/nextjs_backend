import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@/src/generated/prisma";
import { CartRepository } from "@/src/modules/carts/cart.repository";
import { CartService } from "@/src/modules/carts/cart.service";
import { UpdateCartItemSchema } from "@/src/modules/carts/cart.dto";
import { ZodError } from "zod";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { prisma } from "@/src/lib/db";

const cartRespository = new CartRepository(prisma)
const cartService = new CartService(cartRespository, prisma)
interface Context {
    params: Promise<{id: string}>
}

export  const PATCH = withAuth( async (req: AuthenticatedRequest, context: Context) => {
    try{
        const userId = req.user!.userId
        const {id } = await context.params
        const body = await req.json()

        const validatedData = UpdateCartItemSchema.parse(body)
        const updated = await cartService.updateQuantity(userId, id, validatedData)
        return NextResponse.json(
            {success: true, data: updated}
        )
    }catch(error){
        if(error instanceof ZodError){
            return NextResponse.json({
                success: false, message: 'Dữ liệu không hợp lệ', details: error.issues
            }, {status: 400})
        }
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 400}
        )
    }
})

export const DELETE = withAuth(async (req: AuthenticatedRequest, context: Context) => {
    try{
        const userId = req.user!.userId;
        const {id} = await context.params

        await cartService.removeFromCart(userId, id)
        return NextResponse.json({
            success: true, 
            message: 'Đã xóa sản phẩm khỏi giỏ hàng'
        })

    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 400}
        )
    }
})