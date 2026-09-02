import { z } from "zod";

export const createDocumentSchema = z.object({
  projectCode: z.string().min(1),
  title: z.string().min(1),
  originatorCode: z.string().min(1),
  groupCode: z.string().min(1),
  typeCode: z.string().min(1),
  planDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  initialRevision: z.string().optional().default("00"),
  initialPurpose: z.string().optional().default("IFI"),
  initialReceiver: z.string().optional().default("Owner"),
});
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  planDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  currentStatus: z.string().optional(),
  currentRevision: z.string().optional(),
  erpSynced: z.boolean().optional(),
  erpDocId: z.string().optional().nullable(),
});
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const listDocumentsQuerySchema = z.object({
  projectCode: z.string().optional(),
  disciplineCode: z.string().optional(),
  groupCode: z.string().optional(),
  typeCode: z.string().optional(),
  status: z.string().optional(),
  originatorCode: z.string().optional(),
  erpSynced: z.enum(["true", "false", "all"]).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(100),
});
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;

export const createSubmissionSchema = z.object({
  revision: z.string().min(1),
  submittedDate: z.string().datetime().or(z.string().min(1)),
  purposeCode: z.string().min(1),
  submittedBy: z.string().min(1),
  receivedBy: z.string().optional().nullable(),
  returnCode: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable().or(z.literal("")),
  updateDocumentStatus: z.string().optional().default("SUBMITTED"),
  erpSynced: z.boolean().optional().default(false), // Defaults to Pending ConZoL Upload for Admin queue
});
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const syncErpSchema = z.object({
  erpSynced: z.boolean().default(true),
  erpDocId: z.string().optional(),
  receiver: z.string().optional(),
});
export type SyncErpInput = z.infer<typeof syncErpSchema>;

export const batchSyncErpSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1),
  erpSynced: z.boolean().default(true),
  receiver: z.string().optional(),
});
export type BatchSyncErpInput = z.infer<typeof batchSyncErpSchema>;
