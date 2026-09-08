import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { CartRepository } from "@/src/modules/carts/cart.repository";
import { CartService } from "@/src/modules/carts/cart.service";
import { AddToCartSchema } from "@/src/modules/carts/cart.dto";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { ZodError } from "zod";

const cartRepository = new CartRepository(prisma)
const cartService = new CartService(cartRepository, prisma)

export const GET = withAuth(async (req: AuthenticatedRequest) => {
    try{
        const userId = req.user!.userId
        const cart = await cartService.getCart(userId)

        return NextResponse.json({
            success: true,
            data: cart,
        })
    }catch(error){
        return NextResponse.json({
            success: false,
            message: (error as Error).message
        },{status: 500})
    }
})
export const POST = withAuth( async ( req: AuthenticatedRequest) => {
    try{
        const userId = req.user!.userId

        const body = await req.json();
        const validatedData = AddToCartSchema.parse(body)

        const cartItem = await cartService.addToCart(userId, validatedData)
        return NextResponse.json(
            {success: true, data: cartItem},
            {status: 201}
        
        )
    }catch(error){
        return NextResponse.json(
            {
            success: false,
            message: (error as Error).message
            },
            {status: 400}
        )
    }
})