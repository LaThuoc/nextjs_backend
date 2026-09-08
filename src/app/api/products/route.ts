import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { ProductRepository } from "@/src/modules/products/product.repository";
import { ProductService } from "@/src/modules/products/product.service";
import { CreateProductSchema, ProductQuerySchema } from "@/src/modules/products/product.dto";

const productRepository = new ProductRepository(prisma)
const productService = new ProductService(productRepository)

export async function GET(req: NextRequest){
    try{
        const {searchParams} = new URL(req.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const parseResult = ProductQuerySchema.safeParse(queryParams)
        if(!parseResult.success){
            return NextResponse.json(
                {success: false, errors: parseResult.error.flatten().fieldErrors},
                {status: 400}
            )
        }
        const result = await productService.getProducts(parseResult.data)
        return NextResponse.json({success: true, data: result.items, meta: result.meta})
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 500}
        )
    }
}

export async function POST(req: NextRequest){
    try{
        const body = await req.json()
        const parseResult = CreateProductSchema.safeParse(body);
        if(!parseResult.success){
            return NextResponse.json(
                   { success: false, errors: parseResult.error.flatten().fieldErrors},
                    {status: 400}
                
            )
        }
        const newProduct = await productService.createProduct(parseResult.data)
        return NextResponse.json(
            {success: true, data: newProduct}
        )
    }catch(error){
        return NextResponse.json(
            {success: false, message: (error as Error).message},
            {status: 500}
        )
    }
}