import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import mockDocuments from "./mockDocuments.json";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "https://fknljpbychwmhgdufbvb.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Y8v-7RTSuCR2y0vIlO4hjA_eGdPI8iM";

async function fetchSupabaseDocuments(params: ListDocumentsParams): Promise<DocumentsResponse | null> {
  try {
    const url = new URL(`${SUPABASE_URL!}/rest/v1/document_register`);
    url.searchParams.set("select", "*,project:project_master(*),originator:originator_master(*),group:document_group_master(*,discipline:discipline_master(*)),type:document_type_master(*),revision:revision_master!document_register_current_revision_fkey(*),status:status_master!document_register_current_status_fkey(*)");
    if (params.projectCode) url.searchParams.set("project_code", `eq.${params.projectCode}`);
    if (params.groupCode) url.searchParams.set("group_code", `eq.${params.groupCode}`);
    if (params.typeCode) url.searchParams.set("type_code", `eq.${params.typeCode}`);
    if (params.status) url.searchParams.set("current_status", `eq.${params.status}`);
    if (params.search) url.searchParams.set("or", `(document_no.ilike.*${params.search}*,title.ilike.*${params.search}*)`);
    url.searchParams.set("order", `${params.sortBy || "created_at"}.${params.sortOrder || "desc"}`);
    const page = params.page || 1;
    const pageSize = params.pageSize || 300;
    url.searchParams.set("offset", String((page - 1) * pageSize));
    url.searchParams.set("limit", String(pageSize));

    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    // Supabase returns flat rows; map to DocumentRecord shape (best-effort)
    const items = data.map((r: Record<string, unknown>) => ({
      documentId: r.document_id,
      documentNo: r.document_no,
      projectCode: r.project_code,
      title: r.title,
      originatorCode: r.originator_code,
      groupCode: r.group_code,
      typeCode: r.type_code,
      currentRevision: r.current_revision,
      currentStatus: r.current_status,
      planDate: r.plan_date,
      remarks: r.remarks,
      erpSynced: r.erp_synced,
      erpSyncedAt: r.erp_synced_at,
      erpSyncedBy: r.erp_synced_by,
      erpDocId: r.erp_doc_id,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      project: (r as Record<string,unknown>).project,
      originator: (r as Record<string,unknown>).originator,
      group: (r as Record<string,unknown>).group,
      type: (r as Record<string,unknown>).type,
      revision: (r as Record<string,unknown>).revision,
      status: (r as Record<string,unknown>).status,
    })) as DocumentRecord[];
    const total = items.length;
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch {
    return null;
  }
}

function filterMockDocuments(params: ListDocumentsParams): DocumentsResponse {
  let items = [...(mockDocuments as DocumentRecord[])];
  if (params.projectCode) items = items.filter(d => d.projectCode === params.projectCode);
  if (params.groupCode) items = items.filter(d => d.groupCode === params.groupCode);
  if (params.typeCode) items = items.filter(d => d.typeCode === params.typeCode);
  if (params.status) items = items.filter(d => d.currentStatus === params.status);
  if (params.disciplineCode) items = items.filter(d => d.group?.disciplineCode === params.disciplineCode || d.groupCode.startsWith(params.disciplineCode!));
  if (params.erpSynced === "true") items = items.filter(d => d.erpSynced);
  if (params.erpSynced === "false") items = items.filter(d => !d.erpSynced);
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(d => d.documentNo.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || d.groupCode.toLowerCase().includes(q));
  }
  // sort
  const sortBy = params.sortBy || "createdAt";
  const order = params.sortOrder || "desc";
  items.sort((a,b) => {
    const av = String((a as unknown as Record<string,unknown>)[sortBy] ?? "");
    const bv = String((b as unknown as Record<string,unknown>)[sortBy] ?? "");
    return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  const page = params.page || 1;
  const pageSize = params.pageSize || 300;
  const total = items.length;
  const paged = items.slice((page-1)*pageSize, page*pageSize);
  return { items: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

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
  updatedAt: string;
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

export function useDocuments(params: ListDocumentsParams = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      queryParams.set(key, String(value));
    }
  });

  return useQuery({
    queryKey: ["documents", params],
    queryFn: async () => {
      // 1) Try backend API
      try {
        return await apiClient<DocumentsResponse>(`/api/v1/documents?${queryParams.toString()}`);
      } catch (e) {
        // 2) Try Supabase REST directly (if tables already migrated)
        const sb = await fetchSupabaseDocuments(params);
        if (sb && sb.items.length > 0) return sb;
        // 3) Fallback to local mock from KK4-All.xlsx (176 docs) — always works offline
        console.warn("[useDocuments] backend unavailable, using mockDocuments fallback", e);
        return filterMockDocuments(params);
      }
    },
  });
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      try {
        return await apiClient<DocumentRecord>(`/api/v1/documents/${id}`);
      } catch {
        const mock = (mockDocuments as DocumentRecord[]).find(d => d.documentId === id);
        if (mock) return mock;
        throw new Error("Document not found in mock");
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
      try {
        return await apiClient<{ documentNo: string }>(
          `/api/v1/numbering/preview?projectCode=${params.projectCode}&originatorCode=${params.originatorCode}&groupCode=${params.groupCode}&typeCode=${params.typeCode}`
        );
      } catch {
        // Fallback: compute next sequence from mockDocuments
        const prefix = `${params.projectCode}-${params.originatorCode}-${params.groupCode}-${params.typeCode}-`;
        const max = (mockDocuments as DocumentRecord[])
          .filter(d => d.documentNo.startsWith(prefix))
          .map(d => parseInt(d.documentNo.slice(-4), 10))
          .reduce((m, n) => Math.max(m, isNaN(n) ? 0 : n), 0);
        const next = String(max + 1).padStart(4, "0");
        return { documentNo: `${prefix}${next}` };
      }
    },
    enabled: canQuery,
    staleTime: 1000 * 5,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) =>
      apiClient<DocumentRecord>("/api/v1/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useSubmitRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, ...payload }: SubmitRevisionPayload) =>
      apiClient<DocumentSubmission>(`/api/v1/documents/${documentId}/submissions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
    },
  });
}

export function useSyncErp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      erpSynced,
      receiver,
    }: {
      documentId: string;
      erpSynced: boolean;
      receiver?: string;
    }) =>
      apiClient<DocumentRecord>(`/api/v1/documents/${documentId}/erp-sync`, {
        method: "POST",
        body: JSON.stringify({ erpSynced, receiver }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
    },
  });
}

export function useBatchSyncErp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentIds,
      erpSynced,
      receiver,
    }: {
      documentIds: string[];
      erpSynced: boolean;
      receiver?: string;
    }) =>
      apiClient<{ count: number; erpSynced: boolean }>("/api/v1/documents/batch-erp-sync", {
        method: "POST",
        body: JSON.stringify({ documentIds, erpSynced, receiver }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
