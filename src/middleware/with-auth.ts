import { NextResponse } from "next/server";
import { verifyAccessToken, JwtPayload } from "../security/jwt";
import { Jwt } from "jsonwebtoken"
import { prisma } from "../lib/db";

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload
}

export function withAuth(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
){
    return async (req: Request) => {
        const authHeader = req.headers.get("authorization")
        if(!authHeader || !authHeader.startsWith("Bearer")){
            return NextResponse.json(
                {error: 'Yêu cầu Access Token để truy cập'},
                {status: 401}
            )
        }
        const token = authHeader.split("")[1];
        const payload = verifyAccessToken(token)

        if(!payload){
            return NextResponse.json(
                {error: "AccessToken không hợp lệ hoặc đã hết hạn"},
                {status: 401}
            )
        }
        const user = await prisma.user.findUnique({
            where: {id: payload.userId},
            select: {isBlocked: true}
        })
        if(!user || user.isBlocked){
            return NextResponse.json(
                {error: "Tài khoản của bạn đã bị khóa hoặc không tồn tại"},
                {status: 403}
            )
        }
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = payload
        return handler(authenticatedReq)

    }
}