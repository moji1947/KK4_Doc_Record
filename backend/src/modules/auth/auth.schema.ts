import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userProfileSchema = z.object({
  userId: z.string(),
  email: z.string(),
  displayName: z.string(),
  disciplineCode: z.string().nullable().optional(),
  isAdmin: z.boolean(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
