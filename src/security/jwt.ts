import jwt from "jsonwebtoken"
import crypto from "crypto";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
if(!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET){
    throw new Error("Waring: Quên chưa cài JWT trong file .env")
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    jti?: string;
}
export interface DecodedJwtPayload extends JwtPayload {
    iat: number;
    exp: number;
}
export function signAccessToken(payload: JwtPayload): string{
    return jwt.sign(payload, JWT_ACCESS_SECRET!, {expiresIn: "15m"})
}

export function signRefreshToken(payload: JwtPayload): string{
    return jwt.sign(payload, JWT_REFRESH_SECRET!, {expiresIn: "7d"})
}

export function verifyAccessToken(token: string): DecodedJwtPayload | null {
    try{
        return jwt.verify(token, JWT_ACCESS_SECRET!) as DecodedJwtPayload

    } catch {
        return null
    }
}

export function verifyRefreshToken(token: string): DecodedJwtPayload | null {
    try{
        return jwt.verify(token, JWT_REFRESH_SECRET!) as DecodedJwtPayload
    } catch{
        return null
    }
}

export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex")
}