import {z} from "zod"

export const RegisterDTO = z.object ({
    email: z
    .string({message: "Email không được để trống"})
    .trim()
    .email("email không đúng định dạng"),
    password: z
    .string({message: "Mật khẩu không được để trống"})
    .min(8, "Mật khẩu phải chứa ít nhất 8 ký tự")
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa')
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
    fullName: z.string().trim().optional()
})

export const LoginDTO = z.object({
    email: z
    .string({message: "Email không được để trống"})
    .trim()
    .email("email không đúng định dạng"),
    password: z
    .string({message: 'Mật khẩu không được để trống'})
    .min(1, "Mật khẩu không được để trống"),
})

export type RegisterInput = z.infer<typeof RegisterDTO>
export type LoginInput = z.infer<typeof LoginDTO>