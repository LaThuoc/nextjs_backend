import { NextResponse } from "next/server";
import { withAuth } from "@/src/middleware/with-auth";
import { validateFile } from "@/src/modules/upload/updload.dto";
import { uploadService } from "@/src/modules/upload/upload.service";


async function uploadHandler(req: Request){
    try{
        const formData = await req.formData()
        const file = formData.get("file") as File | null;
        const folder = formData.get('folder') as string || 'avatars'
        if(!file){
            return NextResponse.json(
                {error: 'Vui lòng đính kèm file cần upload'},
                {status: 400}
            )
        }
        const validationError = validateFile(file)
        if(validationError){
            return NextResponse.json(
                {error: validationError},
                {status: 400}
            )
        }
        const fileUrl = await uploadService.uploadToCloudinary(file, folder)
        return NextResponse.json({
            message: "Upload file thành công",
            url: fileUrl
        })
    }catch(error){
        console.error("Lỗi upload file", error)
        return NextResponse.json(
            {error: "Lỗi hệ thống khi upload file"},
            {status: 500}
        )
    }

}
export const POST = withAuth(uploadHandler)