# 04 — Coding Standards

## TypeScript
- Strict mode เปิดทุกที่ (`"strict": true` ใน tsconfig.json)
- ห้ามใช้ `any` โดยไม่มีคอมเมนต์อธิบายเหตุผล
- ใช้ Zod schema เป็นแหล่งความจริงของ type (infer type จาก schema ด้วย `z.infer<typeof schema>`)
  แทนการประกาศ interface ซ้ำ

## API Design
- ทุก endpoint validate request/response ด้วย Zod ผ่าน Fastify schema
- Error response shape เดียวกันทั้งระบบ:
  ```json
  { "error": { "code": "DOCUMENT_NOT_FOUND", "message": "...", "details": {} } }
  ```
- REST convention: `/api/v1/documents`, `/api/v1/master-data/disciplines` ฯลฯ
- ทุก endpoint ต้อง generate เข้า Swagger/OpenAPI doc อัตโนมัติ

## Testing
- ใช้ Vitest ทั้ง backend และ frontend
- Business logic สำคัญ (โดยเฉพาะ numbering, cascading filter) ต้องมี unit test คู่กันเสมอ
- Numbering logic ต้องมี concurrency test ตามที่ระบุใน `03-numbering-concurrency.md`
- ตั้งเป้า coverage อย่างน้อย 70% สำหรับ `modules/numbering` และ `modules/documents`

## Logging
- ใช้ pino (มากับ Fastify) เป็น structured logger เท่านั้น
- ห้ามใช้ `console.log` ใน production code (ยกเว้น script ชั่วคราวที่ลบทิ้งก่อน commit)
- Log ทุก error พร้อม context (request id, user id ถ้ามี)

## Git
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- Husky + lint-staged บังคับ lint ก่อน commit ทุกครั้ง

## Environment Variables
- ทุกตัวแปรต้องอยู่ใน `.env.example` พร้อมคำอธิบาย
- ห้าม hardcode ค่า config (connection string, secret) ในโค้ดเด็ดขาด

## Folder Convention
- แยกตาม domain feature (`modules/documents/`, `modules/master-data/`) ไม่ใช่แยกตาม type
  (`controllers/`, `services/`, `routes/` ปนกันหมด) —ดูตัวอย่างใน `01-architecture.md`
