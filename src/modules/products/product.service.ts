import { ProductRepository } from "./product.repository";
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from "./product.dto";

function generateSlug(str: string): string{
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/^-+/g, '')
        .replace(/-+$/g, '');
}

export class ProductService {
    constructor(private productRepository: ProductRepository){}
    
    async createProduct(dto: CreateProductDto){
        const finalSlug = dto.slug ? dto.slug : generateSlug(dto.name)

        const existingSlug = await this.productRepository.findBySlug(finalSlug);
        if(existingSlug){
            throw new Error("Slug hoặc tên sản phẩm đã tồn tại trong hệ thống")
        
        }
        return this.productRepository.create({
            ...dto,
            slug: finalSlug
        })
    }   
    async getProducts(query: ProductQueryDto){
        if(query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice){
            throw new Error("Giá tối thiểu (minPrice) không được lớn hơn gia tối đa(maxPrice")
        }
        return this.productRepository.findMany(query)
    }
    async getProductById(id: string){
        const product = await this.productRepository.findById(id);
        if(!product){
            throw new Error("Sản phẩm không tồn tại hoặc đã bị xóa")
        }
        return product;
    }
    async updateProduct(id: string, dto: UpdateProductDto){
        await this.getProductById(id)
        let finalSlug = dto.slug;
        if(dto.name && !dto.slug){
            finalSlug = generateSlug(dto.name)
        }
        if(finalSlug){
            const existingSlug = await this.productRepository.findBySlug(finalSlug)
            if(existingSlug && existingSlug.id !== id){
                throw new Error('Slug mới đã được sử dụng bởi sản phẩm khác')
            }
        }
        return this.productRepository.update(id, {
            ...dto,
            slug: finalSlug,
        })
    }
    async deleteProduct(id: string){
        await this.getProductById(id);
        return this.productRepository.softDelete(id)
    }
}