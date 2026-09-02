import { z } from "zod";

export const generateDocumentNumberSchema = z.object({
  projectCode: z.string().min(1),
  originatorCode: z.string().min(1),
  groupCode: z.string().min(1),
  typeCode: z.string().min(1),
});

export type GenerateDocumentNumberInput = z.infer<typeof generateDocumentNumberSchema>;

export const generateDocumentNumberResponseSchema = z.object({
  documentNo: z.string(),
});
