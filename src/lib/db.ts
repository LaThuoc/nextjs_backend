import 'dotenv/config';
import { PrismaClient } from "../generated/prisma";
import { PrismaNeon } from '@prisma/adapter-neon';

// 1. Khai báo kiểu dữ liệu cho biến global
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// 2. Hàm khởi tạo Prisma Client truyền thẳng kết nối vào PrismaNeon
const createPrismaClient = () => {
  // GIẢI PHÁP: Truyền trực tiếp connectionString vào object cấu hình của PrismaNeon
  // Bỏ qua bước tạo Pool thủ công để tránh lỗi lệch kiểu dữ liệu (Type Mismatch)
  const adapter = new PrismaNeon({ 
    connectionString: process.env.DATABASE_URL! 
  });

  return new PrismaClient({
    adapter, 
    log: process.env.NODE_ENV === 'development' ? ["query", 'error', 'warn'] : ['error']
  });
};

// 3. Export instance duy nhất (Singleton)
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
