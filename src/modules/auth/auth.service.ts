import { authRepository } from "./auth.repository";
import { LoginInput, RegisterInput } from "./auth.dto";
import { hashPassword, verifyPassword } from "@/src/security/argon2";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "@/src/security/jwt";

export const authService = {
    async register(input: RegisterInput) {
        const existingUser = await authRepository.findUserByEmail(input.email)
        if(existingUser){
            throw new Error("EMAIL_EXISTS")
        }
        const passwordHash = await hashPassword(input.password);
        const user =  await authRepository.createUser({
            email: input.email,
            passwordHash,
            fullName: input.fullName,
            avatar: input.avatar,
            hometown: input.hometown,
            phoneNumber: input.phoneNumber,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        })
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            avatar: user.avatar,
            hometown: user.hometown,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
        }
    },

    async login(input: LoginInput){
        const user = await authRepository.findUserByEmail(input.email)
        if(!user){
            throw new Error('INVALID_CREDENTIALS')
        }
        if(user.isBlocked){
            throw new Error("USER_BLOCKED")
        }
        const isPasswordValid = await verifyPassword(user.passwordHash, input.password)
        if(!isPasswordValid){
            throw new Error("INVALID_CREDENTIALS")
        }
        const payload = {userId: user.id, email: user.email, role: user.role};
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload)

        const hashRefreshToken = hashToken(refreshToken)


        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7)

        await authRepository.createRefreshToken({
            token: hashRefreshToken,
            userId: user.id,
            expiresAt,
        })

        return {
            accessToken,
            refreshToken,
            expiresAt,
            user: {
                id: user?.id,
                email: user?.email,
                fullName: user?.fullName,
                role: user.role
            }
        }
    },

    // CẦN THIẾT: Logic Gia hạn Token (Refresh Token Rotation)
    async renewTokens(oldRefreshToken: string){
        const decoded = verifyRefreshToken(oldRefreshToken) as {userId: string, email: string, role:string} | null;
        if(!decoded) {
            throw new Error("INVALID_REFESH_TOKEN")
        }
        const hashOldToken = hashToken(oldRefreshToken)

        const storedToken = await authRepository.findRefreshToken(hashOldToken)
        if(!storedToken){
            await authRepository.deleteAllRefreshToken(decoded.userId)
            throw new Error("Token_Not_Found_OR_REVOKED")
        }
        if(storedToken.user.isBlocked){
            await authRepository.deleteAllRefreshToken(decoded.userId)
            throw new Error("USER_BLOCKED")
        }


        if(new Date() > storedToken.expiresAt){
            await authRepository.deleteRefreshToken(hashOldToken)
            throw new Error('REFRESH_TOKEN_EXPIRED')
        }
        await authRepository.deleteRefreshToken(hashOldToken)
        const payload = {
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        }
        const newAccessToken = signAccessToken(payload)
        const newRefreshToken = signRefreshToken(payload)

        const hashNewToken = hashToken(newRefreshToken)

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await authRepository.createRefreshToken({
            token: hashNewToken,
            userId: storedToken.user.id,
            expiresAt,

        })
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt,
        }
    },
    async logout(refreshToken: string){
       if(!refreshToken) return
       const hashLogout = hashToken(refreshToken)
        await authRepository.deleteRefreshToken(hashLogout)   
    }
    
} 



//1 renewTokens không transactional: xóa token cũ rồi mới tạo token mới — nếu bước tạo thất bại giữa chừng, user mất session mà không có gì để rollback. Nên bọc trong DB transaction.
// 2Không normalize email (lowercase/trim) trước khi tìm/tạo user → dễ tạo tài khoản trùng lặp phân biệt hoa thường (A@x.com vs a@x.com).
// 3Không có rate limiting / account lockout cho login — dễ bị brute-force. Thường xử lý ở middleware/controller nhưng nên note lại.
//4Không giới hạn số refresh token/thiết bị per user và không có cơ chế dọn token hết hạn (cron job hoặc TTL index ở DB) → bảng sẽ phình to dần.
// 5Không có logout-all-devices — chỉ xóa được 1 token cụ thể, không có API kiểu "revoke all sessions".