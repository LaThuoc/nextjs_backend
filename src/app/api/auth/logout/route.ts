import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/src/modules/auth/auth.service";

export async function POST(){
    try{
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get("refreshToken")?.value

        if(refreshToken){
            await authService.logout(refreshToken)
        }
        const response = NextResponse.json(
            {message: 'Đăng xuất thành công '},
            {status: 200}
        )

        response.cookies.set("refreshToken", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: "/api/auth",
            maxAge: 0
        })
        return response
    }catch (error: unknown){
        console.error('Logout error', error)
        const response = NextResponse.json(
            {error: "Lỗi hệ thống khi đăng xuất"},
            {status: 500}
        )
        response.cookies.delete("refreshToken")
        return response

    }
}