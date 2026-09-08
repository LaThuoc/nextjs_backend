import { PrismaClient } from "@/src/generated/prisma";
import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";

export class CategoryRepository{
    constructor(private prisma: PrismaClient){}

    async create(data: CreateCategoryDto & {slug: string}){
        return this.prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
                parent: data.parentId ? {connect: {id: data.parentId }} : undefined
            },
             include: {
                parent: true,
                children: true,
            }
        })
        
    }
    async findById(id: string){
        return this.prisma.category.findUnique({
            where: {id},
            include: {
                parent: true,
                children: true,
            }
        })
    }
    async findBySlug(slug: string){
        return this.prisma.category.findUnique({
            where: {slug}
        })
    }
    async findAllFlat(){
        return this.prisma.category.findMany({
            orderBy: {name: "asc"},
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true
            }
        })
    }
    async findAllTrees(){
        return this.prisma.category.findMany({
            where: {parentId: null},
            include: {
                children: {
                    include: {
                        children: true
                    }
                }
            },
            orderBy: {createdAt: "desc"}
        })
    }
    async searchByName(keyword: string){
        return this.prisma.category.findMany({
            where: {
                name: {
                    contains: keyword,
                    mode: "insensitive"
                }
            }, 
            include: {
                parent: true,
            }
        })
    }
    async update(id: string, data: UpdateCategoryDto & {slug?: string}){
        let parentRelation: {connect?: {id: string}; disconnect?: boolean } | undefined = undefined;
        if(data.parentId === null){
            parentRelation = {disconnect: true}
        } else if(data.parentId !== undefined){
            parentRelation = {connect: {id: data.parentId}}
        }
        return this.prisma.category.update({
            where: {id},
            data: {
               ...(data.name !== undefined && {name: data.name}),
               ...(data.slug !== undefined && {slug: data.slug}),
               ...(parentRelation !== undefined && { parent: parentRelation }),
            },
            include: {
                parent: true,
                children: true,
            }
        })
    }
    async delete(id: string){
        return this.prisma.category.delete({
            where: {id}
        })
    }
}





