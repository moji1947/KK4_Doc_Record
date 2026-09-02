import { prisma } from "../../config/prisma";
import { generateNextDocumentNumber } from "../numbering/numbering.service";
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateSubmissionInput,
  ListDocumentsQuery,
  SyncErpInput,
  BatchSyncErpInput,
} from "./documents.schema";
import { NotFoundError } from "../../shared/errors";
import mockDocuments from "../../shared/mockDocuments.json";

const DEFAULT_INITIAL_REVISION = "00";
const DEFAULT_INITIAL_STATUS = "DRAFT";

// Fallback mock helpers — used when DATABASE_URL is placeholder / Supabase not yet migrated
function filterMockDocuments(params: ListDocumentsQuery) {
  let items: any[] = [...(mockDocuments as any[])];
  if (params.projectCode) items = items.filter(d => d.projectCode === params.projectCode);
  if (params.groupCode) items = items.filter(d => d.groupCode === params.groupCode);
  if (params.typeCode) items = items.filter(d => d.typeCode === params.typeCode);
  if (params.status) items = items.filter(d => d.currentStatus === params.status);
  if (params.originatorCode) items = items.filter(d => d.originatorCode === params.originatorCode);
  if (params.erpSynced === "true") items = items.filter(d => d.erpSynced);
  if (params.erpSynced === "false") items = items.filter(d => !d.erpSynced);
  if (params.disciplineCode) items = items.filter(d => d.group?.disciplineCode === params.disciplineCode || d.groupCode.startsWith(params.disciplineCode));
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(d => d.documentNo.toLowerCase().includes(q) || d.title.toLowerCase().includes(q));
  }
  const sortBy = params.sortBy || "createdAt";
  const order = params.sortOrder || "desc";
  items.sort((a,b) => {
    const av = String(a[sortBy] ?? "");
    const bv = String(b[sortBy] ?? "");
    return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  const page = params.page || 1;
  const pageSize = params.pageSize || 300;
  const total = items.length;
  const paged = items.slice((page-1)*pageSize, page*pageSize);
  return { items: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function createDocument(input: CreateDocumentInput, createdBy: string) {
  // If DB not configured (placeholder password), fallback to mock logic so frontend still works
  if (process.env.DATABASE_URL?.includes("[YOUR_DB_PASSWORD]")) {
    const prefix = `${input.projectCode}-${input.originatorCode}-${input.groupCode}-${input.typeCode}-`;
    const max = (mockDocuments as any[]).filter(d => d.documentNo.startsWith(prefix)).map(d => parseInt(d.documentNo.slice(-4),10)).reduce((m,n)=>Math.max(m,isNaN(n)?0:n),0);
    const next = String(max+1).padStart(4,"0");
    const documentNo = `${prefix}${next}`;
    return {
      documentId: `mock-${Date.now()}`,
      documentNo,
      ...input,
      currentRevision: input.initialRevision || DEFAULT_INITIAL_REVISION,
      currentStatus: DEFAULT_INITIAL_STATUS,
      erpSynced: false,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
  }
  const documentNo = await generateNextDocumentNumber({
    projectCode: input.projectCode,
    originatorCode: input.originatorCode,
    groupCode: input.groupCode,
    typeCode: input.typeCode,
  });

  const rev = input.initialRevision || DEFAULT_INITIAL_REVISION;

  return prisma.$transaction(async (tx) => {
    // New document created by Engineer: initial state is Pending ConZoL Upload (erpSynced = false)
    const doc = await tx.documentRegister.create({
      data: {
        documentNo,
        projectCode: input.projectCode,
        title: input.title,
        originatorCode: input.originatorCode,
        groupCode: input.groupCode,
        typeCode: input.typeCode,
        currentRevision: rev,
        currentStatus: DEFAULT_INITIAL_STATUS,
        planDate: input.planDate ? new Date(input.planDate) : undefined,
        remarks: input.remarks ?? undefined,
        erpSynced: false,
        createdBy,
      },
      include: {
        project: true,
        originator: true,
        group: { include: { discipline: true } },
        type: true,
        revision: true,
        status: true,
      },
    });

    if (input.initialPurpose) {
      await tx.documentSubmission.create({
        data: {
          documentId: doc.documentId,
          revision: rev,
          submittedDate: input.planDate ? new Date(input.planDate) : new Date(),
          purposeCode: input.initialPurpose,
          submittedBy: createdBy,
          receivedBy: input.initialReceiver || "Owner",
          erpSynced: false,
        },
      });
    }

    return doc;
  });
}

export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
  updatedBy: string
) {
  const existing = await prisma.documentRegister.findUnique({
    where: { documentId },
  });

  if (!existing) {
    throw new NotFoundError("DocumentRegister", documentId);
  }

  return prisma.documentRegister.update({
    where: { documentId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.remarks !== undefined && { remarks: input.remarks }),
      ...(input.planDate !== undefined
        ? { planDate: input.planDate ? new Date(input.planDate) : null }
        : {}),
      ...(input.currentStatus && { currentStatus: input.currentStatus }),
      ...(input.currentRevision && { currentRevision: input.currentRevision }),
      ...(input.erpSynced !== undefined && {
        erpSynced: input.erpSynced,
        erpSyncedAt: input.erpSynced ? new Date() : null,
        erpSyncedBy: updatedBy,
      }),
      ...(input.erpDocId !== undefined && { erpDocId: input.erpDocId }),
      updatedBy,
    },
    include: {
      project: true,
      originator: true,
      group: { include: { discipline: true } },
      type: true,
      revision: true,
      status: true,
    },
  });
}

export async function setErpSyncStatus(
  documentId: string,
  input: SyncErpInput,
  syncedBy: string
) {
  const existing = await prisma.documentRegister.findUnique({
    where: { documentId },
  });

  if (!existing) {
    throw new NotFoundError("DocumentRegister", documentId);
  }

  return prisma.documentRegister.update({
    where: { documentId },
    data: {
      erpSynced: input.erpSynced,
      erpSyncedAt: input.erpSynced ? new Date() : null,
      erpSyncedBy: input.receiver || syncedBy,
      ...(input.erpDocId && { erpDocId: input.erpDocId }),
      updatedBy: syncedBy,
    },
    include: {
      group: { include: { discipline: true } },
      submissions: { orderBy: { submittedDate: "desc" } },
    },
  });
}

export async function batchSetErpSyncStatus(
  input: BatchSyncErpInput,
  syncedBy: string
) {
  const timestamp = input.erpSynced ? new Date() : null;
  const operator = input.receiver || syncedBy;

  await prisma.documentRegister.updateMany({
    where: { documentId: { in: input.documentIds } },
    data: {
      erpSynced: input.erpSynced,
      erpSyncedAt: timestamp,
      erpSyncedBy: operator,
      updatedBy: syncedBy,
    },
  });

  return { count: input.documentIds.length, erpSynced: input.erpSynced };
}

export async function addSubmission(
  documentId: string,
  input: CreateSubmissionInput,
  submittedBy: string
) {
  const doc = await prisma.documentRegister.findUnique({
    where: { documentId },
  });

  if (!doc) {
    throw new NotFoundError("DocumentRegister", documentId);
  }

  const nextStatus = input.updateDocumentStatus || "SUBMITTED";

  return prisma.$transaction(async (tx) => {
    const submission = await tx.documentSubmission.create({
      data: {
        documentId,
        revision: input.revision,
        submittedDate: new Date(input.submittedDate),
        purposeCode: input.purposeCode,
        submittedBy: input.submittedBy || submittedBy,
        receivedBy: input.receivedBy ?? undefined,
        returnCode: input.returnCode ?? undefined,
        attachmentUrl: input.attachmentUrl ?? undefined,
        erpSynced: input.erpSynced ?? false,
        erpSyncedAt: input.erpSynced ? new Date() : null,
        erpSyncedBy: input.receivedBy ?? submittedBy,
      },
      include: {
        revisionRef: true,
        purpose: true,
        returnCodeRef: true,
      },
    });

    // When new revision is submitted, document becomes Pending ConZoL Upload (erpSynced = false)
    await tx.documentRegister.update({
      where: { documentId },
      data: {
        currentRevision: input.revision,
        currentStatus: nextStatus,
        erpSynced: input.erpSynced ?? false,
        erpSyncedAt: input.erpSynced ? new Date() : null,
        erpSyncedBy: input.receivedBy ?? submittedBy,
        updatedBy: submittedBy,
      },
    });

    return submission;
  });
}

export async function getDocumentById(documentId: string) {
  try {
    const document = await prisma.documentRegister.findUnique({
      where: { documentId },
      include: {
        project: true,
        originator: true,
        group: {
          include: {
            discipline: true,
          },
        },
        type: true,
        revision: true,
        status: true,
        submissions: {
          include: {
            revisionRef: true,
            purpose: true,
            returnCodeRef: true,
          },
          orderBy: { submittedDate: "desc" },
        },
      },
    });

    if (!document) {
      throw new NotFoundError("DocumentRegister", documentId);
    }

    const distributions = await prisma.roleAssignmentMatrix.findMany({
      where: { groupCode: document.groupCode },
    });

    return {
      ...document,
      distributions,
    };
  } catch (e) {
    if (process.env.DATABASE_URL?.includes("[YOUR_DB_PASSWORD]")) {
      const mock = (mockDocuments as any[]).find(d => d.documentId === documentId);
      if (mock) return { ...mock, distributions: [] };
    }
    throw e;
  }
}

export async function listDocuments(params: ListDocumentsQuery) {
  try {
    const where: Record<string, unknown> = {};

    if (params.projectCode) {
      where.projectCode = params.projectCode;
    }
    if (params.groupCode) {
      where.groupCode = params.groupCode;
    }
    if (params.typeCode) {
      where.typeCode = params.typeCode;
    }
    if (params.status) {
      where.currentStatus = params.status;
    }
    if (params.originatorCode) {
      where.originatorCode = params.originatorCode;
    }
    if (params.erpSynced === "true") {
      where.erpSynced = true;
    } else if (params.erpSynced === "false") {
      where.erpSynced = false;
    }
    if (params.disciplineCode) {
      where.group = {
        disciplineCode: params.disciplineCode,
      };
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" as const } },
        { documentNo: { contains: params.search, mode: "insensitive" as const } },
        { originatorCode: { contains: params.search, mode: "insensitive" as const } },
      ];
    }

    const orderBy = {
      [params.sortBy || "createdAt"]: params.sortOrder || "desc",
    };

    const [items, total] = await Promise.all([
      prisma.documentRegister.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy,
        include: {
          project: true,
          originator: true,
          group: { include: { discipline: true } },
          type: true,
          revision: true,
          status: true,
          _count: {
            select: { submissions: true },
          },
        },
      }),
      prisma.documentRegister.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    };
  } catch (e) {
    // Mock fallback is ONLY for the documented "not configured yet" placeholder case —
    // a real DB error (wrong password, network, etc.) must throw and surface as a real
    // error, never be silently replaced with fake data the user has no way to tell apart
    // from real records. This exact confusion (mock data mistaken for live Supabase data)
    // is why the broader "any error" fallback was removed — see chat history 2026-09-02.
    if (process.env.DATABASE_URL?.includes("[YOUR_DB_PASSWORD]")) {
      return filterMockDocuments(params);
    }
    throw e;
  }
}
