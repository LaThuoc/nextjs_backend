import { PrismaClient, Prisma } from "@/src/generated/prisma";
import { CreateCouponDto } from "./coupon.dto";
import { UpdateCouponDto } from "./coupon.dto";
export class CouponRepository {
    constructor(private prisma: PrismaClient){}
    async findById(id: string,  tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        return db.coupon.findUnique({
            where: {id}
        })
    }
    async findByCode(code: string, tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        return db.coupon.findUnique({
            where: {code}
        })
    }
    async countUserUsage(userId: string, couponId: string, tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        return db.couponUsage.count({
            where: {userId, couponId}
        })
    }
    async createCoupon(dto: CreateCouponDto, tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma;
        return db.coupon.create({
            data: dto,
        })
    }
    async getActiveCoupons(tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        const now = new Date();
        return db.coupon.findMany({
            where: {
                isActive: true,
                startDate: {lte: now},
                endDate:{gte: now}
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }
    async updateCoupon(id: string, dto: UpdateCouponDto,tx?: Prisma.TransactionClient ){
        const db = tx ?? this.prisma
        return db.coupon.update({
            where: {id},
            data: dto
        })
    }
    async deleteCoupon(id: string, tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        const existingCoupon = await this.findById(id, tx)
        if(!existingCoupon){
            throw new Error('Mã giảm giá không tồn tại')
        }
        return db.coupon.delete({
            where: {id}
        })
    }
    async deleteManyCoupons(ids: string[], tx?: Prisma.TransactionClient){
        const db = tx ?? this.prisma
        return db.coupon.deleteMany({
            where: {
                id: {in: ids}
            }
        })
    }
}