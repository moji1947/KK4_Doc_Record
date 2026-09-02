import { z } from "zod";

export const disciplineSchema = z.object({
  disciplineCode: z.string(),
  disciplineName: z.string(),
  active: z.boolean(),
});

export const documentGroupSchema = z.object({
  groupCode: z.string(),
  groupName: z.string(),
  disciplineCode: z.string(),
  active: z.boolean(),
});

export const documentTypeSchema = z.object({
  typeCode: z.string(),
  typeDescription: z.string(),
  active: z.boolean(),
});

export const groupTypeQuerySchema = z.object({
  groupCode: z.string().min(1),
});
