import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/src/middleware/with-auth";
import { prisma } from "@/src/lib/db";


async function getProfileHandler(req: AuthenticatedRequest){
    try{
        const userId = req.user?.userId;

        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {
                id: true, 
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
            }
        })
        if(!user){
            return NextResponse.json(
                {error: 'Không tìm thấy người dùng'},
                {status: 404},

            )
        }
        return NextResponse.json({user})
    }catch{
        return NextResponse.json(
            {error: 'Lỗi hệ thống khi không thấy thông tin người dùng'},
            {status: 500}
        )
    }
}
export const GET = withAuth(getProfileHandler)