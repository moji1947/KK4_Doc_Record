import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.resolve(__dirname, "../prisma/source-data/KK4-All.xlsx");
const outPath = path.resolve(__dirname, "../../frontend/src/features/documents/api/mockDocuments.json");
const backendMockPath = path.resolve(__dirname, "../src/shared/mockDocuments.json");

function excelDateToISO(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (isNaN(n) || n < 1000) return null;
  return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString();
}

const wb = xlsx.readFile(excelPath);
let idCounter = 1;
const docs = [];
const disciplineNames = { PJ:"Project Information", ME:"Mechanical Engineering", CE:"Civil Engineering", EE:"Electrical Engineering", EX:"Execution - All", EXM:"Execution - Mechanical", EXE:"Execution - Electrical", EXC:"Execution - Civil", PRC:"Procurement / Commercial", SHE:"Safety, Health and Environment", VD:"Vendor Document" };

for (const sheet of wb.SheetNames) {
  if (sheet === "ATT." || sheet === "Sheet1") continue;
  const ws = wb.Sheets[sheet];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const docNoRaw = r[9] || r[1];
    const titleRaw = r[10] || r[4];
    if (!docNoRaw && !titleRaw) continue;
    let disc = String(r[1] || "").trim().toUpperCase();
    let group = String(r[2] || "").trim().toUpperCase();
    let type = String(r[3] || "").trim().toUpperCase();
    let docNo = docNoRaw ? String(docNoRaw).trim() : "";
    const title = titleRaw ? String(titleRaw).trim() : group;
    if (docNo.startsWith("CM24045")) {
      const parts = docNo.split("-");
      if (parts.length >= 3) {
        const cand = parts[2];
        if (cand.startsWith("EXM") || cand.startsWith("EXE") || cand.startsWith("EXC") || cand.startsWith("SHE") || cand.startsWith("PJ") || cand.startsWith("CP") || cand.startsWith("ME") || cand.startsWith("EE") || cand.startsWith("CE") || cand.startsWith("VD")) group = cand;
        if (parts.length >= 4 && isNaN(Number(parts[3]))) type = parts[3];
      }
    }
    if (!group) continue;
    if (!disc || disc === "CM24045") {
      if (group.startsWith("EXM")) disc="EXM"; else if (group.startsWith("EXE")) disc="EXE"; else if (group.startsWith("EXC")) disc="EXC"; else if (group.startsWith("EX")) disc="EX"; else if (group.startsWith("SHE")) disc="SHE"; else if (group.startsWith("CP")) disc="PRC"; else if (group.startsWith("PJ")) disc="PJ"; else if (group.startsWith("ME")) disc="ME"; else if (group.startsWith("EE")) disc="EE"; else if (group.startsWith("CE")) disc="CE"; else if (group.startsWith("VD")) disc="VD"; else disc="PJ";
    }
    if (!type) {
      if (group.startsWith("EXM")||group.startsWith("EXE")||group.startsWith("EXC")) type="SHD"; else if (group.startsWith("SHE")) type="JSA"; else if (group.startsWith("CP")) type="REP"; else type="DWG";
    }
    if (!docNo || !docNo.match(/-\d{4}$/)) {
      docNo = `CM24045-EPS-${group}-${type}-${String(i-2).padStart(4,"0")}`;
    }
    const revRaw = r[5] != null ? String(r[5]).trim() : "00";
    const rev = revRaw ? (revRaw.length===1 ? `0${revRaw}` : revRaw) : "00";
    const isoDate = excelDateToISO(r[6] ?? r[11]);
    const purpose = String(r[7] || "IFI").trim().toUpperCase() || "IFI";
    const erpSynced = true;
    const documentId = `mock-${String(idCounter++).padStart(4,"0")}-${group}-${type}`;
    docs.push({
      documentId,
      documentNo: docNo,
      projectCode: "CM24045",
      title,
      originatorCode: "EPS",
      groupCode: group,
      typeCode: type,
      currentRevision: rev,
      currentStatus: "APPROVED",
      planDate: isoDate,
      remarks: null,
      erpSynced,
      erpSyncedAt: isoDate,
      erpSyncedBy: "System (Seeded)",
      erpDocId: null,
      createdBy: "System Seed",
      createdAt: isoDate || new Date().toISOString(),
      updatedAt: isoDate || new Date().toISOString(),
      project: { projectCode: "CM24045", title: "Cement Implement SKK - Satellite Burner KK4" },
      originator: { originatorCode: "EPS", originatorName: "Eco Plant Services Co., Ltd." },
      group: { groupCode: group, groupName: title.slice(0,80), disciplineCode: disc, discipline: { disciplineCode: disc, disciplineName: disciplineNames[disc] || disc } },
      type: { typeCode: type, typeDescription: type },
      revision: { revisionCode: rev, revisionDescription: `Revision ${rev}` },
      status: { statusCode: "APPROVED", statusName: "Approved" },
      submissions: [{ submissionId: `sub-${documentId}`, documentId, revision: rev, submittedDate: isoDate || new Date().toISOString(), purposeCode: purpose, submittedBy: "Engineer", receivedBy: "Owner", returnCode: null, attachmentUrl: null, erpSynced: true, erpSyncedAt: isoDate, erpSyncedBy: "System", createdAt: isoDate || new Date().toISOString() }],
      _count: { submissions: 1 }
    });
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.mkdirSync(path.dirname(backendMockPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), "utf8");
fs.writeFileSync(backendMockPath, JSON.stringify(docs, null, 2), "utf8");
console.log(`Generated ${docs.length} mock docs -> ${outPath} and ${backendMockPath}`);
