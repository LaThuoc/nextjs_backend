import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/src/modules/auth/auth.service";

export async function POST(){
    try{
        const cookieStore = await cookies();
        const refreshToken =  cookieStore.get("refreshToken")?.value

        if(!refreshToken){
            return NextResponse.json(
                {error: "Không tìm thấy Refresh Token"},
                {status: 401}
            )
        }
        const result = await authService.renewTokens(refreshToken)
        const response =  NextResponse.json({
            message: "Cấp lại AccessToken thành công",
            accessToken: result.accessToken
        })
        response.cookies.set("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/auth",
            expires: result.expiresAt,
        })
        return response
    }catch (error: unknown){
        const response = NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Lỗi hệ thống khi refresh token"
            },
            {status: 401}
        )
        response.cookies.delete("refreshToken");
        return response

    }
}