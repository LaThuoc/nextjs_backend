import { CreateOrderSchema, OrderQuerySchema } from "@/src/modules/orders/order.dto";
import { OrderRepository } from "@/src/modules/orders/order.repository";
import { OrderService } from "@/src/modules/orders/order.service";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";


const orderRepository = new OrderRepository(prisma)
const orderService = new OrderService(orderRepository, prisma)

export const GET = withAuth( async (req: AuthenticatedRequest) => {
    try{
        const userId = req.user!.userId;
        const {searchParams} = new URL(req.url)
        const queryParams = {
            page: searchParams.get('page'),
            limit: searchParams.get('limit')
        }
        const query = OrderQuerySchema.parse(queryParams)
        const result = await  orderService.getUserOrder(userId,query)

        return NextResponse.json({
            success: true, data: result.data, pagination: result.pagination
        },{status: 200})
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 400}
        )
    }
})
export const POST = withAuth(async (req: AuthenticatedRequest) => {
    try{
        const userId = req.user!.userId
        const body = await req.json()

        const validatedData = CreateOrderSchema.parse(body)
        const order = await orderService.createOrder(userId, validatedData)
        return NextResponse.json({
            success: true, 
            data: order
        }, {status: 201})
    }catch(error){
        if( error instanceof ZodError){
            return NextResponse.json({
                success: false,
                message: 'Dữ liệu đầu vào ko hợp lệ', details: error.issues
            }, {status: 400})
        }
        return NextResponse.json({
            success: false, message: (error as Error).message
        },{status: 400})
    }
})
