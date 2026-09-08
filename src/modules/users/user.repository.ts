import { prisma } from "@/src/lib/db";
import { UpdateProfileInput } from "./user.dto";
export const userRepository = {
    async findById(id: string){
        return await prisma.user.findUnique({
            where: {id},
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                avatar: true,
                dateOfBirth: true,
                hometown: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    },
    async updateProfile(id: string, data: UpdateProfileInput){
        return await prisma.user.update({
            where: {id},
            data,
            select: {
                id: true,
                email:  true,
                fullName: true,
                phoneNumber: true,
                avatar: true,
                dateOfBirth: true,
                hometown: true,
                role: true,
                updatedAt: true,
            }
        })
    }
}