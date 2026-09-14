import { PrismaClient, Prisma, Coupon } from "@/src/generated/prisma";
import { CouponRepository } from "./coupon.repository";
import { UpdateCouponDto, ValidateCouponDto } from "./coupon.dto";
import { CreateCouponDto } from "./coupon.dto";

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

            const userUsedCount = await this.couponRepository.countUserUsage(userId, coupon.id, tx)
            if(userUsedCount >= coupon.userUsageLimit){
                throw new Error(`Bạn đã sử dụng tối đa (${coupon.userUsageLimit} lần) mã giảm giá này`)
            }

            const subTotal = dto.subTotal
            if(coupon.minOrderValue && subTotal < Number(coupon.minOrderValue)){
                throw new Error(`Đơn hàng tối thiểu phải từ ${Number(coupon.minOrderValue).toLocaleString()} VNĐ để dùng mã này`)
            }

            let discountAmount = 0; // số tiền được giảm 
            if(coupon.type === 'PERCENTAGE'){
                discountAmount = (subTotal * Number(coupon.value))/100
                if(coupon.maxDiscountValue && Number(coupon.maxDiscountValue) < discountAmount){
                    discountAmount = Number(coupon.maxDiscountValue)
                }
            }else if (coupon.type === 'FIXED_AMOUNT'){
                discountAmount = Number(coupon.value)
                if(discountAmount > subTotal) discountAmount = subTotal
            }else if(coupon.type === 'SHIPPING'){
                discountAmount = Number(coupon.value)
                if(discountAmount > dto.shippingFee) discountAmount = dto.shippingFee
            }
            return {
                coupon,
                discountAmount: Math.round(discountAmount)
            }

    }
    async createCoupon(dto: CreateCouponDto){
        const cleanCode = dto.code.trim().toUpperCase()
        const  existingCoupon = await this.couponRepository.findByCode(cleanCode)
        if(existingCoupon){
            throw new Error(`Mã giảm giá "${dto.code}" đã tồn tại trên hệ thống`)
        }
        if(new Date(dto.endDate) <= new Date(dto.startDate)){
            throw new Error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu')
        }
        return this.couponRepository.createCoupon(dto)
    }
    async getActiveCoupons(){
        return this.couponRepository.getActiveCoupons()
    }
    async getCouponId(id: string){
        const coupon = await this.couponRepository.findById(id)
        if(!coupon){
            throw new Error('Không tìm thấy mã giảm giá')
        }
        return coupon
    }
    async updateCoupon(id: string, dto: UpdateCouponDto){
        const existingCoupon = await this.couponRepository.findById(id)
        if(!existingCoupon){
            throw new Error('Không tìm thấy mã giảm giá để cập nhật')
        }
        if(dto.code && dto.code !== existingCoupon.code){
            const codeCheck = await this.couponRepository.findByCode(dto.code)
                if(codeCheck){
                    throw new Error(`Mã giảm giá "${dto.code}" đã trùng với một mã khác`)
                }
            
        }
        const startDate = dto.startDate ? new Date(dto.startDate) : existingCoupon.startDate
        const endDate = dto.endDate ? new Date(dto.endDate) : existingCoupon.endDate

        if(endDate <= startDate){
            throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu')
        }
        return this.couponRepository.updateCoupon(id, dto)

    }
    async deleteCoupon(ids: string[]){
        if(!ids || ids.length === 0){
            throw new Error('Danh sách mã cần xóa không được để trống')
        }
        const result = await this.couponRepository.deleteManyCoupons(ids);
  
        return {
            success: true,
            message: `Đã xóa thành công ${result.count} mã giảm giá`,
            deletedCount: result.count
        };
    }
}