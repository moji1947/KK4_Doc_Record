# 02 — Data Model

โครงสร้างข้อมูลนี้อ้างอิงจากไฟล์ Excel จริงของโปรเจกต์ (Master Data ที่ Rebuild แล้วสำหรับ
SharePoint + Document Register จริงของทีม ME/CE/EE) — ดู schema เต็มที่ implement แล้วใน
`backend/prisma/schema.prisma`

## Master Data Tables

| ตาราง | คอลัมน์หลัก | หมายเหตุ |
|---|---|---|
| ProjectMaster | ProjectCode (PK), ConzolProjectCode, Title, Plant, Phase, ProjectType, Active | โปรเจกต์มีรหัส 2 ระบบ (Internal กับ Conzol) ต้องเก็บทั้งคู่ |
| DisciplineMaster | DisciplineCode (PK), DisciplineName, Active | เช่น ME, EE, CE, PJ, EX |
| DocumentGroupMaster | GroupCode (PK), GroupName, DisciplineCode (FK), Active | เช่น ME06 = Fabrication Drawing |
| DocumentTypeMaster | TypeCode (PK), TypeDescription, Active | เช่น FD, RFI, ITP — ระวังเรื่อง RFI/RIN ตาม 00-project-context.md |
| GroupTypeMapping | GroupCode (FK), TypeCode (FK) | many-to-many กำหนดว่า Group ไหนใช้ Type อะไรได้บ้าง |
| OriginatorMaster | OriginatorCode (PK), OriginatorName, Active | เช่น EPS = Eco Plant Services |
| StatusMaster | StatusCode (PK), StatusName, Active | เช่น DRAFT, SUBMITTED, APPROVED |
| RevisionMaster | RevisionCode (PK), RevisionDescription, Active | เช่น A1, A2, B1, 00-99 |
| ReturnCodeMaster | ReturnCode (PK), ReturnDescription, Active | เช่น A=Approve, RC=Return to Correct |
| PurposeOfIssueMaster | PurposeCode (PK), PurposeDescription, Active | เช่น IFI, IFC, AB, CANCEL |

## Transaction Tables

**DocumentRegister** (1 แถวต่อ 1 เอกสาร — header เท่านั้น ห้ามเก็บ revision history ที่นี่)
- DocumentId (PK, UUID)
- DocumentNo (unique, auto-generated — ดู 03-numbering-concurrency.md)
- ProjectCode (FK), Title, OriginatorCode (FK), GroupCode (FK), TypeCode (FK)
- CurrentRevision (FK), CurrentStatus (FK), PlanDate, Remarks
- CreatedBy, CreatedAt, UpdatedBy, UpdatedAt

**DocumentSubmission** (1 แถวต่อ 1 revision/transmittal — แทนคอลัมน์แนวนอน 132 คอลัมน์แบบเดิม)
- SubmissionId (PK, UUID), DocumentId (FK -> DocumentRegister)
- Revision (FK), SubmittedDate, PurposeCode (FK), SubmittedBy, ReceivedBy
- ReturnCode (FK, nullable), AttachmentUrl

**DocumentNumberSequence** (ตารางคุม auto-numbering แบบ atomic — สำคัญที่สุด)
- SequenceKey (PK) = composite ของ ProjectCode + OriginatorCode + GroupCode + TypeCode
- LastSequence (int)

**RoleAssignmentMatrix** (แทน Distribution Matrix เดิมที่เป็น Excel)
- UserId (FK), GroupCode (FK), Role (enum: Creator, Reviewer, Consolidator, Approver, CC)

## กฎการอ้างอิงข้อมูล

- ทุก field ที่ควรเป็น Master Data ต้องเป็น Foreign Key จริง ห้ามเก็บเป็น free text
- Seed ข้อมูล Master Data จากไฟล์ Excel จริงเสมอ ห้าม mock ข้อมูลปลอมถ้ามีข้อมูลจริงให้ใช้
  (ดูตำแหน่งไฟล์ที่ต้องแนบใน `backend/prisma/source-data/`)
