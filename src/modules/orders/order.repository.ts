import { PrismaClient,Prisma } from "@/src/generated/prisma";
import { UpdateOrderStatusDto } from "./order.dto";
import { OrderQueryDto } from "./order.dto";



export class OrderRepository {
    constructor(private prisma: PrismaClient){}

    async findByUserId(userId: string,query: OrderQueryDto, tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        const page = Math.max(1, Number(query.page) || 1)
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 10))
        const skip = (page - 1) * limit

        const [orders, totalOrders] = await Promise.all([
            db.order.findMany({
                where: { userId},
                include: {
                    items: true
                },
                orderBy: {createdAt: 'desc'},
                skip: skip,
                take: limit
            }),
            db.order.count({
                where: {userId}
            })
        ])
        const totalPages = Math.ceil(totalOrders/limit);
        return {
            data: orders,
            pagination: {
                page, 
                limit,
                totalOrders,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevious: page > 1
            }
        }
    }
    async findById(id: string, tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        return db.order.findUnique({
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
    async cancelOrder(id: string, cancelReason: string, cancelledBy: 'USER' | 'ADMIN', tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        return db.order.updateMany({
            where: {
                id,
                status: 'PENDING'
            },
            data: {
                status: 'CANCELLED',
                cancelReason,
                cancelledBy,
                cancelledAt: new Date()
            }
        })
    }
}
