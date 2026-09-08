import { PrismaClient } from "@/src/generated/prisma";
import { UpdateOrderStatusDto } from "./order.dto";
export class OrderRepository {
    constructor(private prisma: PrismaClient){}

    async findByUserId(userId: string){
        return this.prisma.order.findMany({
            where: {userId},
            include: {
                items: true
            },
            orderBy: {createdAt: 'desc'}
        })
    }
    async findById(id: string){
        return this.prisma.order.findUnique({
            where: {id},
            include: {
                items: true
            }
        })
    }
    async updateStatus(id: string, dto: UpdateOrderStatusDto){
        return this.prisma.order.update({
            where: {id},
            data: {status: dto.status}
        })
    }
    async cancelOrder(id: string, cancelReason: string, cancelledBy: 'USER' | 'ADMIN'){
        return this.prisma.order.update({
            where: {id},
            data: {
                status: 'CANCELLED',
                cancelReason,
                cancelledBy,
                cancelledAt: new Date()
            }
        })
    }
}