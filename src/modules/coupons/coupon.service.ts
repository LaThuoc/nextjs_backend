import { PrismaClient, Prisma, Coupon } from "@/src/generated/prisma";
import { CouponRepository } from "./coupon.repository";
import { ValidateCouponDto } from "./coupon.dto";

export class CouponService{
    constructor(
        private couponRepository: CouponRepository,
        private prisma: PrismaClient
    ){}
    async validateAndCalculateDiscount(
        userId: string, 
        dto: ValidateCouponDto, 
        tx?: Prisma.TransactionClient): Promise<{coupon: Coupon, discountAmount: number}>{
            const coupon = await this.couponRepository.findByCode(dto.code, tx)
            if(!coupon || !coupon.isActive){
                throw new Error('Mã giảm giá không tồn tại hoặc bị khóa')
            }
            const now = new Date();
            if (now < coupon.startDate) {
                throw new Error(
                    `Mã giảm giá chỉ có hiệu lực từ ${coupon.startDate.toLocaleDateString('vi-VN')}`);
            }
            if (now > coupon.endDate) {
                throw new Error("Mã giảm giá đã hết hạn sử dụng");
            }
            if(coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit){
                throw new Error("Mã giảm giá đã hết lượt sử dụng trên toàn hệ thống");
            }
        }
}