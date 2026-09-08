import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { UserService } from "@/src/modules/users/user.service";
import { UpdateProfileDTO } from "@/src/modules/users/user.dto";
import { ZodError } from "zod";

async function getProfileHandler(req: AuthenticatedRequest){
    try{
        const userId = req.user?.userId;
        if(!userId){
            return NextResponse.json(
                {error: 'Không tìm thấy người dùng'},
                {status: 404},

            )
        }

        const user = await UserService.getProfile(userId)
      
        return NextResponse.json({user})
    }catch(error: unknown){
        if(error instanceof Error && error.message === "USER_NOT_FOUND"){
            return NextResponse.json(
                {error: 'Không tìm thấy người dùng'},
                {status: 400},
            )

        }
        return NextResponse.json(
            {error: 'Lỗi hệ thống khi không thấy thông tin người dùng'},
            {status: 500}
        )
    }
}
async function updateProfileHandler(req: AuthenticatedRequest){
    try{
        const userId = await req.user?.userId
        if(!userId){
            return NextResponse.json(
                {error: "Xác thực không hợp lệ"},
                {status: 401}
            )
        }
        const body = await req.json()
        const validateData = UpdateProfileDTO.parse(body)
        const updateUser = await UserService.updateProfile(userId, validateData);
        return NextResponse.json(
            {
                message:"Cập nhật thông tin thành công",
                user: updateUser
            }
        )
    }catch(error: unknown){
        if(error instanceof ZodError){
            return NextResponse.json(
                {error: "Dữ liệu không hợp lệ", details: error.issues},
                {status: 400}
            )
        }
        if(error instanceof Error && error.message === "USER_NOT_FOUND"){
            return NextResponse.json(
                {error: 'Không tìm thấy người dùng'},
                {status: 404}
            )
        }
        return NextResponse.json(
            {error: "Lỗi hệ thống khi cập nhật thông tin"},
            {status: 500}
        )
    }
}
export const GET = withAuth(getProfileHandler)
export const PATCH = withAuth(updateProfileHandler)