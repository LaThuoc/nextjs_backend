import { NextResponse } from "next/server";
import { RegisterDTO } from "@/src/modules/auth/auth.dto";
import { authService } from "@/src/modules/auth/auth.service";
import { ZodError } from "zod"

export async function POST(req: Request){
    try{
        const body = await req.json();
        const validateData = RegisterDTO.parse(body);
        const user = await authService.register(validateData)

        return NextResponse.json(
            {message: "Đăng ký tài khoản thành công", user},
            {status: 201}
        )
    } catch(error: unknown){
        if (error instanceof ZodError){
            return NextResponse.json(
                {error: "Dữ liệu không hợp lệ", details: error.issues},
                {status: 400}
            )
        }
        if(error instanceof Error){
            if(error.message === "EMAIL_EXISTS"){
                return NextResponse.json(
                    {error: "Email này đã tồn tại"},
                    {status: 409}
            )
        }
        }
        
        return NextResponse.json(
            {error: 'Lỗi hệ thống khi đăng ký'},
            {status: 500}
        )
    }
}


