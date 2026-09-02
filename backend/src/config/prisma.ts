import { PrismaClient } from "@prisma/client";

// Prisma Client ต้องเป็น singleton เดียวทั้งแอป ห้าม new PrismaClient() กระจายหลายที่
// เพราะจะเปิด connection pool ซ้ำซ้อนโดยไม่จำเป็น
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
});
