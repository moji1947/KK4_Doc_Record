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
  FileSpreadsheet,
  X,
  History,
  Info,
} from "lucide-react";
import {
  DocumentRecord,
  useCreateDocument,
  useSyncErp,
  useSubmitRevision,
} from "../api/useDocuments";
import { formatDate } from "@/lib/utils";

interface ExcelWorkbookViewProps {
  documents: DocumentRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Master Data from Table sheet
const MASTER_GROUPS_LIST = [
  { code: "PJ01", disc: "PJ", type: "INV", name: "Project study report" },
  { code: "PJ02", disc: "PJ", type: "INV", name: "Budget approval document" },
  { code: "PJ14", disc: "PJ", type: "CR", name: "Change Order" },
  { code: "ME01", disc: "ME", type: "EXL", name: "Machine & Procurement List" },
  { code: "ME02", disc: "ME", type: "GA", name: "General Arrangement Drawing" },
  { code: "ME03", disc: "ME", type: "FS", name: "Process Flowsheet" },
  { code: "ME04", disc: "ME", type: "LD", name: "Load Data" },
  { code: "ME05", disc: "ME", type: "MHB", name: "Mass & Heat Balance" },
  { code: "ME06", disc: "ME", type: "FD", name: "Fabrication Drawing" },
  { code: "ME16", disc: "ME", type: "DWG", name: "Manual & Spec ME" },
  { code: "ME17", disc: "ME", type: "REP", name: "SAT Test Report" },
  { code: "EE01", disc: "EE", type: "EXL", name: "Procurement List - Instrument" },
  { code: "EE02", disc: "EE", type: "TYD", name: "Typical Drawing - MCC CL Bypass" },
  { code: "EE03", disc: "EE", type: "SLD", name: "Single Line Diagram" },
  { code: "EE05", disc: "EE", type: "CBL", name: "Cable List" },
  { code: "EE06", disc: "EE", type: "CBR", name: "Cable Routing" },
  { code: "CE01", disc: "CE", type: "CIF", name: "Soil Investigation Report" },
  { code: "CE14", disc: "CE", type: "DDD", name: "Civil Drawing" },
  { code: "EXM00", disc: "EXM", type: "SHD", name: "Shop Drawing (Mechanical)" },
  { code: "EXM01", disc: "EXM", type: "MTS", name: "Method Statement (Mechanical)" },
  { code: "EXM02", disc: "EXM", type: "MTA", name: "Material Approve (Mechanical)" },
  { code: "EXE00", disc: "EXE", type: "SHD", name: "Shop Drawing (Electrical)" },
  { code: "EXE01", disc: "EXE", type: "MTS", name: "Method Statement (Electrical)" },
  { code: "EXC00", disc: "EXC", type: "SHD", name: "Shop Drawing (Civil)" },
  { code: "EXC01", disc: "EXC", type: "MTS", name: "Method Statement (Civil)" },
  { code: "SHE01", disc: "SHE", type: "JSA", name: "JSA (Job Safety Analysis)" },
  { code: "SHE02", disc: "SHE", type: "WPK", name: "Work Permit" },
  { code: "CP04", disc: "PRC", type: "REP", name: "TOR งานจ้างเหมา" },
  { code: "VD01", disc: "VD", type: "TYD", name: "Taweechaiwat - Drag chain" },
  { code: "VD04", disc: "VD", type: "SPE", name: "TKC - Spare part list" },
  { code: "VD05", disc: "VD", type: "DWG", name: "TN Group - Cooling air fan" },
];

export function ExcelWorkbookView({
  documents,
  isLoading,
}: ExcelWorkbookViewProps) {
  // Tab: 'Disc' (Main Register) | 'Coding' | 'Table' | 'Rev' | 'Return'
  const [activeTab, setActiveTab] = React.useState<"Disc" | "Coding" | "Table" | "Rev" | "Return">("Disc");
  const [disciplineFilter, setDisciplineFilter] = React.useState<string>("ALL");
  const [conzolFilter, setConzolFilter] = React.useState<"ALL" | "PENDING" | "SYNCED">("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // New Document Add Row Form State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [selectedGroupCode, setSelectedGroupCode] = React.useState("ME06");
  const [customType, setCustomType] = React.useState("FD");
  const [docTitle, setDocTitle] = React.useState("");
  const [initialRev, setInitialRev] = React.useState("00");
  const [planDate, setPlanDate] = React.useState("");
  const [initialPurpose, setInitialPurpose] = React.useState("IFI");
  const [initialReceiver, setInitialReceiver] = React.useState("Owner");

  // Revision Modal State
  const [revisionDoc, setRevisionDoc] = React.useState<DocumentRecord | null>(null);
  const [nextRevCode, setNextRevCode] = React.useState("01");
  const [revDate, setRevDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [revPurpose, setRevPurpose] = React.useState("IFC");
  const [revReceiver, setRevReceiver] = React.useState("Owner");

  const createDocMutation = useCreateDocument();
  const syncErpMutation = useSyncErp();
  const submitRevMutation = useSubmitRevision();

  // Find Discipline from Group
  const currentGroupInfo = React.useMemo(() => {
    return MASTER_GROUPS_LIST.find((g) => g.code === selectedGroupCode) || {
      code: selectedGroupCode,
      disc: selectedGroupCode.startsWith("EXM")
        ? "EXM"
        : selectedGroupCode.startsWith("EXE")
        ? "EXE"
        : selectedGroupCode.startsWith("EXC")
        ? "EXC"
        : selectedGroupCode.startsWith("SHE")
        ? "SHE"
        : selectedGroupCode.slice(0, 2),
      type: customType || "DWG",
      name: selectedGroupCode,
    };
  }, [selectedGroupCode, customType]);

  // AUTO-CALCULATE NEXT SEQUENCE NUMBER (0001, 0002, 0003...)
  const autoCalculatedSequence = React.useMemo(() => {
    const matchingDocs = documents.filter((d) => {
      return (
        d.groupCode.toUpperCase() === selectedGroupCode.toUpperCase() &&
        d.typeCode.toUpperCase() === (customType || currentGroupInfo.type).toUpperCase()
      );
    });

    if (matchingDocs.length === 0) {
      return "0001";
    }

    let maxSeq = 0;
    matchingDocs.forEach((d) => {
      const parts = d.documentNo.split("-");
      const lastPart = parts[parts.length - 1];
      const seqNum = parseInt(lastPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    });

    return String(maxSeq + 1).padStart(4, "0");
  }, [documents, selectedGroupCode, customType, currentGroupInfo]);

  // Full Auto-Assembled Document Number
  const autoGeneratedDocNo = React.useMemo(() => {
    const type = customType || currentGroupInfo.type || "DWG";
    return `CM24045-EPS-${selectedGroupCode}-${type}-${autoCalculatedSequence}`;
  }, [selectedGroupCode, customType, currentGroupInfo, autoCalculatedSequence]);

  // Check if duplicate exists
  const isDuplicateDocNo = React.useMemo(() => {
    return documents.some((d) => d.documentNo.toUpperCase() === autoGeneratedDocNo.toUpperCase());
  }, [documents, autoGeneratedDocNo]);

  // Handle Group Selection change
  const handleGroupSelect = (code: string) => {
    setSelectedGroupCode(code);
    const found = MASTER_GROUPS_LIST.find((g) => g.code === code);
    if (found) {
      setCustomType(found.type);
    }
  };

  // Copy Doc No
  const handleCopy = (docNo: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(docNo);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle ConZoL Upload Status (Admin)
  const handleToggleConzol = (doc: DocumentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    syncErpMutation.mutate({
      documentId: doc.documentId,
      erpSynced: !doc.erpSynced,
      receiver: "Admin",
    });
  };

  // Submit New Document Row
  const handleSaveNewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      alert("กรุณากรอกชื่อเอกสาร (Document Title)");
      return;
    }
    if (isDuplicateDocNo) {
      alert("❌ ไม่สามารถบันทึกได้: เลขเอกสารนี้ซ้ำกับในระบบ!");
      return;
    }

    const type = customType || currentGroupInfo.type || "DWG";

    await createDocMutation.mutateAsync({
      projectCode: "CM24045",
      originatorCode: "EPS",
      groupCode: selectedGroupCode.toUpperCase(),
      typeCode: type.toUpperCase(),
      title: docTitle.trim(),
      initialRevision: initialRev.trim() || "00",
      initialPurpose: initialPurpose,
      initialReceiver: initialReceiver,
      planDate: planDate ? new Date(planDate).toISOString() : null,
    });

    setDocTitle("");
    setIsAddOpen(false);
  };

  // Open Revision Modal
  const handleOpenRevisionModal = (doc: DocumentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevisionDoc(doc);
    // Suggest next rev (00 -> 01, 01 -> 02, A01 -> A02)
    const cur = doc.currentRevision || "00";
    const curNum = parseInt(cur, 10);
    if (!isNaN(curNum)) {
      setNextRevCode(String(curNum + 1).padStart(2, "0"));
    } else if (cur.startsWith("A")) {
      const aNum = parseInt(cur.replace("A", ""), 10);
      setNextRevCode(`A${String((aNum || 1) + 1).padStart(2, "0")}`);
    } else {
      setNextRevCode("01");
    }
  };

  // Submit New Revision
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionDoc) return;

    await submitRevMutation.mutateAsync({
      documentId: revisionDoc.documentId,
      revision: nextRevCode,
      submittedDate: new Date(revDate).toISOString(),
      purposeCode: revPurpose,
      submittedBy: "Engineer",
      receivedBy: revReceiver,
      erpSynced: false, // Set to Pending ConZoL for Admin queue!
    });

    setRevisionDoc(null);
  };

  // Filtered Documents
  const filteredDocs = React.useMemo(() => {
    return documents.filter((doc) => {
      // Discipline filter
      if (disciplineFilter !== "ALL") {
        const disc = doc.group?.disciplineCode || "";
        if (disc !== disciplineFilter && !doc.groupCode.startsWith(disciplineFilter)) {
          return false;
        }
      }

      // ConZoL Status filter
      if (conzolFilter === "PENDING" && doc.erpSynced) return false;
      if (conzolFilter === "SYNCED" && !doc.erpSynced) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = doc.documentNo.toLowerCase().includes(q);
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchGroup = doc.groupCode.toLowerCase().includes(q);
        if (!matchNo && !matchTitle && !matchGroup) return false;
      }

      return true;
    });
  }, [documents, disciplineFilter, conzolFilter, searchQuery]);

  // Metrics
  const pendingCount = documents.filter((d) => !d.erpSynced).length;
  const uploadedCount = documents.filter((d) => d.erpSynced).length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Disc",
      "Group",
      "Type",
      "Latest Rev",
      "Latest Date",
      "Latest Purpose",
      "Latest Receiver",
      "Document No",
      "Title",
      "Plan Date",
      "ConZoL Status",
    ];
    const rows = filteredDocs.map((d) => [
      d.group?.disciplineCode || "",
      d.groupCode,
      d.typeCode,
      d.currentRevision,
      d.erpSyncedAt ? formatDate(d.erpSyncedAt) : "",
      d.submissions?.[0]?.purposeCode || "IFI",
      d.submissions?.[0]?.receivedBy || "Owner",
      d.documentNo,
      `"${d.title.replace(/"/g, '""')}"`,
      formatDate(d.planDate),
      d.erpSynced ? "Uploaded" : "Pending ConZoL",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `KK4_Document_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm border border-slate-300 font-sans text-slate-800 overflow-hidden">
      {/* EXCEL TOP TITLE BAR (Green Ribbon style) */}
      <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold tracking-wide">
            <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
            <span>KK4 - Record data for User (ConZoL Pre-Upload Register)</span>
          </div>
          <span className="bg-emerald-800/80 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-600">
            CM24045 (SKK-IM-CM26002)
          </span>
          <span className="hidden md:inline-block text-emerald-100 text-[11px]">
            Satellite Burner KK4
          </span>
        </div>

        {/* Quick ConZoL Stats */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1 bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-bold shadow-xs">
            <AlertTriangle className="h-3 w-3" />
            <span>รอ Admin อัปเข้า ConZoL: {pendingCount} ฉบับ</span>
          </div>
        </div>
      </div>

      {/* EXCEL TOOLBAR / FORMULA BAR */}
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Search & Filter Tabs */}
        <div className="flex items-center space-x-2 flex-1 max-w-xl">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา Document No, Title, Group (เช่น ME06, 0001)..."
              className="w-full h-7.5 rounded border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#107c41] focus:outline-none"
            />
          </div>

          {/* ConZoL Status Filter Tabs */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded text-xs shrink-0">
            <button
              onClick={() => setConzolFilter("ALL")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                conzolFilter === "ALL"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทั้งหมด ({documents.length})
            </button>
            <button
              onClick={() => setConzolFilter("PENDING")}
              className={`px-2.5 py-1 rounded font-bold transition-colors flex items-center space-x-1 ${
                conzolFilter === "PENDING"
                  ? "bg-[#f3e8ff] text-purple-900 border border-purple-300 shadow-xs"
                  : "text-purple-700 hover:text-purple-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-600 inline-block animate-ping"></span>
              <span>🟣 รออัป ConZoL ({pendingCount})</span>
            </button>
            <button
              onClick={() => setConzolFilter("SYNCED")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                conzolFilter === "SYNCED"
                  ? "bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 shadow-xs"
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              ✓ อัปโหลดแล้ว ({uploadedCount})
            </button>
          </div>
        </div>

        {/* Right: Quick Add Row & Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#107c41] hover:bg-[#0e6b37] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ กรอกเอกสารใหม่ (Auto Running No.)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs shadow-xs"
            title="ดาวน์โหลดเป็นไฟล์ Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* QUICK ADD DOCUMENT ROW (Engineer Auto Running Assistant) */}
      {isAddOpen && (
        <form
          onSubmit={handleSaveNewDoc}
          className="border-b-2 border-[#107c41] bg-[#f0fdf4] p-3.5 space-y-3 animate-in slide-in-from-top-2"
        >
          {/* Real-time Numbering Preview & Auto Duplicate Check */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3.5 py-2 rounded border border-emerald-300 shadow-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">
                ระบบแนะนำเลขเอกสารถัดไปอัตโนมัติ (Auto-suggest Next Running Number):
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-[#107c41] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                {autoGeneratedDocNo}
              </span>
              {isDuplicateDocNo ? (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-300 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>เลขนี้ซ้ำในระบบ!</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ เลขพร้อมใช้งาน (Seq: {autoCalculatedSequence})
                </span>
              )}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs items-end">
            {/* 1. Group Selector */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                1. เลือก Document Group (หรือค้นหา) *
              </label>
              <select
                value={selectedGroupCode}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full h-8 rounded border border-slate-300 bg-white px-2 font-mono font-semibold text-xs text-slate-800 focus:border-[#107c41] focus:outline-none"
              >
                {MASTER_GROUPS_LIST.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.code} — {g.name} ({g.disc})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Type Code */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Type Code *
              </label>
              <input
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value.toUpperCase())}
                placeholder="FD"
                className="w-full h-8 rounded border border-slate-300 bg-white px-2 font-mono font-bold text-xs uppercase text-slate-800 focus:border-[#107c41] focus:outline-none text-center"
              />
            </div>

            {/* 3. Document Title */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. ชื่อเอกสาร (Document Title) *
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="เช่น General Arrangement and Load Data, Fabrication Drawing..."
                className="w-full h-8 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:border-[#107c41] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Bottom row inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-2.5 text-xs items-end pt-1">
            {/* Rev */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Rev.</label>
              <input
                type="text"
                value={initialRev}
                onChange={(e) => setInitialRev(e.target.value)}
                placeholder="00"
                className="w-full h-8 rounded border border-slate-300 bg-white px-2 font-mono text-xs text-center"
              />
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Purpose</label>
              <select
                value={initialPurpose}
                onChange={(e) => setInitialPurpose(e.target.value)}
                className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs font-semibold"
              >
                <option value="IFI">IFI — For Information</option>
                <option value="IFR">IFR — For Review</option>
                <option value="IFA">IFA — For Approval</option>
                <option value="IFC">IFC — For Construction</option>
                <option value="AB">AB — As Built</option>
              </select>
            </div>

            {/* Receiver */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Receiver</label>
              <input
                type="text"
                value={initialReceiver}
                onChange={(e) => setInitialReceiver(e.target.value)}
                placeholder="Owner"
                className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs"
              />
            </div>

            {/* Plan Date */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Plan Date</label>
              <input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="md:col-span-3 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-1/3 h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={createDocMutation.isPending || isDuplicateDocNo}
                className="w-2/3 h-8 rounded bg-[#107c41] hover:bg-[#0e6b37] disabled:opacity-50 text-white font-bold text-xs shadow-xs"
              >
                {createDocMutation.isPending ? "กำลังบันทึก..." : "✓ บันทึกแถวใหม่"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================= TAB 1: SHEET 'Disc.' (MAIN REGISTER) ======================= */}
      {activeTab === "Disc" && (
        <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
          <table className="w-full border-collapse text-xs bg-white select-text">
            {/* Multi-tier Excel Table Header */}
            <thead className="sticky top-0 z-10 shadow-xs bg-[#f2f2f2] text-slate-700 font-semibold border-b-2 border-slate-400">
              {/* Top Category Header */}
              <tr className="border-b border-slate-300 bg-[#e7e6e6] text-[11px] uppercase tracking-wider text-slate-600">
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 text-center bg-slate-200/80">
                  Classification
                </th>
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 text-center bg-amber-100/70 text-amber-950 font-bold">
                  Document Status Latest (สถานะล่าสุด)
                </th>
                <th colSpan={3} className="border-r border-slate-300 px-2 py-1 text-center bg-blue-100/70 text-blue-950 font-bold">
                  Document Identity & Title
                </th>
                <th colSpan={2} className="px-2 py-1 text-center bg-purple-100/70 text-purple-950 font-bold">
                  ConZoL DMS Admin Action
                </th>
              </tr>

              {/* Specific Column Names */}
              <tr className="bg-[#f8f9fa] text-slate-700 text-[11.5px]">
                <th className="border border-slate-300 px-2 py-1.5 w-10 text-center text-slate-500 font-mono">#</th>
                <th className="border border-slate-300 px-2 py-1.5 w-14 text-center">Disc</th>
                <th className="border border-slate-300 px-2 py-1.5 w-16 text-center">Group</th>
                <th className="border border-slate-300 px-2 py-1.5 w-14 text-center">Type</th>
                <th className="border border-slate-300 px-2 py-1.5 w-14 text-center bg-amber-50 text-amber-900 font-bold">Rev.</th>
                <th className="border border-slate-300 px-2 py-1.5 w-24 text-center bg-amber-50 text-amber-900">Date</th>
                <th className="border border-slate-300 px-2 py-1.5 w-16 text-center bg-amber-50 text-amber-900">Purpose</th>
                <th className="border border-slate-300 px-2 py-1.5 w-16 text-center bg-amber-50 text-amber-900">Receiver</th>
                <th className="border border-slate-300 px-3 py-1.5 min-w-[230px] text-left bg-blue-50 text-blue-950 font-bold">Document No.</th>
                <th className="border border-slate-300 px-3 py-1.5 min-w-[280px] text-left">Document Title</th>
                <th className="border border-slate-300 px-2 py-1.5 w-24 text-center">Plan Date</th>
                <th className="border border-slate-300 px-2 py-1.5 w-32 text-center bg-purple-50 text-purple-950 font-bold">ConZoL Status</th>
                <th className="border border-slate-300 px-2 py-1.5 w-20 text-center bg-slate-100">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400 font-medium">
                    กำลังโหลดข้อมูลตาราง Excel...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400 font-medium">
                    ไม่พบเอกสารตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const isPending = !doc.erpSynced;
                  const isCopied = copiedId === doc.documentId;
                  const latestSub = doc.submissions?.[0];

                  return (
                    <tr
                      key={doc.documentId}
                      className={`hover:bg-slate-100/80 transition-colors border-b border-slate-200 ${
                        isPending ? "bg-[#faf5ff]" : ""
                      }`}
                    >
                      {/* Row Index */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono text-[11px] text-slate-500 bg-slate-50">
                        {idx + 1}
                      </td>

                      {/* Disc */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono font-bold text-slate-700">
                        {doc.group?.disciplineCode || doc.groupCode.slice(0, 2)}
                      </td>

                      {/* Group Code */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono font-semibold text-slate-800 bg-slate-50/50">
                        {doc.groupCode}
                      </td>

                      {/* Type Code */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono font-bold text-slate-900">
                        {doc.typeCode}
                      </td>

                      {/* Latest Rev */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono font-bold text-blue-700 bg-amber-50/30">
                        {doc.currentRevision}
                      </td>

                      {/* Latest Date */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono text-[11px] text-slate-600">
                        {formatDate(latestSub?.submittedDate || doc.planDate || doc.createdAt)}
                      </td>

                      {/* Latest Purpose */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono font-bold text-slate-700">
                        {latestSub?.purposeCode || "IFI"}
                      </td>

                      {/* Latest Receiver */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center text-[11px] text-slate-600">
                        {latestSub?.receivedBy || "Owner"}
                      </td>

                      {/* Document No (with 1-click copy) */}
                      <td className="border border-slate-200 px-2.5 py-1.5 font-mono font-bold text-blue-700 bg-blue-50/30 whitespace-nowrap">
                        <div className="flex items-center justify-between space-x-1">
                          <span>{doc.documentNo}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(doc.documentNo, doc.documentId, e)}
                            title="กดคลิกเดียวเพื่อ Copy เลขไปวางใน ConZoL"
                            className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-700 transition-all"
                          >
                            {isCopied ? (
                              <span className="flex items-center text-[10px] text-emerald-700 font-sans font-bold">
                                <Check className="h-3 w-3 mr-0.5 text-emerald-600" /> Copied!
                              </span>
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Document Title */}
                      <td className="border border-slate-200 px-3 py-1.5 text-slate-800 font-medium max-w-sm truncate" title={doc.title}>
                        {doc.title}
                      </td>

                      {/* Plan Date */}
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-mono text-[11px] text-slate-600">
                        {formatDate(doc.planDate)}
                      </td>

                      {/* ConZoL Status (Persistent Purple / Amber Highlight for Admin) */}
                      <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleToggleConzol(doc, e)}
                          title={
                            doc.erpSynced
                              ? `อัปโหลดเข้า ConZoL แล้วเมื่อ ${formatDate(doc.erpSyncedAt)}. คลิกเพื่อเปลี่ยนสถานะ.`
                              : "เอกสารนี้ยังไม่ได้อัปโหลดเข้า ConZoL! คลิกเพื่อติ๊กเสร็จสิ้น (Mark as Uploaded)"
                          }
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all select-none shadow-2xs"
                        >
                          {doc.erpSynced ? (
                            <span className="flex items-center text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                              ✓ Uploaded
                            </span>
                          ) : (
                            <span className="flex items-center text-purple-950 bg-purple-200 border border-purple-400 px-2.5 py-0.5 rounded text-[11px] font-bold hover:bg-purple-300 animate-pulse">
                              <AlertTriangle className="h-3 w-3 mr-1 text-purple-700" />
                              🟣 รออัป ConZoL
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions: Add Rev */}
                      <td className="border border-slate-200 px-2 py-1 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => handleOpenRevisionModal(doc, e)}
                          title="เพิ่ม Revision ใหม่สำหรับเอกสารนี้ (เช่น 01, 02)"
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 mx-auto transition-colors"
                        >
                          <History className="h-3 w-3" />
                          <span>+ Rev</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= TAB 2: SHEET 'Coding' (DOC NO FORMULA) ======================= */}
      {activeTab === "Coding" && (
        <div className="p-6 bg-slate-50 space-y-4 max-h-[calc(100vh-16rem)] overflow-auto text-xs">
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
              <Info className="h-4 w-4 text-emerald-600" />
              <span>Sheet [Coding] — Document Numbering System Architecture</span>
            </h3>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="font-mono text-center text-base font-bold text-[#107c41] tracking-widest">
                AABBBBB - CCC - DD&EE - FFF - NNNN
              </div>
              <div className="grid grid-cols-5 text-center mt-2 text-[11px] text-slate-600 font-semibold divide-x divide-emerald-200">
                <div>Project Code<br/><strong className="text-slate-900 font-mono">CM24045</strong></div>
                <div>Originator<br/><strong className="text-slate-900 font-mono">EPS</strong></div>
                <div>Discipline & Group<br/><strong className="text-slate-900 font-mono">ME06 / EXM00</strong></div>
                <div>Doc Type<br/><strong className="text-slate-900 font-mono">FD / SHD / GA</strong></div>
                <div>Sequence Number<br/><strong className="text-emerald-700 font-mono font-bold">0001 ~ 9999</strong></div>
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed">
              <strong>หลักการทำงานของระบบ:</strong> เมื่อ Engineer สร้างเอกสารใหม่ ระบบจะล็อค 4 ส่วนแรกตาม Master Data และ <strong>คำนวณ Sequence 4 หลักสุดท้าย (`NNNN`) ต่อจากเลขสูงสุดใน Group นั้นให้อัตโนมัติ</strong> เพื่อไม่ให้เกิดข้อผิดพลาดในการจำเลขผิดหรือใช้เลขชนกัน 100%
            </p>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: SHEET 'Table' (MASTER GROUPS DICTIONARY) ======================= */}
      {activeTab === "Table" && (
        <div className="p-4 bg-slate-50 max-h-[calc(100vh-16rem)] overflow-auto text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              Sheet [Table] — Master Document Groups & Types Dictionary
            </h3>
            <span className="text-[11px] text-slate-500">{MASTER_GROUPS_LIST.length} กลุ่มมาตรฐาน</span>
          </div>

          <table className="w-full border-collapse bg-white border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-semibold">
              <tr>
                <th className="border border-slate-300 px-3 py-2 text-left">Group Code</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Discipline</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Default Type</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Description / ชื่อกลุ่มเอกสาร</th>
              </tr>
            </thead>
            <tbody>
              {MASTER_GROUPS_LIST.map((g) => (
                <tr key={g.code} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-[#107c41]">{g.code}</td>
                  <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-700">{g.disc}</td>
                  <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-purple-700">{g.type}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-800 font-medium">{g.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= TAB 4: SHEET 'Rev.' (REVISION GUIDELINES) ======================= */}
      {activeTab === "Rev" && (
        <div className="p-6 bg-slate-50 max-h-[calc(100vh-16rem)] overflow-auto text-xs space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
              Sheet [Rev.] — REVISION ID Procedure (การกำหนด Revision Code)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-bold text-blue-900 font-mono text-sm">A1, A2, A3...</div>
                <div className="font-semibold text-blue-800 mt-1">For Permission</div>
                <p className="text-[11px] text-slate-600 mt-1">เอกสารสำหรับยื่นขออนุญาตราชการ</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="font-bold text-amber-900 font-mono text-sm">B1, B2, B3...</div>
                <div className="font-semibold text-amber-800 mt-1">For Bidding</div>
                <p className="text-[11px] text-slate-600 mt-1">เอกสารสำหรับประกวดราคา / จัดซื้อจัดจ้าง</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <div className="font-bold text-emerald-900 font-mono text-sm">00, 01, 02, 03...</div>
                <div className="font-semibold text-emerald-800 mt-1">Issue for Construction (IFC)</div>
                <p className="text-[11px] text-slate-600 mt-1">เอกสารสำหรับการก่อสร้างจริง (เริ่มจาก 00 เสมอ)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 5: SHEET 'Return Code' ======================= */}
      {activeTab === "Return" && (
        <div className="p-6 bg-slate-50 max-h-[calc(100vh-16rem)] overflow-auto text-xs space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
              Sheet [Return & Progress Code] — ผลการตรวจเอกสารจาก Owner
            </h3>
            <table className="w-full border-collapse bg-white border border-slate-300 mt-2">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left w-20">Code</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Description</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">ความหมาย</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-bold text-emerald-700 font-mono text-sm">A</td>
                  <td className="border border-slate-200 px-3 py-2 font-semibold">Approve</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">อนุมัติเรียบร้อย สามารถนำไปก่อสร้างได้</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-bold text-blue-700 font-mono text-sm">AC</td>
                  <td className="border border-slate-200 px-3 py-2 font-semibold">Approve with Comment</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">อนุมัติแบบมีเงื่อนไข/คอมเมนต์ ให้ดำเนินการแก้ไขใน Rev ถัดไป</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2 font-bold text-rose-700 font-mono text-sm">RC</td>
                  <td className="border border-slate-200 px-3 py-2 font-semibold">Return to Correct</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">ไม่อนุมัติ ส่งกลับมาให้แก้ไขก่อนส่งใหม่</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXCEL BOTTOM SHEET TABS (Identical to User's Excel file sheets) */}
      <div className="flex items-center justify-between border-t border-slate-300 bg-[#e7e6e6] px-2 py-1 text-xs select-none overflow-x-auto">
        {/* Left: Workbook Sheet Tabs */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Sheet 1: Disc. */}
          <button
            onClick={() => setActiveTab("Disc")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-t font-bold text-xs transition-all border-b-2 ${
              activeTab === "Disc"
                ? "bg-white text-[#107c41] border-[#107c41] shadow-xs"
                : "text-slate-700 hover:bg-slate-200 border-transparent"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Disc. (Main Register)</span>
          </button>

          {/* Sheet 2: Coding */}
          <button
            onClick={() => setActiveTab("Coding")}
            className={`px-3 py-1 rounded-t font-bold text-xs transition-all border-b-2 ${
              activeTab === "Coding"
                ? "bg-white text-[#107c41] border-[#107c41] shadow-xs"
                : "text-slate-700 hover:bg-slate-200 border-transparent"
            }`}
          >
            Coding
          </button>

          {/* Sheet 3: Table */}
          <button
            onClick={() => setActiveTab("Table")}
            className={`px-3 py-1 rounded-t font-bold text-xs transition-all border-b-2 ${
              activeTab === "Table"
                ? "bg-white text-[#107c41] border-[#107c41] shadow-xs"
                : "text-slate-700 hover:bg-slate-200 border-transparent"
            }`}
          >
            Table (Dictionary)
          </button>

          {/* Sheet 4: Rev. */}
          <button
            onClick={() => setActiveTab("Rev")}
            className={`px-3 py-1 rounded-t font-bold text-xs transition-all border-b-2 ${
              activeTab === "Rev"
                ? "bg-white text-[#107c41] border-[#107c41] shadow-xs"
                : "text-slate-700 hover:bg-slate-200 border-transparent"
            }`}
          >
            Rev.
          </button>

          {/* Sheet 5: Return&Progress Code */}
          <button
            onClick={() => setActiveTab("Return")}
            className={`px-3 py-1 rounded-t font-bold text-xs transition-all border-b-2 ${
              activeTab === "Return"
                ? "bg-white text-[#107c41] border-[#107c41] shadow-xs"
                : "text-slate-700 hover:bg-slate-200 border-transparent"
            }`}
          >
            Return & Progress Code
          </button>
        </div>

        {/* Right: Quick Discipline Filter Bar (for Disc sheet) */}
        {activeTab === "Disc" && (
          <div className="flex items-center space-x-1 shrink-0 ml-3">
            <span className="text-[11px] text-slate-500 font-medium">Discipline:</span>
            {["ALL", "ME", "EE", "CE", "EXM", "EXE", "EXC", "SHE", "PRC", "PJ", "VD"].map((disc) => (
              <button
                key={disc}
                onClick={() => setDisciplineFilter(disc)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                  disciplineFilter === disc
                    ? "bg-[#107c41] text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {disc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ======================= SUBMIT NEW REVISION MODAL ======================= */}
      {revisionDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full p-4 space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  เพิ่ม Revision ใหม่ (Issue New Revision)
                </h4>
                <p className="text-[11px] font-mono text-blue-700 mt-0.5">
                  {revisionDoc.documentNo}
                </p>
              </div>
              <button
                onClick={() => setRevisionDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-700">ชื่อเอกสาร: </span>
                <span className="text-slate-800">{revisionDoc.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    New Revision Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={nextRevCode}
                    onChange={(e) => setNextRevCode(e.target.value)}
                    placeholder="01"
                    className="w-full h-8 rounded border border-slate-300 px-2 font-mono font-bold text-xs text-center focus:border-[#107c41] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Submitted Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={revDate}
                    onChange={(e) => setRevDate(e.target.value)}
                    className="w-full h-8 rounded border border-slate-300 px-2 text-xs focus:border-[#107c41] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Purpose of Issue *
                  </label>
                  <select
                    value={revPurpose}
                    onChange={(e) => setRevPurpose(e.target.value)}
                    className="w-full h-8 rounded border border-slate-300 px-2 text-xs font-semibold focus:border-[#107c41] focus:outline-none"
                  >
                    <option value="IFC">IFC — For Construction</option>
                    <option value="IFA">IFA — For Approval</option>
                    <option value="IFR">IFR — For Review</option>
                    <option value="IFI">IFI — For Information</option>
                    <option value="AB">AB — As Built</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Receiver *
                  </label>
                  <input
                    type="text"
                    required
                    value={revReceiver}
                    onChange={(e) => setRevReceiver(e.target.value)}
                    placeholder="Owner"
                    className="w-full h-8 rounded border border-slate-300 px-2 text-xs focus:border-[#107c41] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2 bg-purple-50 rounded border border-purple-200 text-[11px] text-purple-900">
                💡 เมื่อเพิ่ม Revision ใหม่ รายการนี้จะเด้งเข้าคิว <strong>🟣 รออัป ConZoL</strong> ของ Admin อัตโนมัติ เพื่อให้ Admin ทราบว่ามีไฟล์ PDF ใหม่ต้องนำขึ้นระบบ
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRevisionDoc(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitRevMutation.isPending}
                  className="px-4 py-1.5 rounded bg-[#107c41] hover:bg-[#0e6b37] text-white font-bold text-xs shadow-xs"
                >
                  {submitRevMutation.isPending ? "กำลังบันทึก..." : "✓ บันทึก Revision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
