# CLAUDE.md

Project memory for Claude Code in this repository.

## What this is

KK4_Doc_Record — Document Register & Document Control Platform for the SCG Cement "KK4
Satellite Burner" EPC project (Conzol code `SKK-IM-CM26002`, internal code `CM24045`). It
replaces a manual Excel + email + ConZol DMS workflow that suffered from clashing
manually-typed document numbers, a register table that grew a new set of columns for
every document revision (up to 132 columns), and master data with conflicting
definitions across sheets.

## Structure

```
backend/    Node.js + TypeScript (strict) + Fastify + Prisma + PostgreSQL — the API, standalone
frontend/   Not yet scaffolded — will be React + Vite + TS + Tailwind + shadcn/ui
docs/skills/  Standards docs (originally written for the Antigravity AI agent) — read before coding
```

Backend and frontend are intentionally separate services communicating only over REST —
not a merged full-stack framework — so either side can be redeployed or replaced
independently.

## Before writing or changing code

Read `docs/skills/00-05*.md` — they are the actual standards for this project (business
context, architecture, data model, the auto-numbering/concurrency rule, coding
standards, UX principles) and take precedence over generic conventions. The Claude Code
skill at `.claude/skills/kk4-doc-standards/SKILL.md` summarizes the non-negotiable rules
and points into the right doc per task; it should trigger automatically for backend or
frontend changes, but re-read it if you're about to touch document numbering, the
Prisma schema, or master data.

The single most important rule: document numbers (`[ProjectCode]-[Originator]-[GroupCode]-[TypeCode]-[SequenceNo]`,
e.g. `CM24045-EPS-ME06-FD-0001`) must be issued inside a Prisma transaction using
`SELECT ... FOR UPDATE` row locking on `DocumentNumberSequence`. Never derive the next
number with `MAX()+1` outside a transaction and never generate it on the frontend — that
race condition is the exact bug this project exists to fix. See
`docs/skills/03-numbering-concurrency.md` for the required pattern and the mandatory
concurrency test (20-50 parallel requests, no duplicates, no gaps).

## Commands (from repo root, npm workspaces)

```bash
npm run dev:backend     # backend/ dev server (http://localhost:4000)
npm run dev:frontend    # frontend/ dev server (once scaffolded)
npm run build           # build both workspaces
npm test                # test both workspaces
npm run db:up           # docker compose up -d postgres
npm run db:migrate      # prisma migrate
npm run db:seed         # prisma db seed
```

Backend first-time setup: `cd backend && cp .env.example .env && docker compose up -d &&
npm install && npx prisma migrate dev && npx prisma db seed && npm run dev`.

## Conventions

- TypeScript strict mode everywhere; no bare `any`; Zod schemas are the source of truth
  for types (`z.infer<typeof schema>`), not hand-duplicated interfaces.
- No `console.log` in backend code — use the pino logger that ships with Fastify.
- Backend modules are organized per domain feature
  (`modules/documents/`, `modules/numbering/`, `modules/master-data/`, `modules/auth/`),
  each with `*.route.ts` / `*.service.ts` / `*.schema.ts` / `*.test.ts`, not per
  technical layer.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`);
  Husky + lint-staged run lint on commit.
- Master data fields are always real foreign keys, never free text. Note: `RFI` =
  Request For Inspection and `RIN` = Request For Information in this codebase — the
  source Excel files disagree with each other on this, but the schema standardizes on
  this mapping (see `docs/skills/00-project-context.md`).
- Master data must be seeded from the real project Excel files once available
  (`backend/prisma/source-data/`) — don't invent placeholder data once real data exists.
