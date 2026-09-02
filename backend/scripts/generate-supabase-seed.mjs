import xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prismaDir = path.resolve(__dirname, "../prisma");
const excelPath = path.join(prismaDir, "source-data", "KK4-All.xlsx");
const outSql = path.join(prismaDir, "../supabase_seed.sql");
const outJson = path.join(prismaDir, "../supabase_seed_preview.json");

function esc(s) { return String(s).replace(/'/g, "''"); }
function excelDateToISO(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (isNaN(n) || n < 1000) return null;
  const d = new Date(Math.round((n - 25569) * 86400 * 1000));
  return d.toISOString();
}

const MASTER_DISCIPLINES = [
  { code: "PJ", name: "Project Information" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "CE", name: "Civil Engineering" },
  { code: "EE", name: "Electrical Engineering" },
  { code: "EX", name: "Execution - All" },
  { code: "EXM", name: "Execution - Mechanical" },
  { code: "EXE", name: "Execution - Electrical" },
  { code: "EXC", name: "Execution - Civil" },
  { code: "PRC", name: "Procurement / Commercial" },
  { code: "SHE", name: "Safety, Health and Environment" },
  { code: "VD", name: "Vendor Document" },
];
const MASTER_TYPES = [
  ["INV","Investigation / Study Report"],["GA","General Arrangement Drawing"],["FD","Fabrication Drawing"],["FS","Process Flowsheet"],["LD","Load Data"],["MHB","Mass & Heat Balance"],["CR","Change Order / Request"],["EXL","Equipment / Instrument List"],["TYD","Typical Drawing"],["SLD","Single Line Diagram"],["CBL","Cable List"],["CBR","Cable Routing"],["CIF","Civil Information / Soil Report"],["DDD","Detailed Design Drawing"],["SHD","Shop Drawing"],["MTS","Method Statement"],["MTA","Material Approval"],["RIN","Request for Information"],["JSA","Job Safety Analysis"],["WPK","Work Permit"],["REP","Report"],["SPE","Specification"],["DWG","Drawing"],
];
const MASTER_STATUSES = [["DRAFT","Draft"],["SUBMITTED","Submitted"],["REVIEWED","Reviewed"],["APPROVED","Approved"],["APPROVED_COMMENTS","Approved with Comments"],["REJECTED","Rejected"],["ISSUED","Issued"],["CANCELLED","Cancelled"]];
const MASTER_REVISIONS = [["A01","For Permission - Rev 01"],["A02","For Permission - Rev 02"],["B01","For Bidding - Rev 01"],["B02","For Bidding - Rev 02"],["00","Issue for Construction - Rev 00"],["01","Issue for Construction - Rev 01"],["02","Issue for Construction - Rev 02"],["03","Issue for Construction - Rev 03"],["04","Issue for Construction - Rev 04"],["AB","Final As-Built"]];
const MASTER_PURPOSES = [["IFI","Issue For Information"],["IFR","Issue For Review"],["IFA","Issue For Approval"],["IFC","Issue For Construction"],["AB","As Built"],["CANCEL","Cancelled"]];

let sql = `-- KK4 Supabase Seed — generated from KK4-All.xlsx
-- Run AFTER supabase_migration.sql
-- Contains master data + documents + submissions

`;

sql += `-- Project\nINSERT INTO "project_master" ("project_code","conzol_project_code","title","plant","phase","project_type","active") VALUES ('CM24045','SKK-IM-CM26002','Cement Implement SKK - Satellite Burner KK4','Siam Kraft Industry Co., Ltd.','Implementation','Capex',true) ON CONFLICT ("project_code") DO NOTHING;\n`;
sql += `INSERT INTO "originator_master" ("originator_code","originator_name","active") VALUES ('EPS','Eco Plant Services Co., Ltd.',true) ON CONFLICT ("originator_code") DO NOTHING;\n`;
sql += `INSERT INTO "app_user" ("user_id","email","display_name","password_hash","is_admin","created_at") VALUES (gen_random_uuid(),'admin@scg.com','Document Controller (Admin)','scg_doc_control_2026',true, now()) ON CONFLICT ("email") DO NOTHING;\n`;

for (const d of MASTER_DISCIPLINES) sql += `INSERT INTO "discipline_master" ("discipline_code","discipline_name","active") VALUES ('${esc(d.code)}','${esc(d.name)}',true) ON CONFLICT ("discipline_code") DO UPDATE SET "discipline_name"=EXCLUDED."discipline_name";\n`;
for (const [c,desc] of MASTER_TYPES) sql += `INSERT INTO "document_type_master" ("type_code","type_description","active") VALUES ('${esc(c)}','${esc(desc)}',true) ON CONFLICT ("type_code") DO NOTHING;\n`;
for (const [c,n] of MASTER_STATUSES) sql += `INSERT INTO "status_master" ("status_code","status_name","active") VALUES ('${esc(c)}','${esc(n)}',true) ON CONFLICT ("status_code") DO NOTHING;\n`;
for (const [c,desc] of MASTER_REVISIONS) sql += `INSERT INTO "revision_master" ("revision_code","revision_description","active") VALUES ('${esc(c)}','${esc(desc)}',true) ON CONFLICT ("revision_code") DO NOTHING;\n`;
for (const [c,desc] of MASTER_PURPOSES) sql += `INSERT INTO "purpose_of_issue_master" ("purpose_code","purpose_description","active") VALUES ('${esc(c)}','${esc(desc)}',true) ON CONFLICT ("purpose_code") DO NOTHING;\n`;
sql += `INSERT INTO "return_code_master" ("return_code","return_description","active") VALUES ('A','Approved',true),('AC','Approved with Comments',true),('RC','Return to Correct',true),('R','Rejected',true),('INF','For Information Only',true) ON CONFLICT ("return_code") DO NOTHING;\n`;

if (!fs.existsSync(excelPath)) {
  console.error("Excel not found", excelPath);
  process.exit(1);
}
const wb = xlsx.readFile(excelPath);
let totalDocs = 0, totalSubs = 0;
const docsJson = [];
const seenGroups = new Set();
const seenTypes = new Set();

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
      const seq = String(i-2).padStart(4,"0");
      docNo = `CM24045-EPS-${group}-${type}-${seq}`;
    }
    const revRaw = r[5] != null ? String(r[5]).trim() : "00";
    const rev = revRaw ? (revRaw.length===1 ? `0${revRaw}` : revRaw) : "00";
    const isoDate = excelDateToISO(r[6] ?? r[11]);
    const purpose = String(r[7] || "IFI").trim().toUpperCase() || "IFI";
    const receiver = String(r[8] || "Owner").trim() || "Owner";
    const erpSynced = true;

    if (!seenGroups.has(group)) {
      seenGroups.add(group);
      sql += `INSERT INTO "document_group_master" ("group_code","group_name","discipline_code","active") VALUES ('${esc(group)}','${esc(title.slice(0,120))}','${esc(disc)}',true) ON CONFLICT ("group_code") DO NOTHING;\n`;
    }
    if (!seenTypes.has(type)) {
      seenTypes.add(type);
      sql += `INSERT INTO "document_type_master" ("type_code","type_description","active") VALUES ('${esc(type)}','${esc(type)}',true) ON CONFLICT ("type_code") DO NOTHING;\n`;
    }
    // Ensure revision/purpose exist (in case custom)
    sql += `INSERT INTO "revision_master" ("revision_code","revision_description","active") VALUES ('${esc(rev)}','Revision ${esc(rev)}',true) ON CONFLICT ("revision_code") DO NOTHING;\n`;
    sql += `INSERT INTO "purpose_of_issue_master" ("purpose_code","purpose_description","active") VALUES ('${esc(purpose)}','Purpose ${esc(purpose)}',true) ON CONFLICT ("purpose_code") DO NOTHING;\n`;

    const createdAt = isoDate ? `'${isoDate}'` : `now()`;
    const planDateSql = isoDate ? `'${isoDate}'` : `NULL`;
    sql += `INSERT INTO "document_register" ("document_id","document_no","project_code","title","originator_code","group_code","type_code","current_revision","current_status","plan_date","remarks","erp_synced","erp_synced_at","erp_synced_by","created_by","created_at","updated_at") VALUES (gen_random_uuid(),'${esc(docNo)}','CM24045','${esc(title)}','EPS','${esc(group)}','${esc(type)}','${esc(rev)}','APPROVED',${planDateSql},NULL,${erpSynced},${createdAt},'System (Seeded)', 'System Seed', now(), now()) ON CONFLICT ("document_no") DO UPDATE SET "title"=EXCLUDED."title", "current_revision"=EXCLUDED."current_revision";\n`;
    // Insert submission linked via document_no lookup — use subquery for document_id
    sql += `INSERT INTO "document_submission" ("submission_id","document_id","revision","submitted_date","purpose_code","submitted_by","received_by","erp_synced","erp_synced_at","erp_synced_by","created_at") SELECT gen_random_uuid(), d."document_id",'${esc(rev)}',${createdAt},'${esc(purpose)}','Engineer','${esc(receiver)}',true,${createdAt},'System', now() FROM "document_register" d WHERE d."document_no"='${esc(docNo)}' ON CONFLICT DO NOTHING;\n`;
    totalDocs++;
    totalSubs++;
    docsJson.push({ documentNo: docNo, title, groupCode: group, typeCode: type, disciplineCode: disc, currentRevision: rev, currentStatus: "APPROVED", erpSynced: true });
  }
}

fs.writeFileSync(outSql, sql, "utf8");
fs.writeFileSync(outJson, JSON.stringify({ totalDocs, totalSubs, sample: docsJson.slice(0,10) }, null, 2), "utf8");
console.log(`Generated ${outSql} — ${totalDocs} docs, ${totalSubs} subs, ${seenGroups.size} groups, ${seenTypes.size} types`);
