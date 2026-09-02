import * as React from "react";
import {
  FileText,
  User,
  History,
  Users,
  PlusCircle,
  Calendar,
  Layers,
  Building,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { useDocument, DocumentRecord, useSyncErp } from "../api/useDocuments";
import { formatDate } from "@/lib/utils";

interface DocumentDetailModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitRevision: (doc: DocumentRecord) => void;
}

export function DocumentDetailModal({
  documentId,
  isOpen,
  onClose,
  onSubmitRevision,
}: DocumentDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const { data: document } = useDocument(documentId);
  const syncErpMutation = useSyncErp();

  if (!documentId) return null;

  const handleToggleErp = () => {
    if (!document) return;
    syncErpMutation.mutate({
      documentId: document.documentId,
      erpSynced: !document.erpSynced,
      receiver: "Document Controller",
    });
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "revisions",
      label: "Revision History",
      badge: document?.submissions?.length || 0,
      icon: <History className="h-4 w-4" />,
    },
    {
      id: "distribution",
      label: "Distribution Matrix",
      badge: document?.distributions?.length || 0,
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document?.documentNo || "Document Details"}
      description={document?.title || "Engineering Document Metadata & Submissions"}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Document Header Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3.5">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-scg-red/10 border border-scg-red/30 p-2 text-scg-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-slate-100">
                  {document?.documentNo}
                </span>
                <span className="rounded bg-blue-950 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-300 border border-blue-800">
                  Rev. {document?.currentRevision}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {document?.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {document && <StatusBadge status={document.currentStatus} />}
            {document && (
              <Button
                variant="scg"
                size="sm"
                onClick={() => {
                  onClose();
                  onSubmitRevision(document);
                }}
                className="text-xs h-8"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Submit Revision
              </Button>
            )}
          </div>
        </div>

        {/* ERP Upload / ConZol DMS Status Card (Supports Document Controllers) */}
        {document && (
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs">
            <div className="flex items-center space-x-2.5">
              {document.erpSynced ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-medium text-slate-200">
                  {document.erpSynced
                    ? "Uploaded & Logged to ConZol DMS / ERP"
                    : "Pending Upload to ConZol DMS / ERP"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {document.erpSynced
                    ? `Recorded at: ${formatDate(document.erpSyncedAt)} by ${document.erpSyncedBy || "Document Controller"}`
                    : "Click button on the right once document is uploaded to ERP"}
                </div>
              </div>
            </div>
            <Button
              variant={document.erpSynced ? "secondary" : "default"}
              size="sm"
              onClick={handleToggleErp}
              disabled={syncErpMutation.isPending}
              className="text-xs h-7 px-2.5"
            >
              {document.erpSynced ? "Mark as Pending" : "Mark as Uploaded to ERP"}
            </Button>
          </div>
        )}

        {/* Tab Bar */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* Discipline & Group */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Layers className="h-3 w-3 text-slate-500" />
                  <span>Discipline / Group</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                  {document?.group?.disciplineCode} — {document?.groupCode}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {document?.group?.groupName}
                </div>
              </div>

              {/* Document Type */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <FileText className="h-3 w-3 text-slate-500" />
                  <span>Document Type</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                  {document?.typeCode}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {document?.type?.typeDescription}
                </div>
              </div>

              {/* Originator */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Building className="h-3 w-3 text-slate-500" />
                  <span>Originator</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                  {document?.originatorCode}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {document?.originator?.originatorName}
                </div>
              </div>

              {/* Project Info */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <CheckCircle className="h-3 w-3 text-slate-500" />
                  <span>Project</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                  {document?.projectCode}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  ConZol: {document?.project?.title || "SKK-IM-CM26002"}
                </div>
              </div>

              {/* Plan Date */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span>Target Plan Date</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                  {formatDate(document?.planDate)}
                </div>
              </div>

              {/* Created By & Date */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <User className="h-3 w-3 text-slate-500" />
                  <span>Created By</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200 truncate">
                  {document?.createdBy}
                </div>
                <div className="text-[11px] text-slate-500">
                  {formatDate(document?.createdAt)}
                </div>
              </div>
            </div>

            {/* Remarks Box */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
              <span className="text-xs font-semibold text-slate-400">Remarks</span>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {document?.remarks || "No additional remarks recorded."}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: REVISION HISTORY / SUBMISSIONS */}
        {activeTab === "revisions" && (
          <div className="space-y-3 pt-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>All transmittal submissions and return codes for this document</span>
              <span className="text-[11px] text-emerald-400 font-medium">
                Replaces 132-column horizontal Excel structure
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="px-3.5 py-2">Rev</th>
                    <th className="px-3.5 py-2">Submitted Date</th>
                    <th className="px-3.5 py-2">Purpose</th>
                    <th className="px-3.5 py-2">Submitted By</th>
                    <th className="px-3.5 py-2">Received By</th>
                    <th className="px-3.5 py-2">Return Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {!document?.submissions || document.submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                        No submissions recorded yet for this document.
                      </td>
                    </tr>
                  ) : (
                    document.submissions.map((sub) => (
                      <tr key={sub.submissionId} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-3.5 py-2 font-bold text-blue-300">
                          {sub.revision}
                        </td>
                        <td className="px-3.5 py-2 text-slate-300">
                          {formatDate(sub.submittedDate)}
                        </td>
                        <td className="px-3.5 py-2 text-slate-300 font-sans">
                          <span className="font-mono font-semibold text-slate-200">
                            {sub.purposeCode}
                          </span>
                          {sub.purpose?.purposeDescription && (
                            <span className="text-[11px] text-slate-400 ml-1.5">
                              ({sub.purpose.purposeDescription})
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-slate-400 font-sans text-xs">
                          {sub.submittedBy}
                        </td>
                        <td className="px-3.5 py-2 text-slate-400 font-sans text-xs">
                          {sub.receivedBy || "-"}
                        </td>
                        <td className="px-3.5 py-2">
                          {sub.returnCode ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                              {sub.returnCode} {sub.returnCodeRef?.returnDescription ? `— ${sub.returnCodeRef.returnDescription}` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DISTRIBUTION MATRIX */}
        {activeTab === "distribution" && (
          <div className="space-y-3 pt-1">
            <div className="text-xs text-slate-400">
              Role Matrix for Group: <span className="font-mono font-bold text-slate-200">{document?.groupCode}</span> ({document?.group?.groupName})
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3.5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[11px] uppercase font-bold text-blue-400">Creator</div>
                  <div className="text-xs text-slate-200 mt-1">Discipline Engineer (ME/EE/CE)</div>
                </div>
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[11px] uppercase font-bold text-amber-400">Reviewer</div>
                  <div className="text-xs text-slate-200 mt-1">Project Engineer & Discipline Lead</div>
                </div>
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[11px] uppercase font-bold text-purple-400">Consolidator</div>
                  <div className="text-xs text-slate-200 mt-1">Document Controller</div>
                </div>
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[11px] uppercase font-bold text-emerald-400">Approver</div>
                  <div className="text-xs text-slate-200 mt-1">Project Manager / PMD / PED</div>
                </div>
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <div className="text-[11px] uppercase font-bold text-slate-400">CC / Distribution</div>
                  <div className="text-xs text-slate-200 mt-1">Site Team & Field Supervisors</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
