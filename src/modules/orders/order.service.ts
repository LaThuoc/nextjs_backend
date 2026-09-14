import { PrismaClient } from "@/src/generated/prisma";
import { OrderRepository } from "./order.repository";
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto, OrderQueryDto } from "./order.dto";
import { CouponService } from "../coupons/coupon.service";

export class OrderService{
    constructor (
        private orderRepository: OrderRepository,
        private prisma: PrismaClient,
        private couponService: CouponService
    ){}

    async createOrder(userId: string, dto: CreateOrderDto){
        return this.prisma.$transaction(async (tx) => {
            const cartItems = await tx.cartItem.findMany({
                where: {userId},
                include: {
                    product: {
                        include: {
                            images: { where : {isMain: true}, take: 1}
                        }
                    }
                }
            })
            if(cartItems.length === 0){
                throw new Error('Giỏ hàng của bạn hiện tại đang trống')
            }

            const sortedCartItem = [...cartItems].sort((a,b) => a.productId.localeCompare(b.productId))


            let subTotal = 0;
            const orderItemData = [];

            for ( const item of sortedCartItem){
                if(item.product.deletedAt || !item.product.isPublished){
                    throw new Error(`Sản phẩm "${item.product.name}" hiện không còn kinh doanh`)
                }

                const updateStockResult = await tx.product.updateMany({
                    where: {id: item.productId,
                        deletedAt: null,
                        isPublished: true,
                        stock: {
                            gte: item.quantity,
                        }
                    },
                   
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                })
                if(updateStockResult.count === 0){
                    throw new Error(`Sản phẩm "${item.product.name}" đã hết hàng hoặc không đủ số lượng trong kho`)
                }

                const price = Number(item.product.price)
                subTotal += price * item.quantity;

                const mainImage= item.product.images[0]?.url || null

                orderItemData.push({
                    productId: item.productId,
                    productName: item.product.name,
                    productImage: mainImage,
                    price: price,
                    quantity: item.quantity
                })
        
            }

            const shippingFee = dto.shippingFee;
            let discountAmount = 0;          
            let appliedCoupon = null;

            const inputCouponCode = dto.couponCode || dto.couponId
            if(inputCouponCode){
                const couponResult = await this.couponService.validateAndCalculateDiscount(
                    userId,
                    {
                        code: inputCouponCode,
                        subTotal,
                        shippingFee
                    },
                    tx
                )
                discountAmount = couponResult.discountAmount
                appliedCoupon = couponResult.coupon
            }
            
            const totalAmount = subTotal + shippingFee - discountAmount

            if(totalAmount < 0){
                throw new Error("Tổng tiền đơn hành này không hợp lệ")
            }
            const code = `ORD-${Date.now()}`

            const order = await tx.order.create({
                data: {
                    code,
                    userId,
                    subTotal,
                    shippingFee,
                    discountAmount,
                    totalAmount,
                    couponId: appliedCoupon?.id || null,
                    couponCode: appliedCoupon?.code || null,
                    paymentMethod: dto.paymentMethod,
                    recipientName: dto.recipientName,
                    recipientPhone: dto.recipientPhone,
                    provinceId: dto.provinceId,
                    provinceName: dto.provinceName,
                    districtId: dto.districtId,
                    districtName: dto.districtName,
                    wardCode: dto.wardCode,
                    wardName: dto.wardName,
                    detailAddress: dto.detailAddress,
                    weight: dto.weight,
                    note: dto.note,
                    items: {
                        createMany: {
                            data: orderItemData
                        }
                    },
                    
                },
                include: {
                        items: true
                    }
            })
            
            if(appliedCoupon){
                await tx.couponUsage.create({
                    data: {
                        couponId: appliedCoupon.id,
                        userId,
                        orderId: order.id
                    }
                })
                await tx.coupon.update({
                    where: {id: appliedCoupon.id},
                    data: {
                        usedCount: {
                            increment: 1
                        }
                    }
                })
            }

            await tx.cartItem.deleteMany({
                where: {userId}
            })
            return order
        })
    }

    async getUserOrder(userId: string,query: OrderQueryDto){
        return this.orderRepository.findByUserId(userId, query)
    }
    async getOrderById(userId: string, orderId: string){
        const order = await this.orderRepository.findById(orderId)
        if(!order){
            throw new Error("Không tìm thấy đơn hàng")
        }
        if(order.userId !== userId){
            throw new Error('Bạn không có quyền xem đơn hàng')
        }
        return order
    }
    async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto,userRole: 'USER' | 'ADMIN' = 'USER'){
        return this.prisma.$transaction(async (tx) => {
            const order = await this.orderRepository.findById(orderId, tx)
            if(!order){
                throw new Error('Không tìm thấy đơn hàng')
            }
            if(userRole !== 'ADMIN' && order.userId !== userId){
                throw new Error('Bạn không có quyền hủy đơn hàng này')
            }
            
            const cancelResult = await this.orderRepository.cancelOrder(
                orderId,
                dto.cancelReason,
                userRole,
                tx
            )
            if(cancelResult.count === 0){
                throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái Đang chờ xử lý')
            }


            for(const item of order.items){
                    await tx.product.update({
                        where: {id: item.productId},
                        data: {stock: {increment: item.quantity}}
                    })
                }

            if(order.couponId){
                await tx.couponUsage.deleteMany({
                    where: {orderId: order.id},

                })
                await tx.coupon.update({
                    where: {id: order.couponId},
                    data: {
                        usedCount: {
                            decrement: 1,
                        }
                    }
                })
            }
            return {success: true, message: 'Hủy đơn hàng thành công'}
        })
    }
    async updateStatus(id: string, dto: UpdateOrderStatusDto){
        const order = await this.orderRepository.findById(id)
        if(!order){
            throw new Error('Không tìm thấy đơn hàng')
        }
        return this.orderRepository.updateStatus(id, dto)
    }
    
}

