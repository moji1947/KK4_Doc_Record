# KK4 Doc Record — Backend

API server สำหรับ Document Register & Document Control Platform
(SKK-IM-CM26002 / CM24045)

## Prerequisite
- Node.js 20+
- Docker + Docker Compose (สำหรับรัน PostgreSQL local)

## Setup

```bash
cp .env.example .env
docker compose up -d              # รัน PostgreSQL
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                       # http://localhost:4000
```

Swagger API docs: http://localhost:4000/docs

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน server แบบ hot-reload |
| `npm run build` | compile TypeScript -> dist/ |
| `npm test` | รัน test ทั้งหมด (ต้องมี Postgres รันอยู่) |
| `npm run lint` | ตรวจ code style |
| `npx prisma studio` | เปิด GUI ดูข้อมูลใน database |
| `npx prisma migrate dev` | สร้าง migration ใหม่หลังแก้ schema.prisma |

## จุดที่ต้องอ่านก่อนแก้โค้ด

- `../docs/skills/` — มาตรฐานและบริบททั้งหมดของโปรเจกต์
- `src/modules/numbering/` — auto-numbering logic ที่สำคัญที่สุด ห้ามแก้โดยไม่อ่าน
  `docs/skills/03-numbering-concurrency.md` ก่อน
- `tests/numbering.test.ts` — ต้องผ่านเสมอก่อน merge โค้ดที่แตะ numbering module
