import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
    queryFn: () =>
      apiClient<DocumentsResponse>(`/api/v1/documents?${queryParams.toString()}`),
  });
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => apiClient<DocumentRecord>(`/api/v1/documents/${id}`),
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
    queryFn: () =>
      apiClient<{ documentNo: string }>(
        `/api/v1/numbering/preview?projectCode=${params.projectCode}&originatorCode=${params.originatorCode}&groupCode=${params.groupCode}&typeCode=${params.typeCode}`
      ),
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
