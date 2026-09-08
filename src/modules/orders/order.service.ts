import { PrismaClient } from "@/src/generated/prisma";
import { OrderRepository } from "./order.repository";
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from "./order.dto";

export class OrderService{
    constructor (
        private orderRepository: OrderRepository,
        private prisma: PrismaClient
    ){}

    async creatOrder
}