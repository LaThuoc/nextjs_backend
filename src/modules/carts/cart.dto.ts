import {z} from "zod"

export const AddToCartSchema = z.object({
    productId: z.string().min(1, 'ProductId không được để trống'),
    quantity: z.coerce.number().int().min(1, "Số lượng tối thiếu là 1").default(1),

})

export const UpdateCartItemSchema = z.object({
    quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1')
})

export type AddToCartDto = z.infer<typeof AddToCartSchema>
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>