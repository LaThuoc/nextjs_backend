import { PrismaClient } from "@/src/generated/prisma";
import { AddToCartDto, UpdateCartItemDto, UpdateCartItemSchema } from "./cart.dto";

export class CartRepository{
    constructor(private prisma: PrismaClient){}
    async findByUserId(userId: string){
        return this.prisma.cartItem.findMany({
            where:{ userId},
            include: {
                product: {
                    include: {
                        images: {
                            where: {isMain: true},
                            take: 1
                        }
                    }
                }
            },
            orderBy: {createdAt: 'desc'}
        })
    }

    async findItem(userId: string, productId: string){
        return this.prisma.cartItem.findUnique({
            where: {
                userId_productId: {userId, productId}
            }
        })
    }

    async upserItem(userId: string, dto: AddToCartDto){
        const {productId, quantity} = dto

        return this.prisma.cartItem.upsert({
            where: {
                userId_productId: {userId, productId}
            },
            update: {
                quantity: {increment: quantity}
            },
            create: {
                userId,
                productId,
                quantity,
            },
            include: {
                product: true
            }
        })
    }
    async updateQuantity(cartItemId: string, userId: string,  dto: UpdateCartItemDto){
        const result = await this.prisma.cartItem.updateMany({
            where: {
                id: cartItemId,
                userId: userId,
            },
            data: {quantity: dto.quantity},
            
        })
        if(result.count === 0 ){
            throw new Error('Sản phẩm không tồn tại hoặc bạn không có quyền sửa')
        }
        return this.prisma.cartItem.findUnique({
            where: {id: cartItemId},
            include: {product: true}
        })
    }
    async deleteItem(cartItemId: string,userId: string){
        return this.prisma.cartItem.deleteMany({
            where: {
                id: cartItemId,
                userId: userId
            }
        })
    }
    async clearItem(userId: string){
        return this.prisma.cartItem.deleteMany({
            where: {userId}
        })
    }
}