import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import mockDocuments from "./mockDocuments.json";

const STORAGE_KEY = "kk4_local_documents_data_v1";

export interface DocumentSubmission {
  submissionId: string;
  documentId: string;
  revision: string;
  submittedDate: string;
  purposeCode: string;
  submittedBy: string;
  receivedBy?: string | null;
  returnCode?: string | null;
  attachmentUrl?: string | null;
  erpSynced?: boolean;
  erpSyncedAt?: string | null;
  erpSyncedBy?: string | null;
  erpDocId?: string | null;
  createdAt: string;
  revisionRef?: { revisionCode: string; revisionDescription: string };
  purpose?: { purposeCode: string; purposeDescription: string };
  returnCodeRef?: { returnCode: string; returnDescription: string };
}

export interface RoleAssignment {
  id: string;
  userId: string;
  groupCode: string;
  role: "CREATOR" | "REVIEWER" | "CONSOLIDATOR" | "APPROVER" | "CC";
}

export interface DocumentRecord {
  documentId: string;
  documentNo: string;
  projectCode: string;
  title: string;
  originatorCode: string;
  groupCode: string;
  typeCode: string;
  currentRevision: string;
  currentStatus: string;
  planDate?: string | null;
  remarks?: string | null;
  erpSynced: boolean;
  erpSyncedAt?: string | null;
  erpSyncedBy?: string | null;
  erpDocId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string;
  project?: { projectCode: string; title: string };
  originator?: { originatorCode: string; originatorName: string };
  group?: {
    groupCode: string;
    groupName: string;
    disciplineCode: string;
    discipline?: { disciplineCode: string; disciplineName: string };
  };
  type?: { typeCode: string; typeDescription: string };
  revision?: { revisionCode: string; revisionDescription: string };
  status?: { statusCode: string; statusName: string };
  submissions?: DocumentSubmission[];
  distributions?: RoleAssignment[];
  _count?: { submissions: number };
}

export interface DocumentsResponse {
  items: DocumentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListDocumentsParams {
  projectCode?: string;
  disciplineCode?: string;
  groupCode?: string;
  typeCode?: string;
  status?: string;
  originatorCode?: string;
  erpSynced?: "true" | "false" | "all";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CreateDocumentPayload {
  projectCode: string;
  title: string;
  originatorCode: string;
  groupCode: string;
  typeCode: string;
  planDate?: string | null;
  remarks?: string | null;
  initialRevision?: string;
  initialPurpose?: string;
  initialReceiver?: string;
}

export interface SubmitRevisionPayload {
  documentId: string;
  revision: string;
  submittedDate: string;
  purposeCode: string;
  submittedBy: string;
  receivedBy?: string | null;
  returnCode?: string | null;
  attachmentUrl?: string | null;
  updateDocumentStatus?: string;
  erpSynced?: boolean;
}

// Local Storage Helper
function getStoredDocuments(): DocumentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read local documents:", e);
  }
  // Initialize with mockDocuments
  const initial = (mockDocuments as DocumentRecord[]).map((d) => ({
    ...d,
    erpSynced: d.erpSynced ?? false,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveStoredDocuments(docs: DocumentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn("Failed to save local documents:", e);
  }
}

function filterDocuments(docs: DocumentRecord[], params: ListDocumentsParams): DocumentsResponse {
  let items = [...docs];
  if (params.projectCode) items = items.filter((d) => d.projectCode === params.projectCode);
  if (params.groupCode) items = items.filter((d) => d.groupCode === params.groupCode);
  if (params.typeCode) items = items.filter((d) => d.typeCode === params.typeCode);
  if (params.status) items = items.filter((d) => d.currentStatus === params.status);
  if (params.disciplineCode) {
    items = items.filter(
      (d) =>
        d.group?.disciplineCode === params.disciplineCode ||
        d.groupCode.startsWith(params.disciplineCode!)
    );
  }
  if (params.erpSynced === "true") items = items.filter((d) => d.erpSynced);
  if (params.erpSynced === "false") items = items.filter((d) => !d.erpSynced);
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (d) =>
        d.documentNo.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.groupCode.toLowerCase().includes(q)
    );
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 500;
  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);
  return { items: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export function useDocuments(params: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: async () => {
      // 1. Try Backend API first if available
      try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            queryParams.set(key, String(value));
          }
        });
        const res = await apiClient<DocumentsResponse>(`/api/v1/documents?${queryParams.toString()}`);
        if (res && res.items && res.items.length > 0) {
          saveStoredDocuments(res.items);
          return res;
        }
      } catch {
        // Fallback to local persistent storage
      }

      const localDocs = getStoredDocuments();
      return filterDocuments(localDocs, params);
    },
  });
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await apiClient<DocumentRecord>(`/api/v1/documents/${id}`);
      } catch {
        const docs = getStoredDocuments();
        return docs.find((d) => d.documentId === id) || null;
      }
    },
    enabled: !!id,
  });
}

export function usePreviewDocumentNumber(
  params: {
    projectCode?: string;
    originatorCode?: string;
    groupCode?: string;
    typeCode?: string;
  },
  enabled = true
) {
  const canQuery =
    enabled &&
    !!params.projectCode &&
    !!params.originatorCode &&
    !!params.groupCode &&
    !!params.typeCode;

  return useQuery({
    queryKey: ["numbering", "preview", params],
    queryFn: async () => {
      const prefix = `${params.projectCode}-${params.originatorCode}-${params.groupCode}-${params.typeCode}-`;
      const docs = getStoredDocuments();
      const matching = docs.filter((d) => d.documentNo.startsWith(prefix));
      const maxSeq = matching
        .map((d) => parseInt(d.documentNo.slice(-4), 10))
        .reduce((m, n) => Math.max(m, isNaN(n) ? 0 : n), 0);
      const nextSeq = String(maxSeq + 1).padStart(4, "0");
      return { documentNo: `${prefix}${nextSeq}` };
    },
    enabled: canQuery,
    staleTime: 1000,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDocumentPayload) => {
      const docs = getStoredDocuments();
      const prefix = `${payload.projectCode}-${payload.originatorCode}-${payload.groupCode}-${payload.typeCode}-`;
      const maxSeq = docs
        .filter((d) => d.documentNo.startsWith(prefix))
        .map((d) => parseInt(d.documentNo.slice(-4), 10))
        .reduce((m, n) => Math.max(m, isNaN(n) ? 0 : n), 0);
      const nextSeq = String(maxSeq + 1).padStart(4, "0");
      const documentNo = `${prefix}${nextSeq}`;

      const newDoc: DocumentRecord = {
        documentId: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        documentNo,
        projectCode: payload.projectCode,
        title: payload.title,
        originatorCode: payload.originatorCode,
        groupCode: payload.groupCode,
        typeCode: payload.typeCode,
        currentRevision: payload.initialRevision || "00",
        currentStatus: "APPROVED",
        planDate: payload.planDate,
        remarks: payload.remarks,
        erpSynced: false,
        erpSyncedAt: null,
        erpSyncedBy: null,
        createdBy: "Engineer",
        createdAt: new Date().toISOString(),
        group: {
          groupCode: payload.groupCode,
          groupName: payload.title,
          disciplineCode: payload.groupCode.startsWith("EXM")
            ? "EXM"
            : payload.groupCode.startsWith("EXE")
            ? "EXE"
            : payload.groupCode.startsWith("EXC")
            ? "EXC"
            : payload.groupCode.startsWith("SHE")
            ? "SHE"
            : payload.groupCode.slice(0, 2),
        },
        type: {
          typeCode: payload.typeCode,
          typeDescription: payload.typeCode,
        },
        submissions: [
          {
            submissionId: `sub-${Date.now()}`,
            documentId: "",
            revision: payload.initialRevision || "00",
            submittedDate: payload.planDate || new Date().toISOString(),
            purposeCode: payload.initialPurpose || "IFI",
            submittedBy: "Engineer",
            receivedBy: payload.initialReceiver || "Owner",
            erpSynced: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      docs.unshift(newDoc);
      saveStoredDocuments(docs);

      // Best effort API sync
      try {
        await apiClient<DocumentRecord>("/api/v1/documents", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch {
        // saved in local storage
      }

      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useSubmitRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, ...payload }: SubmitRevisionPayload) => {
      const docs = getStoredDocuments();
      const doc = docs.find((d) => d.documentId === documentId);
      if (doc) {
        doc.currentRevision = payload.revision;
        doc.erpSynced = false;
        doc.erpSyncedAt = null;
        if (!doc.submissions) doc.submissions = [];
        doc.submissions.unshift({
          submissionId: `sub-${Date.now()}`,
          documentId,
          revision: payload.revision,
          submittedDate: payload.submittedDate,
          purposeCode: payload.purposeCode,
          submittedBy: payload.submittedBy || "Engineer",
          receivedBy: payload.receivedBy || "Owner",
          returnCode: payload.returnCode,
          erpSynced: false,
          createdAt: new Date().toISOString(),
        });
        saveStoredDocuments(docs);
      }

      try {
        await apiClient<DocumentSubmission>(`/api/v1/documents/${documentId}/submissions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch {
        // saved in local storage
      }
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useSyncErp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      erpSynced,
      receiver,
    }: {
      documentId: string;
      erpSynced: boolean;
      receiver?: string;
    }) => {
      // 1. Immediately update in local storage
      const docs = getStoredDocuments();
      const doc = docs.find((d) => d.documentId === documentId);
      if (doc) {
        doc.erpSynced = erpSynced;
        doc.erpSyncedAt = erpSynced ? new Date().toISOString() : null;
        doc.erpSyncedBy = erpSynced ? receiver || "Admin" : null;
        saveStoredDocuments(docs);
      }

      // 2. Best-effort API call
      try {
        await apiClient<DocumentRecord>(`/api/v1/documents/${documentId}/erp-sync`, {
          method: "POST",
          body: JSON.stringify({ erpSynced, receiver }),
        });
      } catch {
        // offline mode supported
      }

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useBatchSyncErp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentIds,
      erpSynced,
      receiver,
    }: {
      documentIds: string[];
      erpSynced: boolean;
      receiver?: string;
    }) => {
      const docs = getStoredDocuments();
      const idSet = new Set(documentIds);
      docs.forEach((doc) => {
        if (idSet.has(doc.documentId)) {
          doc.erpSynced = erpSynced;
          doc.erpSyncedAt = erpSynced ? new Date().toISOString() : null;
          doc.erpSyncedBy = erpSynced ? receiver || "Admin" : null;
        }
      });
      saveStoredDocuments(docs);

      try {
        await apiClient<{ count: number; erpSynced: boolean }>("/api/v1/documents/batch-erp-sync", {
          method: "POST",
          body: JSON.stringify({ documentIds, erpSynced, receiver }),
        });
      } catch {
        // offline mode supported
      }

      return { count: documentIds.length, erpSynced };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
