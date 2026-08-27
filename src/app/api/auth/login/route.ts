import { NextResponse } from "next/server";
import { LoginDTO } from "@/src/modules/auth/auth.dto";
import { authService } from "@/src/modules/auth/auth.service";
import { ZodError } from "zod"

export async function POST(req: Request){
    try{
        const body = await req.json();
        const validateData = LoginDTO.parse(body)
        const result = await authService.login(validateData)


        const response = NextResponse.json({
            message: "Đăng nhập thành công",
            accessToken: result.accessToken,
            user: result.user
        })

        response.cookies.set("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/auth",
            expires: result.expiresAt
        })
        return response
    }catch(error: unknown){
        if(error instanceof ZodError){
            return NextResponse.json(
                {error: "Dữ liệu không hợp lệ", details: error.issues},
                {status: 400}
            )
        }
        if(error instanceof Error){
            if(error.message === "INVALID_CREDENTIALS"){
                return NextResponse.json(
                    {error: "Email hoặc mật khẩu không chính xác"},
                    {status: 401}
                )
            }
        }
        return NextResponse.json(
            {error: "Lỗi hệ thống đăng nhập"},
            {status: 500}
        )
    }
}