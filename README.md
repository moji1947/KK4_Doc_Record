# SCG KK4 Document Register & ConZoL Upload Platform

Production-grade Document Register & Pre-ConZoL Handoff Control Platform สำหรับโครงการ **Cement Implement SKK - Satellite Burner KK4**
- **Conzol Project Code**: `SKK-IM-CM26002`
- **Internal Project Code**: `CM24045`

---

## 🎯 ปัญหาที่ระบบเข้ามาแก้ไข (Key Pain Points Solved)

1. **Auto Document Numbering & Sequence Lock**: ออกเลขเอกสารอัตโนมัติแบบ Concurrency-Safe (`SELECT ... FOR UPDATE`) ป้องกันการจำผิด เลขชนกัน หรือออกเลขซ้ำ 100%
2. **Smart Combined Input**: พิมพ์รหัสรวมเพียงช่องเดียว (เช่น `ME06-FD` หรือ `EXM00`) ระบบจะแยก (Parse) เป็น Discipline / Group / Type พร้อมต่อเลข Sequence 4 หลักสุดท้ายให้อัตโนมัติทันที
3. **Execution Groups (Full Code Support)**: แก้ไขข้อจำกัดของสูตร Excel เดิมที่ตัดรหัส Group เหลือ 3-4 ตัวอักษร ให้รองรับรหัสเต็ม เช่น `EXM00`, `EXM01`, `EXE00`, `EXE01`, `EXC00`, `SHE01`
4. **Persistent ConZoL Upload Tracking**: มีแท็บ `🟡 Pending ConZoL` กะพริบเตือนชัดเจน สีไฮไลต์ไม่หายไปตามวันเวลา จนกว่า Admin จะกด **"Mark as Uploaded"** (1-Click ConZoL Sync พร้อม Server Timestamp)
5. **1-Click Copy Document No**: ปุ่มกดคัดลอกเลขเอกสารเพื่อนำไป Paste ลงในระบบ ConZoL DMS ได้ทันที ลด Human Error จากการพิมพ์มือ
6. **1 Document : N Submissions**: แทนที่ตารางแนวนอน 132 คอลัมน์ด้วยโครงสร้าง Normalized Data + Spreadsheet Interface

---

## 🏗️ โครงสร้างโปรเจกต์ (Monorepo Architecture)

```
KK4_Doc_Record/
├── backend/                  # Fastify + TypeScript + Prisma ORM + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma     # 10 Master Data Tables + 4 Transaction Tables
│   │   ├── seed.ts           # Dynamic Parser นำเข้าข้อมูลจริงจาก KK4-All.xlsx
│   │   └── source-data/      # ไฟล์ Excel ต้นฉบับ (KK4-All.xlsx)
│   └── src/
│       ├── modules/documents # Document CRUD, Filtering, ConZoL Status Sync
│       ├── modules/numbering # Concurrency-Safe Atomic Sequence Engine
│       └── modules/master-data
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── features/documents
│   │   │   ├── components/SpreadsheetView.tsx  # Google Sheets / Excel Interface
│   │   │   ├── components/DocumentDetailModal.tsx
│   │   │   └── components/SubmitRevisionModal.tsx
│   │   └── components/       # Header, Dialog, Badges, Tabs
├── docker-compose.yml        # Multi-container orchestration (PostgreSQL, Backend, Frontend)
└── package.json              # Monorepo convenience scripts
```

---

## 🚀 วิธีการเริ่มต้นใช้งาน (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm run install:all
```

### 2. รัน Frontend (Web Application)
```bash
cd frontend
npm run dev
```
เปิดเบราว์เซอร์ไปที่: 👉 **`http://localhost:3000`** *(หรือ `http://localhost:3001`)*

### 3. รัน Backend API
```bash
cd backend
npm run dev
```
Backend API จะทำงานที่: 👉 **`http://localhost:4000`** (Swagger API Docs: `http://localhost:4000/docs`)

---

## 📊 ข้อมูลในระบบ (Seeded Records)
- ครบทั้ง **176 เอกสาร** และ **129 กลุ่มเอกสาร** จากไฟล์ `KK4-All.xlsx`
- แยกตาม Sheet: `ME`, `EE`, `CE`, `EXM`, `EXE`, `EXC`, `SHE`, `PRC`, `PJ`, `VD`
