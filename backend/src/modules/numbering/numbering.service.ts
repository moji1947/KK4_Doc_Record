import { prisma } from "../../config/prisma";
import { GenerateDocumentNumberInput } from "./numbering.schema";

// ==========================================================================
// จุดที่สำคัญที่สุดของทั้งระบบ — อ่าน docs/skills/03-numbering-concurrency.md
// ก่อนแก้ไฟล์นี้ ห้ามเปลี่ยนวิธีการทำงานให้ไป query MAX() นอก transaction เด็ดขาด
// ==========================================================================

export function buildSequenceKey(params: GenerateDocumentNumberInput): string {
  return [params.projectCode, params.originatorCode, params.groupCode, params.typeCode].join(
    "-"
  );
}

/**
 * ดูเลขเอกสารถัดไปโดยไม่เปลี่ยนแปลง database (สำหรับ UI Live Preview)
 */
export async function peekNextDocumentNumber(
  params: GenerateDocumentNumberInput
): Promise<string> {
  const sequenceKey = buildSequenceKey(params);
  const row = await prisma.documentNumberSequence.findUnique({
    where: { sequenceKey },
  });

  const nextSeq = (row?.lastSequence ?? 0) + 1;
  const sequenceStr = String(nextSeq).padStart(4, "0");
  return `${params.projectCode}-${params.originatorCode}-${params.groupCode}-${params.typeCode}-${sequenceStr}`;
}

/**
 * ออกเลขเอกสารถัดไปแบบ atomic ปลอดภัยจาก race condition
 * แม้มีหลาย request เรียกพร้อมกันในชุด (project+originator+group+type) เดียวกัน
 * จะได้เลขไม่ซ้ำและต่อเนื่องกันเสมอ เพราะใช้ row-level lock (FOR UPDATE) ภายใน transaction
 */
export async function generateNextDocumentNumber(
  params: GenerateDocumentNumberInput
): Promise<string> {
  const sequenceKey = buildSequenceKey(params);

  const documentNo = await prisma.$transaction(async (tx) => {
    // สร้างแถวเริ่มต้นถ้ายังไม่เคยมี sequence สำหรับชุดนี้มาก่อน
    await tx.$executeRaw`
      INSERT INTO "document_number_sequence" ("sequence_key", "last_sequence")
      VALUES (${sequenceKey}, 0)
      ON CONFLICT ("sequence_key") DO NOTHING
    `;

    // ล็อกแถวนี้ไว้จนกว่า transaction จะจบ กัน request อื่นอ่านค่าเดิมพร้อมกัน
    const rows = await tx.$queryRaw<{ last_sequence: number }[]>`
      SELECT "last_sequence" FROM "document_number_sequence"
      WHERE "sequence_key" = ${sequenceKey}
      FOR UPDATE
    `;

    const currentSequence = rows[0]?.last_sequence ?? 0;
    const nextSequence = currentSequence + 1;

    await tx.$executeRaw`
      UPDATE "document_number_sequence"
      SET "last_sequence" = ${nextSequence}
      WHERE "sequence_key" = ${sequenceKey}
    `;

    const sequenceStr = String(nextSequence).padStart(4, "0");
    return `${params.projectCode}-${params.originatorCode}-${params.groupCode}-${params.typeCode}-${sequenceStr}`;
  });

  return documentNo;
}
