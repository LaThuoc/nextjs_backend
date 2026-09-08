import { PrismaClient, Prisma } from "@/src/generated/prisma";
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from "./product.dto";



export class ProductRepository{
    constructor(private prisma: PrismaClient){}

    async create(data: CreateProductDto & {slug: string}){
        const {images, price,categoryId ,...productData} = data
        return this.prisma.product.create({
            data: {
                ...productData,
                category: categoryId ? {connect :{id: categoryId}} : undefined,
                price: new Prisma.Decimal(price),
                images: images && images.length > 0 ? {
                    createMany: {
                        data: images.map((img, index) => ({
                            url: img.url,
                            isMain: img.isMain ?? index === 0,
                            position: img.position ?? index,
                        }))
                    }
                } : undefined,
            },
            include: {
                category: true,
                images: {orderBy: {position: 'asc'}}
            }
        })
    }
    async findMany(query: ProductQueryDto){
        const {
            page = 1,
            limit = 10,
            search,
            categoryId,
            minPrice,
            maxPrice,
            sortBy = "createdAt",
            sortOrder = "desc",
            isPublished,
            includeArchived,
        } = query
        const skip = (page - 1 ) * limit

        const where: Prisma.ProductWhereInput = {
            deletedAt: includeArchived ? undefined : null,
            isPublished: isPublished,
            categoryId: categoryId,
            price: {
                gte: minPrice !== undefined ? new Prisma.Decimal(minPrice) : undefined,
                lte: maxPrice !== undefined ? new Prisma.Decimal(maxPrice) : undefined
            },
            OR: search ? [
                {name: {contains: search, mode: 'insensitive'}},
                {description: {contains: search, mode: 'insensitive'}}
            ] : undefined
        }

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where, 
                skip,
                take: limit,
                orderBy: {[sortBy]: sortOrder},
                include: {
                    category: true,
                    images: {orderBy: {position: "asc"}}
                }
            }),
            this.prisma.product.count({where})
        ])
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total/limit)
            }
        }
    }
    async findById(id: string){
        return this.prisma.product.findFirst({
            where: {id, deletedAt: null},
            include: {
                category: true,
                images: {orderBy: {position: 'asc'}}
            }
        })
    }
    async findBySlug(slug: string){
        return this.prisma.product.findFirst({
            where: {slug, deletedAt: null},
            include: {  
                category: true,
                images: { orderBy: {position: 'asc'}}
            }
        })
    }
    async update(id: string, data: UpdateProductDto & { slug?: string}){
        const { images, price,categoryId, ...productData} = data;
        return this.prisma.$transaction(async (tx) => {
            if(images){
                await tx.productImage.deleteMany({where: {productId: id}})
                if(images.length > 0 ){
                    await tx.productImage.createMany({
                        data: images.map((img, index) => ({
                            productId: id,
                            url: img.url,
                            isMain: img.isMain ?? index === 0,
                            position: img.position ?? index,
                        }))
                    })
                }
            }
            return tx.product.update ({
                where: {id},
                data: {
                  ...productData,
                  category: categoryId === null
                        ? { disconnect: true } // Nếu truyền null -> Gỡ sản phẩm khỏi category cũ
                        : categoryId
                        ? { connect: { id: categoryId } } // Nếu truyền UUID -> Connect sang category mới
                        : undefined, // Nếu undefined -> Giữ nguyên không sửa
                  price: price !== undefined ? new Prisma.Decimal(price) : undefined,
                },
                include: {
                    category: true,
                    images: {orderBy: {position: 'asc'}}
                }

            })
        })
    }
    async softDelete(id: string){
        const product = await this.prisma.product.findUnique({where: {id}})
        if(!product) return null;
        const archivedSlug = `${product.slug}-deleted-${Date.now()}`;
        return this.prisma.product.update({
            where: {id},
            data: {
                deletedAt: new Date(),
                isPublished: false,
                slug: archivedSlug
            }
        })
    }
   
}