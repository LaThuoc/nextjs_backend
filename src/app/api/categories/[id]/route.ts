import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { CategoryRepository } from "@/src/modules/categories/category.repository";
import { CategoryService } from "@/src/modules/categories/category.service";
import { UpdateCategorySchema } from "@/src/modules/categories/category.dto";

const repository = new CategoryRepository(prisma)
const  service = new CategoryService(repository)

interface Params {
    params: Promise<{id: string}>
}
export async function GET(req: NextRequest, {params}: Params){
    try{
        const { id } = await params;
        const category = await service.getCategoryById(id)

        return NextResponse.json(
            {success: true, data: category},
        )
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 404}
        )
    }

}
export async function PATCH(req: NextRequest, {params}: Params){
    try{
        const { id } = await params;
        const body = await req.json();
        const parseResult =  UpdateCategorySchema.safeParse(body)
        if(!parseResult.success){
            return NextResponse.json(
                {success: false, errors: parseResult.error?.flatten().fieldErrors},
                {status: 400}
            )

        }
        const updated = await service.updateCategory(id, parseResult.data);
        return NextResponse.json({
            success: true,
            message: "Cập nhật thư mục thành công",
            data: updated
        })
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 400}
        )
    }
}
export async function DELETE(req: NextRequest, {params}: Params){
    try{
        const { id } = await params;
        await service.deleteCategory(id)
        return NextResponse.json({
            success: true,
            message: 'Xóa danh mục thành công'
        })
    }catch(error){
        return NextResponse.json(
            {success: false, message:(error as Error).message},
            {status: 400}
        )
    }
}