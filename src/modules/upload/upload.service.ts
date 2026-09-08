import { v2 as cloundinary, UploadApiResponse } from "cloudinary";

cloundinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    apit_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

export const uploadService = {
    async uploadToCloudinary(file: File, folder: string = "upload"): Promise<string> {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes);
        return new Promise((resolve, reject) => {
            const uploadStream = cloundinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: "auto",
                },
                (error, result: UploadApiResponse | undefined) => {
                    if(error || !result){
                        return reject(error || new Error("Upload lên Cloundinary thất bại"))
                    }
                    resolve(result.secure_url)
                }
            )
            uploadStream.end(buffer)
        })
    }
}
