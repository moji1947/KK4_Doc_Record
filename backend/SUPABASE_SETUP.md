# Supabase Setup — KK4 Doc Record

Project ref: `fknljpbychwmhgdufbvb`
URL: `https://fknljpbychwmhgdufbvb.supabase.co`

## What was done

1. `backend/.env` created from `.env.example` with Supabase placeholders
2. `frontend/.env.local` created with `NEXT_PUBLIC_SUPABASE_*` / `VITE_*`
3. `backend/supabase_migration.sql` generated via `prisma migrate diff --from-empty` — contains full schema (14 tables + Role enum + FKs + indexes) from `prisma/schema.prisma:1`

## You gave only publishable key — Prisma needs DATABASE_URL (postgres password)

Supabase `publishable` key (`sb_publishable_...`) is for client-side REST, **not** for Prisma. Prisma needs the postgres connection string.

Get it: Supabase Dashboard → Project Settings → Database → Connection string

Two forms:
- **Pooled (for app runtime, pgbouncer):**
  `postgresql://postgres.fknljpbychwmhgdufbvb:[YOUR_DB_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct (for migrations/seed):**
  `postgresql://postgres:[YOUR_DB_PASSWORD]@db.fknljpbychwmhgdufbvb.supabase.co:5432/postgres`

Paste your password into `backend/.env` → replace `[YOUR_DB_PASSWORD]` (URL-encode if it contains `@` `#` `?` etc).

## Option A — No password needed locally (RECOMMENDED, works now)

1. Open Supabase Dashboard → SQL Editor → New query
2. Copy-paste entire `backend/supabase_migration.sql` and Run
3. Verify: Table Editor should show `project_master`, `discipline_master`, `document_register`, etc. (14 tables)
4. To seed master data: temporarily set `DATABASE_URL` with direct connection and run:
   ```powershell
   cd backend
   npx prisma db seed
   ```
   Or paste seed manually — `prisma/seed.ts` inserts project CM24045, 8 disciplines, 25 groups, 25 types, etc.

## Option B — From local machine (requires DATABASE_URL)

```powershell
cd backend
# 1. edit .env and set DATABASE_URL with real password
# 2. push schema
npx prisma db push
# or
npx prisma migrate deploy

# 3. seed
npx prisma db seed
# 4. verify
npx prisma studio
```

## Verification

```powershell
npx prisma validate   # should say "valid"
npx prisma generate   # regenerate client after .env change
npm run build         # tsc + prisma
```

## Frontend

`frontend/.env.local` already contains:
```
VITE_SUPABASE_URL=https://fknljpbychwmhgdufbvb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Y8v-7RTSuCR2y0vIlO4hjA_eGdPI8iM
```
If you install `@supabase/supabase-js`, use these via `import.meta.env.VITE_SUPABASE_URL`.

## Note on typo

You wrote `EXT_PUBLIC_SUPABASE_URL` — corrected to `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL` (Vite uses `VITE_` prefix). Both are set now.
