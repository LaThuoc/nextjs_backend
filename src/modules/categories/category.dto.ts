import {z} from "zod"

export const CreateCategorySchema = z.object({
    name: z.string().min(1,'Tên danh mục không được để trống'),
    slug: z.string().optional(),
    parentId: z
        .preprocess(
            (val) => (val === "" ? null : val),
            z.string().uuid("parentId phải là chuỗi UUUID hợp lệ").optional().nullable()

        ).optional()

})

export const UpdateCategorySchema = CreateCategorySchema.partial()

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;