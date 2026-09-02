# 01 — Architecture

## หลักการ: แยก Frontend / Backend เป็น service อิสระ

**ห้ามใช้ full-stack framework แบบรวมกัน** (เช่น Next.js full-stack ที่ผสม UI กับ API route)
ต้องแยกเป็น 2 โปรเจกต์อิสระที่คุยกันผ่าน REST API เท่านั้น เพื่อให้:
- deploy แยกกันได้อิสระ
- frontend เปลี่ยนได้ในอนาคต (เช่น ทำ mobile app เพิ่ม) โดยไม่กระทบ backend
- backend เป็น API ที่ระบบอื่นในอนาคต (Power BI, AI Agent) เรียกใช้ได้ตรงๆ

```
KK4_Doc_Record/
  backend/     -> Node.js + TypeScript + Fastify + Prisma + PostgreSQL
  frontend/    -> React + Vite + TypeScript + Tailwind + shadcn/ui
  docs/        -> เอกสารประกอบ, skills
```

## Backend Stack

| ส่วนประกอบ | เทคโนโลยีที่ใช้ | เหตุผล |
|---|---|---|
| Runtime | Node.js + TypeScript (strict mode) | type safety ตลอดทั้งระบบ |
| Web framework | Fastify | เร็วกว่า Express, มี schema validation ในตัว |
| ORM | Prisma | type-safe query, migration จัดการง่าย |
| Database | PostgreSQL | รองรับ transaction + row lock ที่จำเป็นสำหรับ auto-numbering |
| Validation | Zod | validate request/response, share type กับ frontend ได้ |
| Auth (พื้นฐาน) | JWT | เริ่มจากง่าย ออกแบบให้เสียบ Azure AD (Entra ID) SSO ได้ทีหลัง |
| Logging | pino (มากับ Fastify) | structured logging ห้ามใช้ console.log |
| API Docs | Swagger/OpenAPI (fastify-swagger) | auto-generate จาก Zod schema |

## Backend Module Structure (แบ่งตาม domain feature ไม่ใช่ตาม type)

```
backend/src/
  config/           -> env config, database connection
  shared/           -> error handling, logger, middleware ที่ใช้ร่วมกันทุก module
  modules/
    numbering/      -> auto-numbering logic (จุดสำคัญที่สุด, ดู 03-numbering-concurrency.md)
    documents/       -> DocumentRegister + DocumentSubmission CRUD
    master-data/     -> Project/Discipline/Group/Type/Originator/Status master ทั้งหมด
    auth/            -> login, JWT issue/verify
  app.ts             -> ประกอบ Fastify instance + register plugin/route ทั้งหมด
  server.ts          -> entry point, เรียก app.listen()
```

แต่ละ module ควรมีโครงสร้างภายในเหมือนกัน:
```
modules/documents/
  documents.route.ts     -> HTTP route definition
  documents.service.ts   -> business logic
  documents.schema.ts    -> Zod schema สำหรับ request/response
  documents.test.ts      -> unit/integration test
```

## Frontend Stack (Phase ถัดไป — ยังไม่ scaffold ในรอบนี้)

React + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Table (grid) + TanStack Query
(data fetching) + React Hook Form + Zod (form validation) — จะ scaffold ในขั้นถัดไปเมื่อ backend
พร้อมให้เรียก API ได้จริง

## Local Development

`docker-compose.yml` ที่ root ของ backend รัน PostgreSQL container เดียว
(frontend/backend รันแยกด้วย `npm run dev` ของแต่ละโปรเจกต์เอง ไม่ผูกกับ Docker ตอน dev
เพื่อให้ hot-reload เร็ว — ค่อยทำ Dockerfile production build ตอนใกล้ deploy จริง)
