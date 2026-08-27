import { prisma } from "@/src/lib/db";

export const authRepository = {
    async findUserByEmail(email: string){
        return await prisma.user.findUnique({
            where : {email},
        })
    },
    async createUser(data: {email: string; passwordHash: string; fullName?: string}){
        return await prisma.user.create({
            data,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
            }
        })
    },
    async createRefreshToken(data: {token: string; userId: string; expiresAt: Date}){
        return await prisma.refreshToken.create({
            data,
        })
    },
    async findRefreshToken(token:string){
        return await prisma.refreshToken.findUnique({
            where: {token},
            include: {user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isBlocked: true
                }
            }}
        })
    },
    async deleteRefreshToken(token: string){
        return await prisma.refreshToken.delete({
            where: {token}
        })
    },
    async deleteAllRefreshToken(userId: string){
        return await prisma.refreshToken.deleteMany({
            where: {userId},
        })
    }

}

