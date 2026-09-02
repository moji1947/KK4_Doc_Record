# 03 — Document Numbering & Concurrency (สำคัญที่สุดของระบบ)

## ทำไมเรื่องนี้สำคัญมาก

ปัญหาที่ใหญ่ที่สุดของระบบเดิม (Excel) คือผู้ใช้หลายคนออกเลขเอกสารพร้อมกันแล้วได้เลขซ้ำกัน
ถ้าระบบใหม่แก้ปัญหานี้ไม่ได้จริง ก็ไม่มีเหตุผลที่จะสร้างระบบใหม่เลย — **ทุก implementation
ของ numbering logic ต้องพิสูจน์ด้วย test ว่าปลอดภัยจาก race condition จริง**

## รูปแบบเลขเอกสาร

```
[ProjectCode]-[Originator]-[GroupCode]-[TypeCode]-[SequenceNo]
ตัวอย่าง: CM24045-EPS-ME06-FD-0001
```

SequenceNo นับแยกตามชุด (ProjectCode + Originator + GroupCode + TypeCode) — แต่ละชุดมี
ลำดับของตัวเอง เริ่มจาก 0001

## วิธี implement ที่ถูกต้อง (บังคับ)

ใช้ PostgreSQL row-level lock ผ่าน Prisma transaction แบบนี้เท่านั้น:

```typescript
async function getNextDocumentNumber(params: {
  projectCode: string;
  originatorCode: string;
  groupCode: string;
  typeCode: string;
}): Promise<string> {
  const sequenceKey = `${params.projectCode}-${params.originatorCode}-${params.groupCode}-${params.typeCode}`;

  return prisma.$transaction(async (tx) => {
    // SELECT ... FOR UPDATE เพื่อ lock แถวนี้ระหว่าง transaction
    // ป้องกัน request อื่นอ่านค่าเดิมไปพร้อมกันจนได้เลขซ้ำ
    await tx.$executeRaw`
      INSERT INTO "DocumentNumberSequence" ("SequenceKey", "LastSequence")
      VALUES (${sequenceKey}, 0)
      ON CONFLICT ("SequenceKey") DO NOTHING
    `;

    const [row] = await tx.$queryRaw<{ LastSequence: number }[]>`
      SELECT "LastSequence" FROM "DocumentNumberSequence"
      WHERE "SequenceKey" = ${sequenceKey}
      FOR UPDATE
    `;

    const nextSequence = row.LastSequence + 1;

    await tx.$executeRaw`
      UPDATE "DocumentNumberSequence"
      SET "LastSequence" = ${nextSequence}
      WHERE "SequenceKey" = ${sequenceKey}
    `;

    const sequenceStr = String(nextSequence).padStart(4, "0");
    return `${params.projectCode}-${params.originatorCode}-${params.groupCode}-${params.typeCode}-${sequenceStr}`;
  });
}
```

**สิ่งที่ห้ามทำเด็ดขาด:**
- ห้าม query `MAX(SequenceNo)` จากตาราง DocumentRegister แล้ว +1 นอก transaction
  (นี่คือสาเหตุที่ Excel/Power Automate เดิมเลขชนกัน — race condition แบบคลาสสิก)
- ห้าม generate เลขที่ frontend แล้วส่งมาให้ backend บันทึกตรงๆ
- ห้ามปล่อยให้ transaction นี้ครอบคลุมงานอื่นที่ช้า (เช่น ส่งอีเมล) เพราะจะ hold lock นานเกินไป
  จนคนอื่นรอคิวช้า — แยก side effect อื่นออกไปทำหลัง transaction commit แล้ว

## Test ที่บังคับต้องมี

ต้องเขียน integration test ที่ยิง request สร้างเอกสารในชุด (Project+Originator+Group+Type)
เดียวกันพร้อมกันอย่างน้อย 20-50 request แบบขนาน (Promise.all) แล้วตรวจสอบว่า:
1. ได้เลขเอกสารไม่ซ้ำกันเลยแม้แต่ตัวเดียว
2. เลขต่อเนื่องกันโดยไม่มี gap (0001, 0002, 0003, ... ไม่ข้าม)

```typescript
test("auto-numbering ไม่ชนกันแม้สร้างพร้อมกันจำนวนมาก", async () => {
  const promises = Array.from({ length: 30 }, () =>
    getNextDocumentNumber({
      projectCode: "CM24045",
      originatorCode: "EPS",
      groupCode: "ME06",
      typeCode: "FD",
    })
  );
  const results = await Promise.all(promises);
  const uniqueResults = new Set(results);
  expect(uniqueResults.size).toBe(30); // ต้องไม่มีเลขซ้ำเลย
});
```

## Cancel / Migration edge case

- เอกสารที่ยกเลิก (สถานะ CANCEL) ไม่คืนเลขกลับมาใช้ซ้ำ เพื่อรักษา audit trail ต่อเนื่อง
- ตอน migrate ข้อมูลเก่าจาก Excel ที่เลขไม่ต่อเนื่อง (มี gap) ให้ import เลขเดิมตรงๆ
  (bypass auto-generate) แต่ต้องอัปเดต `LastSequence` ใน DocumentNumberSequence ให้ไม่ชน
  ของเก่าโดยอัตโนมัติหลัง import เสร็จ
