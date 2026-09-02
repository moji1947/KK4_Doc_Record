import * as React from "react";
import {
  Search,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sparkles,
  ExternalLink,
  History,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { DocumentRecord, useCreateDocument, useSyncErp, usePreviewDocumentNumber } from "../api/useDocuments";
import { formatDate } from "@/lib/utils";

// Pre-defined smart groups from KK4-All.xlsx
const SMART_GROUPS = [
  { code: "ME06-FD", disc: "ME", group: "ME06", type: "FD", name: "ME06 — Fabrication Drawing (FD)" },
  { code: "ME02-GA", disc: "ME", group: "ME02", type: "GA", name: "ME02 — General Arrangement Drawing (GA)" },
  { code: "ME03-FS", disc: "ME", group: "ME03", type: "FS", name: "ME03 — Process Flowsheet (FS)" },
  { code: "ME04-LD", disc: "ME", group: "ME04", type: "LD", name: "ME04 — Load Data (LD)" },
  { code: "ME05-MHB", disc: "ME", group: "ME05", type: "MHB", name: "ME05 — Mass & Heat Balance (MHB)" },
  { code: "EXM00-SHD", disc: "EXM", group: "EXM00", type: "SHD", name: "EXM00 — Shop Drawing (Mechanical)" },
  { code: "EXM01-MTS", disc: "EXM", group: "EXM01", type: "MTS", name: "EXM01 — Method Statement (Mechanical)" },
  { code: "EXM02-MTA", disc: "EXM", group: "EXM02", type: "MTA", name: "EXM02 — Material Approval (Mechanical)" },
  { code: "EXE00-SHD", disc: "EXE", group: "EXE00", type: "SHD", name: "EXE00 — Shop Drawing (Electrical)" },
  { code: "EXE01-MTS", disc: "EXE", group: "EXE01", type: "MTS", name: "EXE01 — Method Statement (Electrical)" },
  { code: "EXC00-SHD", disc: "EXC", group: "EXC00", type: "SHD", name: "EXC00 — Shop Drawing (Civil)" },
  { code: "EXC01-MTS", disc: "EXC", group: "EXC01", type: "MTS", name: "EXC01 — Method Statement (Civil)" },
  { code: "CE01-CIF", disc: "CE", group: "CE01", type: "CIF", name: "CE01 — Soil Investigation Report (CIF)" },
  { code: "CE14-DDD", disc: "CE", group: "CE14", type: "DDD", name: "CE14 — Civil Drawing (DDD)" },
  { code: "EE01-EXL", disc: "EE", group: "EE01", type: "EXL", name: "EE01 — Procurement List - Instrument (EXL)" },
  { code: "EE02-TYD", disc: "EE", group: "EE02", type: "TYD", name: "EE02 — Typical Drawing - MCC CL Bypass (TYD)" },
  { code: "EE03-SLD", disc: "EE", group: "EE03", type: "SLD", name: "EE03 — Single Line Diagram (SLD)" },
  { code: "EE05-CBL", disc: "EE", group: "EE05", type: "CBL", name: "EE05 — Cable List (CBL)" },
  { code: "SHE01-JSA", disc: "SHE", group: "SHE01", type: "JSA", name: "SHE01 — Job Safety Analysis (JSA)" },
  { code: "SHE02-WPK", disc: "SHE", group: "SHE02", type: "WPK", name: "SHE02 — Work Permit (WPK)" },
  { code: "CP04-TOR", disc: "PRC", group: "CP04", type: "REP", name: "CP04 — TOR งานจ้างเหมา (PRC)" },
  { code: "PJ01-INV", disc: "PJ", group: "PJ01", type: "INV", name: "PJ01 — Project Study Report (INV)" },
  { code: "PJ14-CR", disc: "PJ", group: "PJ14", type: "CR", name: "PJ14 — Change Order (CR)" },
  { code: "VD01-TYD", disc: "VD", group: "VD01", type: "TYD", name: "VD01 — Taweechaiwat Drag Chain" },
  { code: "VD04-SPE", disc: "VD", group: "VD04", type: "SPE", name: "VD04 — TKC Spare Part List" },
  { code: "VD05-DWG", disc: "VD", group: "VD05", type: "DWG", name: "VD05 — TN Group Cooling Air Fan" },
];

interface SpreadsheetViewProps {
  documents: DocumentRecord[];
  isLoading: boolean;
  isError?: boolean;
  onSelectDocument: (doc: DocumentRecord) => void;
  onSubmitRevision: (doc: DocumentRecord) => void;
  onRefresh: () => void;
}

export function SpreadsheetView({
  documents,
  isLoading,
  isError,
  onSelectDocument,
  onSubmitRevision,
  onRefresh,
}: SpreadsheetViewProps) {
  const [activeSheet, setActiveSheet] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [conzolFilter, setConzolFilter] = React.useState<"ALL" | "PENDING" | "SYNCED">("ALL");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Smart Combined Input State
  const [smartCombinedCode, setSmartCombinedCode] = React.useState("ME06-FD");
  const [parsedDisc, setParsedDisc] = React.useState("ME");
  const [parsedGroup, setParsedGroup] = React.useState("ME06");
  const [parsedType, setParsedType] = React.useState("FD");
  const [newTitle, setNewTitle] = React.useState("");
  const [newRev, setNewRev] = React.useState("00");
  const [newReceiver, setNewReceiver] = React.useState("Owner");
  const [newPlanDate, setNewPlanDate] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(true);

  const createDocMutation = useCreateDocument();
  const syncErpMutation = useSyncErp();

  // Smart Parser: Parses combined code into Disc, Group, Type automatically!
  const handleCombinedCodeChange = (input: string) => {
    setSmartCombinedCode(input);
    const cleaned = input.trim().toUpperCase();

    // Check pre-defined first
    const matched = SMART_GROUPS.find((g) => g.code === cleaned || g.group === cleaned);
    if (matched) {
      setParsedDisc(matched.disc);
      setParsedGroup(matched.group);
      setParsedType(matched.type);
      return;
    }

    // Auto-parse patterns like ME06-FD or EXM01-MTS or CM24045-EPS-ME06-FD
    let group = "";
    let type = "DWG";
    let disc = "PJ";

    const parts = cleaned.replace("CM24045-EPS-", "").split("-");
    if (parts.length >= 2) {
      group = parts[0];
      type = parts[1];
    } else if (parts.length === 1 && parts[0]) {
      group = parts[0];
      if (group.startsWith("EXM") || group.startsWith("EXE") || group.startsWith("EXC")) type = "SHD";
      else if (group.startsWith("SHE")) type = "JSA";
      else if (group.startsWith("ME")) type = "FD";
      else if (group.startsWith("EE")) type = "TYD";
      else if (group.startsWith("CE")) type = "DDD";
    }

    if (group.startsWith("EXM")) disc = "EXM";
    else if (group.startsWith("EXE")) disc = "EXE";
    else if (group.startsWith("EXC")) disc = "EXC";
    else if (group.startsWith("EX")) disc = "EX";
    else if (group.startsWith("SHE")) disc = "SHE";
    else if (group.startsWith("CP")) disc = "PRC";
    else if (group.startsWith("PJ")) disc = "PJ";
    else if (group.startsWith("ME")) disc = "ME";
    else if (group.startsWith("EE")) disc = "EE";
    else if (group.startsWith("CE")) disc = "CE";
    else if (group.startsWith("VD")) disc = "VD";

    setParsedDisc(disc);
    setParsedGroup(group || "ME06");
    setParsedType(type || "FD");
  };

  // Auto-calculated next 4-digit Sequence Number Preview
  const { data: previewData } = usePreviewDocumentNumber({
    projectCode: "CM24045",
    originatorCode: "EPS",
    groupCode: parsedGroup,
    typeCode: parsedType,
  });

  const copyToClipboard = (text: string, docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleConzol = (doc: DocumentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    syncErpMutation.mutate({
      documentId: doc.documentId,
      erpSynced: !doc.erpSynced,
      receiver: "Document Controller",
    });
  };

  // Filtered documents by Sheet, Search, and ConZoL Status
  const filteredDocs = React.useMemo(() => {
    return documents.filter((doc) => {
      // Sheet filter
      if (activeSheet !== "ALL") {
        const disc = doc.group?.disciplineCode || "";
        if (disc !== activeSheet && !doc.groupCode.startsWith(activeSheet)) return false;
      }

      // ConZoL Status filter
      if (conzolFilter === "PENDING" && doc.erpSynced) return false;
      if (conzolFilter === "SYNCED" && !doc.erpSynced) return false;

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNo = doc.documentNo.toLowerCase().includes(q);
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchGroup = doc.groupCode.toLowerCase().includes(q);
        const matchType = doc.typeCode.toLowerCase().includes(q);
        if (!matchNo && !matchTitle && !matchGroup && !matchType) return false;
      }

      return true;
    });
  }, [documents, activeSheet, conzolFilter, searchTerm]);

  // Handle Quick Add Row
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("กรุณาระบุชื่อเอกสาร (Document Title)");
      return;
    }

    await createDocMutation.mutateAsync({
      projectCode: "CM24045",
      originatorCode: "EPS",
      groupCode: parsedGroup.toUpperCase().trim(),
      typeCode: parsedType.toUpperCase().trim(),
      title: newTitle.trim(),
      initialRevision: newRev.trim() || "00",
      initialPurpose: "IFI",
      initialReceiver: newReceiver,
      planDate: newPlanDate ? new Date(newPlanDate).toISOString() : null,
    });

    setNewTitle("");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Discipline",
      "Group",
      "Type",
      "Document No",
      "Title",
      "Rev",
      "ConZoL Status",
      "Uploaded Date",
      "Uploaded By",
      "Plan Date",
      "Remarks",
    ];
    const rows = filteredDocs.map((d, idx) => [
      idx + 1,
      d.group?.disciplineCode || "",
      d.groupCode,
      d.typeCode,
      d.documentNo,
      `"${d.title.replace(/"/g, '""')}"`,
      d.currentRevision,
      d.erpSynced ? "Uploaded" : "Pending ConZoL",
      d.erpSyncedAt ? formatDate(d.erpSyncedAt) : "",
      d.erpSyncedBy || "",
      formatDate(d.planDate),
      `"${(d.remarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `KK4_Document_Register_${activeSheet}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Counts for Sheet tabs
  const countFor = (disc: string) =>
    documents.filter((d) => d.group?.disciplineCode === disc || d.groupCode.startsWith(disc)).length;
  const pendingCount = documents.filter((d) => !d.erpSynced).length;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden font-sans text-slate-800">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 gap-2">
        {/* Left: Search & ConZoL Filter */}
        <div className="flex items-center space-x-2 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in sheet (Doc No, Title, Group, Type)..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Quick ConZoL Filter */}
          <div className="flex items-center space-x-1 bg-slate-200/70 p-0.5 rounded-md text-xs shrink-0">
            <button
              onClick={() => setConzolFilter("ALL")}
              className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                conzolFilter === "ALL" ? "bg-white text-slate-800 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setConzolFilter("PENDING")}
              className={`px-2.5 py-1 rounded font-medium text-xs transition-colors flex items-center space-x-1 ${
                conzolFilter === "PENDING"
                  ? "bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-sm"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Pending ConZoL ({pendingCount})</span>
            </button>
            <button
              onClick={() => setConzolFilter("SYNCED")}
              className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                conzolFilter === "SYNCED" ? "bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 shadow-sm" : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              Uploaded
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? "Hide Register Bar" : "+ Register New Document"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs shadow-sm transition-all"
            title="Export Sheet to Excel (.csv)"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* SMART COMBINED INPUT & AUTO 4-DIGIT SEQUENCE ENGINE */}
      {showAddForm && (
        <form
          onSubmit={handleQuickAdd}
          className="border-b-2 border-emerald-500 bg-emerald-50/60 p-4 space-y-3.5 animate-in slide-in-from-top-2"
        >
          {/* Top Banner: Real-time Auto-Calculated 4-Digit Document Number */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-2 rounded-lg border border-emerald-300 shadow-xs">
            <div className="flex items-center space-x-2 text-xs text-emerald-900 font-bold">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Smart Register (กรอกรหัสรวม ➡️ แยกอัตโนมัติ ➡️ ต่อเลข 4 หลักท้าย)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-sans">Next Auto Number:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {previewData?.documentNo || `CM24045-EPS-${parsedGroup}-${parsedType}-0001`}
              </span>
            </div>
          </div>

          {/* Form Fields: Smart Combined Input -> Auto-parsed badges */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-end">
            {/* 1. Smart Combined Code Input */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                <span>1. กรอกรหัสรวม หรือเลือกกลุ่ม *</span>
                <span className="text-[10px] text-emerald-700 font-normal">เช่น ME06-FD, EXM00, CE14</span>
              </label>
              <div className="relative">
                <input
                  list="smart-group-options"
                  type="text"
                  required
                  value={smartCombinedCode}
                  onChange={(e) => handleCombinedCodeChange(e.target.value)}
                  placeholder="พิมพ์หรือเลือกรหัสกลุ่ม เช่น ME06-FD หรือ EXM00..."
                  className="w-full h-9 rounded-md border border-slate-300 px-3 font-mono font-bold text-xs bg-white text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <datalist id="smart-group-options">
                  {SMART_GROUPS.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Auto-Parsed Preview Badges (Visual Confirmation) */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                ระบบแยกให้อัตโนมัติ:
              </label>
              <div className="flex items-center space-x-1.5 h-9 px-2 bg-slate-100 rounded-md border border-slate-200 font-mono text-xs">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200" title="Discipline">
                  {parsedDisc}
                </span>
                <span className="text-slate-400">/</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200" title="Group (Full Execution Group)">
                  {parsedGroup}
                </span>
                <span className="text-slate-400">/</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200" title="Type">
                  {parsedType}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold text-emerald-700 font-mono text-[11px]">
                  {previewData?.documentNo?.slice(-4) || "0001"}
                </span>
              </div>
            </div>

            {/* 2. Document Title */}
            <div className="md:col-span-5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                2. ชื่อเอกสาร (Document Title) *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Trolley Satellite Burner Fabrication & Assembly Drawing"
                className="w-full h-9 rounded-md border border-slate-300 px-3 text-xs bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Secondary Row: Rev, Receiver, Plan Date, Submit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-3 text-xs items-end pt-1">
            {/* Rev */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Rev</label>
              <input
                type="text"
                value={newRev}
                onChange={(e) => setNewRev(e.target.value)}
                placeholder="00"
                className="w-full h-8 rounded border border-slate-300 px-2 font-mono text-xs bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Receiver */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Receiver</label>
              <input
                type="text"
                value={newReceiver}
                onChange={(e) => setNewReceiver(e.target.value)}
                placeholder="Owner"
                className="w-full h-8 rounded border border-slate-300 px-2 text-xs bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Plan Date */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Plan Date</label>
              <input
                type="date"
                value={newPlanDate}
                onChange={(e) => setNewPlanDate(e.target.value)}
                className="w-full h-8 rounded border border-slate-300 px-2 text-xs bg-white focus:border-emerald-500 focus:outline-none text-slate-700"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-4 flex items-center justify-end space-x-2">
              <button
                type="submit"
                disabled={createDocMutation.isPending}
                className="w-full h-8 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>{createDocMutation.isPending ? "Generating..." : "Save Row & Auto Issue 4-Digit No."}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SPREADSHEET TABLE GRID (Google Sheets / Excel Style) */}
      <div className="overflow-x-auto max-h-[calc(100vh-18rem)]">
        <table className="w-full sheet-grid border-collapse bg-white">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="sheet-cell-header w-10 text-center">#</th>
              <th className="sheet-cell-header w-16 text-center">Disc</th>
              <th className="sheet-cell-header w-20 text-center">Group</th>
              <th className="sheet-cell-header w-16 text-center">Type</th>
              <th className="sheet-cell-header min-w-[240px]">Document No. (Auto ID)</th>
              <th className="sheet-cell-header min-w-[320px]">Document Title</th>
              <th className="sheet-cell-header w-14 text-center">Rev</th>
              <th className="sheet-cell-header w-36 text-center">ConZoL Status</th>
              <th className="sheet-cell-header w-28 text-center">Plan Date</th>
              <th className="sheet-cell-header w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isError ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-rose-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-xs font-semibold">
                      Couldn't load the register — the server may be unreachable.
                    </span>
                    <button
                      onClick={onRefresh}
                      className="mt-1 px-3 py-1 rounded-md border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400 text-xs font-medium">
                  Loading spreadsheet records...
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400 text-xs font-medium">
                  No documents found in sheet "{activeSheet}" matching your filter
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc, idx) => {
                const isCopied = copiedId === doc.documentId;
                const isPending = !doc.erpSynced;

                return (
                  <tr
                    key={doc.documentId}
                    onClick={() => onSelectDocument(doc)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      isPending ? "bg-amber-50/40" : ""
                    }`}
                  >
                    {/* Row Number */}
                    <td className="sheet-cell sheet-row-number">{idx + 1}</td>

                    {/* Disc */}
                    <td className="sheet-cell text-center font-mono font-bold text-slate-700 bg-slate-50/60">
                      {doc.group?.disciplineCode || "-"}
                    </td>

                    {/* Group (Preserves full 4-5 chars e.g. EXM00, EXE01, ME06) */}
                    <td className="sheet-cell text-center font-mono font-semibold text-slate-800">
                      {doc.groupCode}
                    </td>

                    {/* Type */}
                    <td className="sheet-cell text-center font-mono font-bold text-slate-900 bg-slate-50/60">
                      {doc.typeCode}
                    </td>

                    {/* Document Number with 1-Click Copy */}
                    <td className="sheet-cell font-mono font-bold text-blue-700 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 justify-between group/num">
                        <span>{doc.documentNo}</span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(doc.documentNo, doc.documentId, e)}
                          title="Click to copy Doc No into ConZoL (Paste without typing error)"
                          className="opacity-70 hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-all"
                        >
                          {isCopied ? (
                            <span className="flex items-center text-[10px] text-emerald-700 font-sans font-bold">
                              <Check className="h-3.5 w-3.5 mr-0.5 text-emerald-600" /> Copied
                            </span>
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Document Title */}
                    <td className="sheet-cell font-medium text-slate-800 max-w-sm truncate" title={doc.title}>
                      {doc.title}
                    </td>

                    {/* Current Revision */}
                    <td className="sheet-cell text-center font-mono font-bold text-slate-900 bg-slate-50/40">
                      {doc.currentRevision}
                    </td>

                    {/* ConZoL Upload Status (1-Click Toggle with persistent highlight) */}
                    <td className="sheet-cell text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => handleToggleConzol(doc, e)}
                        title={
                          doc.erpSynced
                            ? `Uploaded to ConZoL at ${formatDate(doc.erpSyncedAt)}. Click to toggle.`
                            : "Pending ConZoL Upload. Click to Mark as Uploaded!"
                        }
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all select-none"
                      >
                        {doc.erpSynced ? (
                          <span className="flex items-center text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-emerald-200">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                            Uploaded
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-900 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-amber-300 animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1 text-amber-700" />
                            Pending ConZoL
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Plan Date */}
                    <td className="sheet-cell text-center font-mono text-[11px] text-slate-600">
                      {formatDate(doc.planDate)}
                    </td>

                    {/* Actions */}
                    <td className="sheet-cell text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onSelectDocument(doc)}
                          title="View Details & Revision History"
                          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onSubmitRevision(doc)}
                          title="Submit New Revision (e.g. 01, 02)"
                          className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* BOTTOM GOOGLE SHEETS STYLE TABS BAR (All Sheets from KK4-All.xlsx) */}
      <div className="flex items-center justify-between border-t border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 select-none overflow-x-auto">
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setActiveSheet("ALL")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "ALL"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>All Sheets ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveSheet("ME")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "ME"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            ME ({countFor("ME")})
          </button>

          <button
            onClick={() => setActiveSheet("EE")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "EE"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            EE ({countFor("EE")})
          </button>

          <button
            onClick={() => setActiveSheet("CE")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "CE"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            CE ({countFor("CE")})
          </button>

          <button
            onClick={() => setActiveSheet("EXM")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "EXM"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            EXM ({countFor("EXM")})
          </button>

          <button
            onClick={() => setActiveSheet("EXE")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "EXE"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            EXE ({countFor("EXE")})
          </button>

          <button
            onClick={() => setActiveSheet("EXC")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "EXC"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            EXC ({countFor("EXC")})
          </button>

          <button
            onClick={() => setActiveSheet("SHE")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "SHE"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            SHE ({countFor("SHE")})
          </button>

          <button
            onClick={() => setActiveSheet("PRC")}
            className={`px-2.5 py-1.5 rounded-t-md font-semibold text-xs transition-all border-b-2 ${
              activeSheet === "PRC"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-200 border-transparent"
            }`}
          >
            PRC ({countFor("PRC")})
          </button>
        </div>

        {/* Status summary */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-500 shrink-0 ml-4">
          <span>Showing <strong>{filteredDocs.length}</strong> / {documents.length} records</span>
          <span>•</span>
          <span className="font-mono text-slate-700">Project: SKK-IM-CM26002 (CM24045)</span>
        </div>
      </div>
    </div>
  );
}
