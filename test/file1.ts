import { PrismaClient, Prisma, Product } from '@prisma/client';

// 🟢 1. BASE CLASS
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected modelDelegate: any) {}

  async findById(id: string): Promise<T | null> {
    return this.modelDelegate.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<T> {
    return this.modelDelegate.delete({ where: { id } });
  }
}

// 🟢 2. PRODUCT REPOSITORY (Kế thừa từ BaseClass)
export class ProductRepositoryClass extends BaseRepository<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput
> {
  constructor(private prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma.product); // Truyền prisma.product lên Class cha
  }

  // Hàm riêng cho Sản phẩm
  async findBySlug(slug: string) {
    return this.prisma.product.findFirst({ where: { slug } });
  }
}

// 🟢 3. NƠI SỬ DỤNG
async function runClassExample(prisma: PrismaClient) {
  const productRepo = new ProductRepositoryClass(prisma);

  await productRepo.findById('PROD_01'); // Hàm từ Base
  await productRepo.findBySlug('ao-so-mi'); // Hàm riêng
}







import { PrismaClient, Prisma, Product } from '@prisma/client';

// 🟢 1. BASE FACTORY FUNCTION
export function createBaseRepository<T>(modelDelegate: any) {
  return {
    async findById(id: string): Promise<T | null> {
      return modelDelegate.findUnique({ where: { id } });
    },
    async delete(id: string): Promise<T> {
      return modelDelegate.delete({ where: { id } });
    },
  };
}

// 🟢 2. PRODUCT REPOSITORY (Gộp Base bằng Spread Operator)
export function createProductRepositoryFunctional(
  prisma: PrismaClient | Prisma.TransactionClient
) {
  const baseRepo = createBaseRepository<Product>(prisma.product);

  return {
    ...baseRepo, // "Kế thừa" toàn bộ hàm từ Base

    // Hàm riêng cho Sản phẩm
    async findBySlug(slug: string) {
      return prisma.product.findFirst({ where: { slug } });
    },
  };
}

// 🟢 3. NƠI SỬ DỤNG
async function runFunctionalExample(prisma: PrismaClient) {
  const productRepo = createProductRepositoryFunctional(prisma);

  await productRepo.findById('PROD_01'); // Hàm từ Base
  await productRepo.findBySlug('ao-so-mi'); // Hàm riêng
}





import { prisma } from '@/src/lib/db'; // Import kết nối db cố định
import { Product, Prisma } from '@prisma/client';

// 🟢 1. BASE BUILDER (Hàm trợ lý sinh CRUD chung)
const createBaseRepo = <T>(modelDelegate: any) => ({
  async findById(id: string): Promise<T | null> {
    return modelDelegate.findUnique({ where: { id } });
  },
  async delete(id: string): Promise<T> {
    return modelDelegate.delete({ where: { id } });
  },
});

// 🟢 2. PRODUCT REPOSITORY (Export trực tiếp Object)
export const productRepositoryConst = {
  ...createBaseRepo<Product>(prisma.product), // "Kế thừa" hàm từ Base

  // Hàm riêng cho Sản phẩm
  async findBySlug(slug: string) {
    return prisma.product.findFirst({ where: { slug } });
  },
};

// 🟢 3. NƠI SỬ DỤNG (Không cần new, không cần gọi hàm tạo)
async function runConstExample() {
  // Dùng trực tiếp Object đã export
  await productRepositoryConst.findById('PROD_01'); // Hàm từ Base
  await productRepositoryConst.findBySlug('ao-so-mi'); // Hàm riêng
}