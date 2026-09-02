# 05 — UX Principles (สำหรับ Frontend ในขั้นถัดไป)

เอกสารนี้เก็บหลักการ UX ที่ frontend ต้องยึดตาม อ้างอิงจาก UX Strategy ที่วิเคราะห์จากไฟล์ต้นฉบับ
และปัญหาจริงที่ผู้ใช้เจอตอนทดลองสร้างต้นแบบใน Power Apps

## หลักการหลัก

1. **Excel-Familiar, not Excel-Limited** — หน้าตา grid คุ้นเคย แต่มี Data Integrity ที่ Excel
   ให้ไม่ได้ (Lookup บังคับ, Validation, Auto-number)
2. **Zero Manual Numbering** — ผู้ใช้ไม่ต้องคิด/พิมพ์เลขเอกสารเองอีกต่อไป
3. **Single Source of Truth** — ทุกฟิลด์ที่ควรเป็น Master Data ต้องเป็น dropdown/combobox
   ที่ดึงจาก database จริง ห้ามเป็นช่องพิมพ์อิสระ

## Component สำคัญ: CodeDescriptionCombobox

ทุก field ที่อ้างอิง Master Data (Group, TypeCode, Originator, Status, Project) ต้องใช้
component เดียวกัน ที่มีพฤติกรรมนี้:

- **ตอนเปิดดรอปดาวน์เลือก**: แสดงทั้งรหัสและคำอธิบาย เช่น `FD — Fabrication Drawing`
  เพื่อให้ผู้ใช้เลือกถูกโดยไม่ต้องจำรหัสทั้งหมด
- **หลังเลือกเสร็จแล้ว**: ช่องแสดงแค่รหัสสั้นๆ เช่น `FD` เท่านั้น เพื่อให้ grid/form ดูสะอาด
  ไม่รกด้วยข้อความยาว

(นี่คือจุดที่ Power Apps Classic ComboBox ทำได้ยาก เพราะ property `DisplayFields` ตัวเดียว
คุมทั้งสองสถานะ — ด้วยโค้ดจริงบน React ทำแยกกันได้ง่ายกว่ามาก ใช้ shadcn/ui Combobox +
custom render function สำหรับ option list กับ selected value แยกกัน)

## Cascading Dropdown

ฟอร์ม New Document ต้องเลือกตามลำดับ: Discipline → Group (กรองจาก Discipline ที่เลือก) →
TypeCode (กรองจาก GroupTypeMapping ของ Group ที่เลือก) — ตัวเลือกที่ไม่เกี่ยวข้องต้อง**ซ่อน
ไปเลย ไม่ใช่แค่ disable** เพื่อลด choice overload

## Live Preview เลขเอกสาร

ระหว่างกรอกฟอร์ม New Document ต้องแสดงเลขเอกสารที่จะถูกออกจริงแบบ real-time (read-only)
ทุกครั้งที่ผู้ใช้เปลี่ยนตัวเลือก Discipline/Group/Type ก่อนกด Save จริง

## Document Register Grid

- Column แสดงผลเริ่มต้น: Document No. | Title | Discipline | Group | Type | Rev | Status |
  Originator | Plan Date
- ผู้ใช้ปรับ show/hide/reorder คอลัมน์ได้เอง และระบบจำ view ล่าสุดของแต่ละคน
- Filter ต่อคอลัมน์แบบ Excel AutoFilter (คลิกหัวคอลัมน์ → เลือกค่าที่มีอยู่จริง)
- Multi-column sort (Shift+คลิกหัวคอลัมน์ที่สอง)
- Conditional formatting อัตโนมัติ: แถวสีแดงอ่อน = เกิน SLA, เหลืองอ่อน = ใกล้ครบกำหนด
- Quick search แบบ instant-filter ทุกคอลัมน์ที่มองเห็น
