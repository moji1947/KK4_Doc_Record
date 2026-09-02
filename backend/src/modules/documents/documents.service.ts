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

const DEFAULT_INITIAL_REVISION = "00";
const DEFAULT_INITIAL_STATUS = "DRAFT";

export async function createDocument(input: CreateDocumentInput, createdBy: string) {
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
}

export async function listDocuments(params: ListDocumentsQuery) {
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
}
