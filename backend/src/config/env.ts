import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

// โหลดและ validate environment variables ตั้งแต่ตอน start server
// ถ้าค่าที่จำเป็นขาดหรือผิด type จะ throw error ทันที ไม่ปล่อยให้ server รันแบบ config พัง
export const env = envSchema.parse(process.env);
