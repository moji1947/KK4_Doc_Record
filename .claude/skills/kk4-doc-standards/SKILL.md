---
name: kk4-doc-standards
description: Mandatory architecture, data-model, auto-numbering/concurrency, and coding-standard rules for the KK4_Doc_Record project (SCG Cement KK4 Document Register & Document Control Platform). Use this before writing, editing, reviewing, or planning ANY backend (Fastify/Prisma/PostgreSQL) or frontend (React) code in this repository - creating or changing database tables/migrations, API endpoints, document-numbering logic, master-data seeding, or grid/form UI - even if the request doesn't mention these standards by name, e.g. "add an endpoint for X", "create a migration", "fix the document numbering", "build the New Document form", "seed the master data". The numbering/concurrency rule is the single most important constraint in this codebase and is easy to violate by accident (e.g. via MAX()+1) - always check this skill first for anything touching DocumentRegister, DocumentSubmission, or DocumentNumberSequence.
---

# KK4 Doc Record — Project Standards

This project replaces a manual Excel-based document register for an SCG Cement EPC
project. It has a full set of standards docs at `docs/skills/00-05*.md` written for a
different AI agent (Antigravity) — those files are the source of truth. This skill exists
so Claude Code applies the same rules. Read the relevant doc below before making non-trivial
changes; this file is only a map plus the handful of rules that must never be violated.

| File | Read before... |
|---|---|
| `docs/skills/00-project-context.md` | Touching business logic, master data meanings, or anything where "why" matters |
| `docs/skills/01-architecture.md` | Adding a module, choosing where code lives, touching backend/frontend boundary |
| `docs/skills/02-data-model.md` | Changing Prisma schema, adding a table/column, writing a query |
| `docs/skills/03-numbering-concurrency.md` | Touching `DocumentRegister`, `DocumentSubmission`, `DocumentNumberSequence`, or anything that issues a document number |
| `docs/skills/04-coding-standards.md` | Writing any backend/frontend code, before committing |
| `docs/skills/05-ux-principles.md` | Building any frontend grid, form, or dropdown |

## Non-negotiable rules (violating these defeats the purpose of the project)

1. **Document numbering must go through a PostgreSQL row lock inside a Prisma
   transaction** (`SELECT ... FOR UPDATE` on `DocumentNumberSequence`, keyed by
   `ProjectCode+OriginatorCode+GroupCode+TypeCode`). Never derive the next number with
   `MAX(SequenceNo)+1` outside a transaction, and never generate the number on the
   frontend. This exact race condition is the reason the Excel-based system is being
   replaced — see `docs/skills/03-numbering-concurrency.md` for the required
   implementation and the mandatory 20-50-parallel-request concurrency test.
2. **Backend and frontend are separate services that only talk over REST.** Don't reach
   for a full-stack framework that merges UI and API routes.
3. **Backend module structure is per domain feature** (`modules/documents/`,
   `modules/numbering/`, `modules/master-data/`, `modules/auth/`), each with
   `*.route.ts` / `*.service.ts` / `*.schema.ts` / `*.test.ts` — not per technical layer.
4. **`DocumentRegister` is a header-only table (one row per document); revisions live in
   `DocumentSubmission`.** Never add revision-history columns back onto the header table
   — that's the 132-column-Excel problem this system exists to fix.
5. **Every Master Data field is a real foreign key**, never free text. When seeding or
   interpreting document types, `RFI` = Request For Inspection and `RIN` = Request For
   Information — the source Excel files conflict on this, but the codebase standardizes
   on this mapping.
6. **TypeScript strict mode, no bare `any`, Zod schemas are the source of truth for
   types** (`z.infer<typeof schema>` instead of hand-written interfaces duplicating a
   schema).
7. **No `console.log` in backend code** — use the pino logger that ships with Fastify.
8. **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).

When a task touches any of the above, open the linked doc rather than relying on this
summary — it has the exact code pattern (numbering), full table list (data model), and
edge cases (cancelled documents, migration gaps) that matter for correctness.
