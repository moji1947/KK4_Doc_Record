import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

const MASTER_DISCIPLINES = [
  { disciplineCode: "PJ", disciplineName: "Project Information" },
  { disciplineCode: "ME", disciplineName: "Mechanical Engineering" },
  { disciplineCode: "CE", disciplineName: "Civil Engineering" },
  { disciplineCode: "EE", disciplineName: "Electrical Engineering" },
  { disciplineCode: "EX", disciplineName: "Execution - All" },
  { disciplineCode: "EXM", disciplineName: "Execution - Mechanical" },
  { disciplineCode: "EXE", disciplineName: "Execution - Electrical" },
  { disciplineCode: "EXC", disciplineName: "Execution - Civil" },
  { disciplineCode: "PRC", disciplineName: "Procurement / Commercial" },
  { disciplineCode: "SHE", disciplineName: "Safety, Health and Environment" },
  { disciplineCode: "VD", disciplineName: "Vendor Document" },
];

const MASTER_TYPES = [
  { typeCode: "INV", typeDescription: "Investigation / Study Report" },
  { typeCode: "GA", typeDescription: "General Arrangement Drawing" },
  { typeCode: "FD", typeDescription: "Fabrication Drawing" },
  { typeCode: "FS", typeDescription: "Process Flowsheet" },
  { typeCode: "LD", typeDescription: "Load Data" },
  { typeCode: "MHB", typeDescription: "Mass & Heat Balance" },
  { typeCode: "CR", typeDescription: "Change Order / Request" },
  { typeCode: "EXL", typeDescription: "Equipment / Instrument List" },
  { typeCode: "TYD", typeDescription: "Typical Drawing" },
  { typeCode: "SLD", typeDescription: "Single Line Diagram" },
  { typeCode: "CBL", typeDescription: "Cable List" },
  { typeCode: "CBR", typeDescription: "Cable Routing" },
  { typeCode: "CIF", typeDescription: "Civil Information / Soil Report" },
  { typeCode: "DDD", typeDescription: "Detailed Design Drawing" },
  { typeCode: "SHD", typeDescription: "Shop Drawing" },
  { typeCode: "MTS", typeDescription: "Method Statement" },
  { typeCode: "MTA", typeDescription: "Material Approval" },
  { typeCode: "RIN", typeDescription: "Request for Information" },
  { typeCode: "JSA", typeDescription: "Job Safety Analysis" },
  { typeCode: "WPK", typeDescription: "Work Permit" },
  { typeCode: "REP", typeDescription: "Report" },
  { typeCode: "SPE", typeDescription: "Specification" },
  { typeCode: "DWG", typeDescription: "Drawing" },
];

const MASTER_PURPOSES = [
  { purposeCode: "IFI", purposeDescription: "Issue For Information" },
  { purposeCode: "IFR", purposeDescription: "Issue For Review" },
  { purposeCode: "IFA", purposeDescription: "Issue For Approval" },
  { purposeCode: "IFC", purposeDescription: "Issue For Construction" },
  { purposeCode: "AB", purposeDescription: "As Built" },
  { purposeCode: "CANCEL", purposeDescription: "Cancelled" },
];

const MASTER_STATUSES = [
  { statusCode: "DRAFT", statusName: "Draft" },
  { statusCode: "SUBMITTED", statusName: "Submitted" },
  { statusCode: "REVIEWED", statusName: "Reviewed" },
  { statusCode: "APPROVED", statusName: "Approved" },
  { statusCode: "APPROVED_COMMENTS", statusName: "Approved with Comments" },
  { statusCode: "REJECTED", statusName: "Rejected" },
  { statusCode: "ISSUED", statusName: "Issued" },
  { statusCode: "CANCELLED", statusName: "Cancelled" },
];

const MASTER_REVISIONS = [
  { revisionCode: "A01", revisionDescription: "For Permission - Rev 01" },
  { revisionCode: "A02", revisionDescription: "For Permission - Rev 02" },
  { revisionCode: "B01", revisionDescription: "For Bidding - Rev 01" },
  { revisionCode: "B02", revisionDescription: "For Bidding - Rev 02" },
  { revisionCode: "00", revisionDescription: "Issue for Construction - Rev 00" },
  { revisionCode: "01", revisionDescription: "Issue for Construction - Rev 01" },
  { revisionCode: "02", revisionDescription: "Issue for Construction - Rev 02" },
  { revisionCode: "03", revisionDescription: "Issue for Construction - Rev 03" },
  { revisionCode: "04", revisionDescription: "Issue for Construction - Rev 04" },
  { revisionCode: "AB", revisionDescription: "Final As-Built" },
];

function excelDateToJs(excelDate: number | string | undefined | null): Date | null {
  if (!excelDate) return null;
  const num = typeof excelDate === "number" ? excelDate : parseFloat(excelDate);
  if (isNaN(num) || num < 1000) return null;
  return new Date(Math.round((num - 25569) * 86400 * 1000));
}

async function main() {
  console.log("🌱 Starting KK4-All Full Database Seeding...");

  // 1. Seed Project
  await prisma.projectMaster.upsert({
    where: { projectCode: "CM24045" },
    update: {},
    create: {
      projectCode: "CM24045",
      conzolProjectCode: "SKK-IM-CM26002",
      title: "Cement Implement SKK - Satellite Burner KK4",
      plant: "Siam Kraft Industry Co., Ltd.",
      phase: "Implementation",
      projectType: "Capex",
      active: true,
    },
  });

  // 2. Seed Originators
  await prisma.originatorMaster.upsert({
    where: { originatorCode: "EPS" },
    update: {},
    create: {
      originatorCode: "EPS",
      originatorName: "Eco Plant Services Co., Ltd.",
      active: true,
    },
  });

  // 3. Seed Disciplines
  for (const d of MASTER_DISCIPLINES) {
    await prisma.disciplineMaster.upsert({
      where: { disciplineCode: d.disciplineCode },
      update: { disciplineName: d.disciplineName },
      create: d,
    });
  }

  // 4. Seed Types
  for (const t of MASTER_TYPES) {
    await prisma.documentTypeMaster.upsert({
      where: { typeCode: t.typeCode },
      update: { typeDescription: t.typeDescription },
      create: t,
    });
  }

  // 5. Seed Statuses, Revisions, Purposes
  for (const s of MASTER_STATUSES) {
    await prisma.statusMaster.upsert({
      where: { statusCode: s.statusCode },
      update: { statusName: s.statusName },
      create: s,
    });
  }

  for (const r of MASTER_REVISIONS) {
    await prisma.revisionMaster.upsert({
      where: { revisionCode: r.revisionCode },
      update: { revisionDescription: r.revisionDescription },
      create: r,
    });
  }

  for (const p of MASTER_PURPOSES) {
    await prisma.purposeOfIssueMaster.upsert({
      where: { purposeCode: p.purposeCode },
      update: { purposeDescription: p.purposeDescription },
      create: p,
    });
  }

  // 6. Read and Parse KK4-All.xlsx
  const excelPath = path.resolve(__dirname, "source-data", "KK4-All.xlsx");
  if (!fs.existsSync(excelPath)) {
    console.warn("⚠️ KK4-All.xlsx not found at", excelPath);
    return;
  }

  const wb = xlsx.readFile(excelPath);
  let totalDocsCount = 0;
  let totalSubmissionsCount = 0;

  for (const sheet of wb.SheetNames) {
    if (sheet === "ATT." || sheet === "Sheet1") continue;

    const ws = wb.Sheets[sheet];
    const rows: (string | number | undefined)[][] = xlsx.utils.sheet_to_json(ws, { header: 1 });

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

      // Resolve 4-char / 5-char group codes from Document No (resolving Excel formula cutoff)
      if (docNo.startsWith("CM24045")) {
        const parts = docNo.split("-");
        if (parts.length >= 3) {
          const grpCandidate = parts[2];
          if (
            grpCandidate.startsWith("EXM") ||
            grpCandidate.startsWith("EXE") ||
            grpCandidate.startsWith("EXC") ||
            grpCandidate.startsWith("SHE") ||
            grpCandidate.startsWith("PJ") ||
            grpCandidate.startsWith("CP") ||
            grpCandidate.startsWith("ME") ||
            grpCandidate.startsWith("EE") ||
            grpCandidate.startsWith("CE") ||
            grpCandidate.startsWith("VD")
          ) {
            group = grpCandidate;
          }
          if (parts.length >= 4 && isNaN(Number(parts[3]))) {
            type = parts[3];
          }
        }
      }

      if (!group) continue;

      // Assign discipline based on group prefix if missing
      if (!disc || disc === "CM24045") {
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
        else disc = "PJ";
      }

      // Default type if empty
      if (!type) {
        if (group.startsWith("EXM") || group.startsWith("EXE") || group.startsWith("EXC")) type = "SHD";
        else if (group.startsWith("SHE")) type = "JSA";
        else if (group.startsWith("CP")) type = "REP";
        else type = "DWG";
      }

      // Format complete Document Number if sequence was missing in Excel
      if (!docNo || !docNo.match(/-\d{4}$/)) {
        const seqStr = String(i - 2).padStart(4, "0");
        docNo = `CM24045-EPS-${group}-${type}-${seqStr}`;
      }

      // Upsert Document Group
      await prisma.documentGroupMaster.upsert({
        where: { groupCode: group },
        update: { groupName: title },
        create: {
          groupCode: group,
          groupName: title,
          disciplineCode: disc,
          active: true,
        },
      });

      // Upsert Document Type if not exist
      await prisma.documentTypeMaster.upsert({
        where: { typeCode: type },
        update: {},
        create: {
          typeCode: type,
          typeDescription: type,
          active: true,
        },
      });

      const revRaw = r[5] !== undefined ? String(r[5]).trim() : "00";
      const rev = revRaw ? (revRaw.length === 1 ? `0${revRaw}` : revRaw) : "00";
      const planDate = excelDateToJs(r[6] || r[11]);
      const purpose = String(r[7] || "IFI").trim().toUpperCase() || "IFI";
      const receiver = String(r[8] || "Owner").trim() || "Owner";

      // Upsert Document Register
      const doc = await prisma.documentRegister.upsert({
        where: { documentNo: docNo },
        update: {
          title,
          currentRevision: rev,
          currentStatus: "APPROVED",
          erpSynced: true,
          erpSyncedAt: planDate || new Date(),
          erpSyncedBy: "System (Seeded from KK4-All.xlsx)",
        },
        create: {
          documentNo: docNo,
          projectCode: "CM24045",
          title,
          originatorCode: "EPS",
          groupCode: group,
          typeCode: type,
          currentRevision: rev,
          currentStatus: "APPROVED",
          planDate: planDate,
          erpSynced: true,
          erpSyncedAt: planDate || new Date(),
          erpSyncedBy: "System (Seeded from KK4-All.xlsx)",
          createdBy: "System Seed",
        },
      });
      totalDocsCount++;

      // Create initial submission
      await prisma.documentSubmission.create({
        data: {
          documentId: doc.documentId,
          revision: rev,
          submittedDate: planDate || new Date(),
          purposeCode: purpose,
          submittedBy: "Engineer",
          receivedBy: receiver,
          erpSynced: true,
          erpSyncedAt: planDate || new Date(),
          erpSyncedBy: "System",
        },
      });
      totalSubmissionsCount++;
    }
  }

  console.log(`✅ Successfully seeded ${totalDocsCount} documents and ${totalSubmissionsCount} submissions from KK4-All.xlsx!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
