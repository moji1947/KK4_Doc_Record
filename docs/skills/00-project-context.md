# 00 — Project Context

## บริบทธุรกิจ

โปรเจกต์: **Cement Implement SKK - Satellite Burner KK4**
Conzol Project Code: `SKK-IM-CM26002`
Internal Project Code: `CM24045`
องค์กร: SCG (Siam Cement)

ทีมงาน EPC (Engineering, Procurement, Construction) เดิมทำ Document Control ผ่าน
Excel + Email + ConZol DMS แบบแมนนวลทั้งหมด เอกสารนี้คือบริบทว่า "ทำไม" ระบบต้องออกแบบแบบนี้
ไม่ใช่แค่ "ทำอะไร" — เข้าใจ context ก่อนแก้โค้ดทุกครั้ง

## ปัญหาหลักที่ระบบนี้ต้องแก้ (เรียงตามความสำคัญ)

### 1. การออกเลขเอกสารด้วยมือ (สำคัญที่สุด)
รูปแบบเลขเอกสาร: `[ProjectCode]-[Originator]-[GroupCode]-[TypeCode]-[SequenceNo]`
ตัวอย่างจริง: `CM24045-EPS-ME06-FD-0001`

ปัญหาเดิม: ผู้ใช้หลายคนออกเลขเอกสารพร้อมกันใน Excel คนละไฟล์ ทำให้เลขซ้ำหรือเลขตกหล่น
**นี่คือจุดที่ระบบใหม่ต้องแก้ให้ได้ 100% ด้วย database transaction จริง**
ดูรายละเอียดเต็มใน `03-numbering-concurrency.md`

### 2. Register ขยายแนวนอนไม่จำกัด
ไฟล์ Document Register จริงของทีม ME/CE/EE มีคอลัมน์มากถึง 132 คอลัมน์ เพราะทุกครั้งที่มี
revision ใหม่ต้องเพิ่มชุดคอลัมน์ Rev/Date/Purpose/Receiver ต่อท้ายไปเรื่อยๆ (รองรับถึง Submitted-30)

ระบบใหม่ต้องแยกเป็น 2 ตาราง: `DocumentRegister` (header, 1 แถวต่อเอกสาร) และ
`DocumentSubmission` (1 แถวต่อ 1 revision) — ดู `02-data-model.md`

### 3. Master Data กระจัดกระจาย และนิยามขัดกันเอง
พบว่าคำว่า **RFI** ถูกตีความ 2 แบบในไฟล์ต้นฉบับเดียวกัน: บางชีตนิยาม RFI = "Request For
Inspection" (แยกจาก RIN = "Request For Information") แต่อีกชีตนิยาม RFI = "Request for
Information" เอง — เมื่อ seed ข้อมูลจริงเข้าระบบ ต้องยึดนิยามเดียว (RFI = Inspection,
RIN = Information) และตรวจสอบว่าไม่มี TypeCode ที่ความหมายซ้ำซ้อนกันหลุดเข้ามา

### 4. ไม่มี Dashboard แบบเรียลไทม์
ผู้บริหารต้องรอสรุปรายสัปดาห์ ไม่เห็นสถานะเอกสารสด — เป็น Phase หลังของ roadmap ไม่ใช่ MVP

### 5. Distribution ต้องจำเอง
Excel Matrix เดิมมีผู้ใช้ 60+ คน x Document Group 170+ กลุ่ม ต้องเปิดดูเองทุกครั้งว่าใครต้อง
ได้รับ/อนุมัติเอกสารกลุ่มไหน — แทนด้วยตาราง `RoleAssignmentMatrix` ใน database

## ทำไมเปลี่ยนจาก Power Apps มาเป็นเว็บแอปโค้ดจริง

แผนเดิมคือ SharePoint Lists + Power Apps + Power Automate แต่เปลี่ยนมาเป็นเว็บแอปแบบ custom
เพราะ:
- Power Automate จัดการ concurrency ของการออกเลขเอกสารได้ไม่ดีพอ (เสี่ยง race condition)
- ต้องการควบคุม UX แบบ Excel-like ได้เต็มที่ (grid, filter, cascading dropdown ที่ซับซ้อน)
- SharePoint List Choice column ผูกกับ Master Data แบบหลวมๆ ไม่ใช่ relational integrity จริง

## ผู้ใช้งานหลัก

| กลุ่มผู้ใช้ | บทบาท |
|---|---|
| Document Controller | ลงทะเบียน/ออกเลขเอกสาร, ดูแล Master Data |
| Project Engineer | ตรวจ/อนุมัติเอกสารทางเทคนิค |
| Discipline Engineer (ME/EE/CE) | จัดทำ/ตรวจเอกสารในสาขาของตน |
| PM / PMD / PED | ดูภาพรวมความคืบหน้า, อนุมัติเอกสารระดับสูง |
| Vendor/Contractor | ส่งเอกสารผ่าน Portal (Phase หลัง) |
