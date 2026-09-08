import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { ProductRepository } from "@/src/modules/products/product.repository";
import { ProductService } from "@/src/modules/products/product.service";
import { UpdateProductSchema } from "@/src/modules/products/product.dto";

const productRepository = new ProductRepository(prisma)
const productService = new ProductService(productRepository)


interface Params {
    params: Promise<{id: string}>
}
export async function GET(req: NextRequest, {params}: Params){
    try{
        const { id } = await params
        const product = await productService.getProductById(id)
        return NextResponse.json({
            success: true,
            data: product
        })
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 404}
        )
    }

}
export async function PATCH(req: NextRequest, {params}: Params){
    try{
        const { id } = await params
        const body = await req.json()
        const parseResult = UpdateProductSchema.safeParse(body)
        if(!parseResult.success){
            return NextResponse.json(
                {success: false, errors: parseResult.error.flatten().fieldErrors},
                {status: 400}
            )
        }
        const updateProduct = await productService.updateProduct(id, parseResult.data)
        return NextResponse.json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            data: updateProduct
        })
    }catch(error){
        return NextResponse.json(
            {success: false, message:(error as Error).message},
            {status: 400}
        )
    }
}
export async function DELETE(req: NextRequest, {params}: Params){
    try{
        const {id} = await params
        const deleteProdcut = await productService.deleteProduct(id)
        return  NextResponse.json({
            success: true,
            message: "Xóa sản phẩm thành công",
            data: deleteProdcut
        })
    }catch(error){
        return NextResponse.json(
            {success:false, message: (error as Error).message || "Xóa sản phẩm thất bại"},
            {status: 400}
        )
    }
}