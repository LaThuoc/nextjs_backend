import z from "zod";


export const  UpdateProfileDTO = z.object({
    fullName: z.string().trim().min(2, "Họ tên phải từ 2 ký tự trỏ lên").optional(),
    phoneNumber: z
    .string()
    .trim()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Số điện thoại không hợp lệ")
    .optional(),

  avatar: z
    .string()
    .trim()
    .url("Đường dẫn avatar không hợp lệ")
    .optional(),

  dateOfBirth: z
    .string()
    .datetime({ message: "Ngày sinh phải theo chuẩn ISO (YYYY-MM-DDTHH:mm:ss.sssZ)" })
    .transform((val) => new Date(val))
    .optional(),

  hometown: z
    .string()
    .trim()
    .max(100, "Quê quán không vượt quá 100 ký tự")
    .optional(),
})

export type UpdateProfileInput = z.infer< typeof UpdateProfileDTO>