import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";
import { CategoryRepository } from "./category.repository";

function generateSlug(str: string): string{
    return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");
}
export class CategoryService{
    constructor(private categoryRepository: CategoryRepository){}

    async createCategory(dto: CreateCategoryDto){
        if(dto.parentId){
            const parentExist = await this.categoryRepository.findById(dto.parentId)
            if (!parentExist){
                throw new Error("Danh mục cha (parentId) không tồn tại trên hệ thống")
            }
        }

        const allCategories = await this.categoryRepository.findAllFlat();
        const isDuplicateName = allCategories.some(
            (cat) => cat.name.trim().toLowerCase() === dto.name.trim().toLowerCase() &&
            cat.parentId === (dto.parentId ?? null)
        )
        if(isDuplicateName){
            throw new Error(`Danh mục "${dto.name}" đã tồn tại trong cùng danh mục`)
        }
        const baseSlug = dto.slug ? generateSlug(dto.slug) : generateSlug(dto.name)

        const isDuplicateSlug = allCategories.some((cat) => {
            const catSlug = cat.slug.toLowerCase();
            const targetSlug = baseSlug.toLowerCase()
            return (
                catSlug === targetSlug || catSlug.startsWith(`${targetSlug}-i`)
            )
        })
        if(isDuplicateSlug){
            throw new Error(`Slug hoặc tên danh mục "${dto.name}" đã tồn tại trên hệ thống`)
        }
      
        const tempSlug = `${baseSlug}-temp-${Date.now()}`
        const newCategory = await this.categoryRepository.create({
            ...dto,
            slug: tempSlug
        })

        const finalSlug = dto.slug ? dto.slug : `${baseSlug}-i.${newCategory.id}`
        return this.categoryRepository.update(newCategory.id, {slug: finalSlug})
    }
    async getCategoriesTree(){
        return this.categoryRepository.findAllTrees()
    }
    async getFlatCategories(){
        return this.categoryRepository.findAllFlat()
    }
    async getCategoryById(id: string){
        const category = await this.categoryRepository.findById(id);
        if(!category){
            throw new Error("Danh mục không tồn tại")
        }
        return category
    }
    async updateCategory(id: string, dto: UpdateCategoryDto){
        await this.getCategoryById(id);
        if(dto.parentId === id){
            throw new Error("Danh mục không thể chọn chính nó làm danh mục cha")
        }
        const allCategories = await this.categoryRepository.findAllFlat();

        if(dto.name){
            const currentCat = allCategories.find((c) => c.id === id)
            const targetParentId = dto.parentId !== undefined ? dto.parentId : currentCat?.parentId

            const isDuplicateName = allCategories.some(
                (cat) => 
                    cat.id !== id &&
                    cat.name.trim().toLowerCase() === dto.name!.trim().toLowerCase() &&
                    cat.parentId === (targetParentId ?? null)
            )
            if(isDuplicateName){
                throw new Error(`Danh mục "${dto.name}" đã tồn tại trong danh mục này`)
            }
        }


        let finalSlug = dto.slug;
        if(dto.name && !dto.slug){
            finalSlug = `${generateSlug(dto.name)}-i.${id}`
        }
        if(finalSlug){
           const isDupolicateSlug = allCategories.some(
             (cat) => cat.id !== id && cat.slug.toLowerCase() === finalSlug!.toLowerCase()
           )
           if(isDupolicateSlug){
            throw new Error("Slug mới đã trùng với danh mục khác")
           }
        }
        return this.categoryRepository.update(id, {
            ...dto,
            slug: finalSlug,
        })
    }
    async deleteCategory(id: string){
        const category = await this.getCategoryById(id)
        if(category.children && category.children.length > 0){
            throw new Error("Không thể xóa các danh mục đang chứa các danh mục con")
        }
        return this.categoryRepository.delete(id)
    }
}
