import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Discipline {
  disciplineCode: string;
  disciplineName: string;
  active: boolean;
}

export interface DocumentGroup {
  groupCode: string;
  groupName: string;
  disciplineCode: string;
  active: boolean;
}

export interface DocumentType {
  typeCode: string;
  typeDescription: string;
  active: boolean;
}

export interface Originator {
  originatorCode: string;
  originatorName: string;
  active: boolean;
}

export interface StatusItem {
  statusCode: string;
  statusName: string;
  active: boolean;
}

export interface Project {
  projectCode: string;
  conzolProjectCode: string;
  title: string;
  plant: string;
  phase: string;
  projectType: string;
  active: boolean;
}

export interface RevisionItem {
  revisionCode: string;
  revisionDescription: string;
  active: boolean;
}

export interface ReturnCodeItem {
  returnCode: string;
  returnDescription: string;
  active: boolean;
}

export interface PurposeItem {
  purposeCode: string;
  purposeDescription: string;
  active: boolean;
}

export interface AllMasterData {
  projects: Project[];
  disciplines: Discipline[];
  groups: DocumentGroup[];
  types: DocumentType[];
  groupTypeMappings: { groupCode: string; typeCode: string }[];
  originators: Originator[];
  statuses: StatusItem[];
  revisions: RevisionItem[];
  returnCodes: ReturnCodeItem[];
  purposes: PurposeItem[];
}

export function useAllMasterData() {
  return useQuery({
    queryKey: ["master-data", "all"],
    queryFn: () => apiClient<AllMasterData>("/api/v1/master-data/all"),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useDisciplines() {
  return useQuery({
    queryKey: ["master-data", "disciplines"],
    queryFn: () => apiClient<Discipline[]>("/api/v1/master-data/disciplines"),
  });
}

export function useGroups(disciplineCode?: string) {
  return useQuery({
    queryKey: ["master-data", "groups", disciplineCode],
    queryFn: () =>
      apiClient<DocumentGroup[]>(
        `/api/v1/master-data/groups${disciplineCode ? `?disciplineCode=${disciplineCode}` : ""}`
      ),
  });
}

export function useTypes(groupCode?: string) {
  return useQuery({
    queryKey: ["master-data", "types", groupCode],
    queryFn: () =>
      apiClient<DocumentType[]>(
        `/api/v1/master-data/types${groupCode ? `?groupCode=${groupCode}` : ""}`
      ),
  });
}

export function useOriginators() {
  return useQuery({
    queryKey: ["master-data", "originators"],
    queryFn: () => apiClient<Originator[]>("/api/v1/master-data/originators"),
  });
}
