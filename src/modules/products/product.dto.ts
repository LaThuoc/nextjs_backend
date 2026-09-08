import {z} from "zod"

export const ProductImageSchema = z.object({
    url: z.string().url("URL ảnh không hợp lệ"),
    isMain: z.boolean().optional().default(false),
    position: z.number().int().min(0).optional().default(0),
})
const categoryIdPreprocessor = z
    .preprocess(
        (val) => (val === "" ? null : val),
        z.string().uuid("categoryId phải là chuỗi UUID hợp lệ ").nullable()
    ).optional();
export const CreateProductSchema = z.object({
    name: z.string().min(1, "Tên sản phẩm ko được để trống"),
    slug: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number({message:"Giá sản phẩm phải là chữ số"}).min(0, "Giá sản phẩm phải lớn hơn hoặc bằng 0"),
    stock: z.coerce.number().int("Số lượng tồn kho phải là số nguyên").min(0, "Số lượng tồn kho phải lớn hơn hoặc bằng 0").optional().default(0),
    isPublished: z.boolean().optional().default(true),
    categoryId: categoryIdPreprocessor,
    images: z.array(ProductImageSchema).optional().default([])
})

export const UpdateProductSchema = CreateProductSchema
    .omit({ categoryId: true }) // Bỏ categoryId cũ ra
    .partial()                 // Biến các trường còn lại thành optional
    .extend({
        
        categoryId: categoryIdPreprocessor,
        stock: z.coerce
            .number()
            .int("Số lượng tồn kho phải là số nguyên")
            .min(0, "Số lượng tồn kho phải lớn hơn hoặc bằng 0")
            .optional(),
        isPublished: z.boolean().optional(),
        images: z.array(ProductImageSchema).optional()
    });

export const ProductQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),

    sortBy: z.enum(["createdAt","price", "name"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

    isPublished: z
        .preprocess( (val) => {
            if(val === "true") return true;
            if(val === "false") return false
            return undefined;
        }, z.boolean().optional()
        ).optional(),

    includeArchived:z
         .preprocess( (val) => {
            if(val === "true") return true;
            if(val === "false") return false
            return undefined;
        }, z.boolean().optional()
        ).optional(),
})

export type CreateProductDto = z.infer<typeof CreateProductSchema>
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>
export type ProductQueryDto = z.infer<typeof ProductQuerySchema>
export type ProductImageDto = z.infer<typeof ProductImageSchema>

