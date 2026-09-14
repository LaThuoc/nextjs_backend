import {z} from "zod"

export const CouponTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'SHIPPING'])

export const CreateCouponSchema = z.object({
    code: z.string().min(3, 'Mã giảm giá phải từ 3 kí tự trở lên').transform((val) => val.toUpperCase()),
    description: z.string().optional(),
    type: CouponTypeEnum,
    value: z.number().positive('Giá trị phải lớn hơn 0'),
    minOrderValue: z.number().min(0).optional(),
    maxDiscountValue: z.number().min(0).optional(),
    usageLimit: z.number().int().positive().optional(),
    userUsageLimit: z.number().int().positive().default(1),
    startDate: z.coerce.date().default(() => new Date()),
    endDate: z.coerce.date(),
    isActive: z.boolean().default(true)
})
export const UpdateCouponSchema = CreateCouponSchema.partial()
export const ValidateCouponSchema = z.object({
    code: z.string().min(1, 'Vui lòng nhập mã giảm giá').transform((val) => val.toUpperCase()),
    subTotal: z.number().min(0, 'Tổng tiền hàng không hợp lệ'),
    shippingFee: z.number().min(0, 'Phí vẫn chuyển không hợp lệ').default(0)
})

export type CreateCouponDto = z.infer<typeof CreateCouponSchema>
export type ValidateCouponDto = z.infer<typeof ValidateCouponSchema>
export type UpdateCouponDto = z.infer<typeof UpdateCouponSchema>