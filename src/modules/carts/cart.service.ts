import { CartRepository } from "./cart.repository";
import { AddToCartDto, UpdateCartItemDto } from "./cart.dto";
import { PrismaClient } from "@/src/generated/prisma";

export class CartService{
    constructor(
        private cartRepository: CartRepository,
        private prisma: PrismaClient
    ){}
    
    async getCart(userId: string){
        const items = await this.cartRepository.findByUserId(userId)

        const totalAmount = items.reduce((sum, item) => {
            return sum + Number(item.product.price) * item.quantity
        }, 0)
        return {
            items,
            totalItem: items.length,
            totalAmount,
        }
    }
    async addToCart(userId: string, dto: AddToCartDto){
        const product = await this.prisma.product.findFirst({
            where: {id: dto.productId, deletedAt: null, isPublished: true}
        })

        if(!product){
            throw new Error('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh')
        }
        const existingItem = await this.cartRepository.findItem(userId, dto.productId)
        const currentQuantity = existingItem ? existingItem.quantity : 0
        const newQuantity = currentQuantity + dto.quantity 
        if(newQuantity > product.stock){
            throw new Error(`Số kluongwj vượt quá tồn kho hiện tại (${product.stock}) sản phẩm`)

        }
        return this.cartRepository.upserItem(userId, dto)
    }

    async updateQuantity(cartItemId: string,userId: string, dto: UpdateCartItemDto){
        const item = await this.prisma.cartItem.findUnique({
            where: {id: cartItemId},
            include: {product: true}
        })
        if(!item){
            throw new Error('Mục giỏ hàng không tồn tại')
        }
        if(item.userId !== userId){
            throw new Error('Bạn không có quyền chỉnh sửa sản phẩm này')
        }
        if(dto.quantity > item.product.stock ){
            throw new Error(`Số lượng vượt quá tồn kho hiện có(${item.product.stock}) sản phẩm`)
        }
        return this.cartRepository.updateQuantity(cartItemId,userId, dto)
    }
    async removeFromCart(cartItemId: string, userId: string){
        const item = await this.prisma.cartItem.findUnique({
            where: {id: cartItemId}
        })
        if(!item){
            throw new Error('Mục giỏ hàng không tồn tại')
        }
        if (item.userId !== userId) {
             throw new Error("Bạn không có quyền xóa sản phẩm này");
        }
        return this.cartRepository.deleteItem(cartItemId,userId)
    }
}