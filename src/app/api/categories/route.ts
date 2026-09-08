import { prisma } from "@/src/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { CategoryRepository } from "@/src/modules/categories/category.repository";
import { CategoryService } from "@/src/modules/categories/category.service";
import { CreateCategorySchema } from "@/src/modules/categories/category.dto";

const categoryRepository = new CategoryRepository(prisma)
const categoryService = new CategoryService(categoryRepository)

export async function GET(req: NextRequest){
    try {
        const {searchParams} = new URL(req.url)
        const mode = searchParams.get("mode")

        if(mode === "flat"){
            const categories = await categoryService.getFlatCategories()
            return NextResponse.json({
                success: true,
                data: categories
            })
        }
        const categories = await categoryService.getCategoriesTree()
        return NextResponse.json(
            {success: true, data: categories}
        )
    }catch(error){
            return NextResponse.json(
                {success: false, message: (error as Error).message},
                {status: 500}
            )
        }
}

export async function POST(req: Request){
    try{
        const body= await req.json();
        const parseResult = CreateCategorySchema.safeParse(body)

        if(!parseResult.success){
            return NextResponse.json(
                {success: false, errors: parseResult.error.flatten().fieldErrors},
                {status: 500}
            )
        }
        const newCategory = await categoryService.createCategory(parseResult.data)
        return NextResponse.json(
            {success: true,
                message: 'Tạo danh mục thành công',
                data: newCategory
            },
            {status: 201}
        )
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 400}
        )
    }
}