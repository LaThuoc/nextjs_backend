import { userRepository } from "./user.repository";
import { UpdateProfileDTO, UpdateProfileInput } from "./user.dto";

export const UserService = {
    async getProfile(userId: string){
        const user = await userRepository.findById(userId)
        if(!userId){
            throw new Error('USER_NOT_FOUND')
        }
        return user
    },
    async updateProfile(userId: string, input: UpdateProfileInput){
        try{
            const user = await userRepository.updateProfile(userId, input)
            return user
        }catch{
            throw new Error("USER_NOT_FOUND")
        }
    }

}