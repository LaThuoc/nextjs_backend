export const ALLOW_FILE_TYPES = [
    "image/jpeg", 
    "image/png",
    'image/webp',
    'application/pdf'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024

export function validateFile(file: File): string | null {
    if(!ALLOW_FILE_TYPES.includes(file.type)){
        return "Định dạng file không hợp lệ( chỉ chấp nhận JPG, PNG, WEBP, PDF"
    }
    if(file.size > MAX_FILE_SIZE){
        return " Dung lượng không được vượt quá giới hạn cho phép"
    }
    return null
}