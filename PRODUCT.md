# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are the internal EPC project team on SCG Cement's "KK4 Satellite Burner"
project (Conzol code SKK-IM-CM26002, internal code CM24045):

- **Document Controller** — registers documents, issues document numbers, maintains master data. Heaviest daily user of the register grid.
- **Project Engineer** — reviews/approves documents technically.
- **Discipline Engineer (ME/EE/CE)** — prepares and reviews documents within their discipline.
- **PM / PMD / PED** — views overall progress, approves at a higher level.
- **Vendor/Contractor** — submits documents through a portal (later phase, not current scope).

All current users work at office desktop/laptop workstations; the interface is not required to work on tablet or mobile.

## Product Purpose

Replaces a manual Excel + email + ConZol DMS workflow for EPC document control. It exists to eliminate three concrete failures of the old process: document numbers that collide or skip when multiple people issue numbers in separate Excel files at once, a register table that grows a new block of columns for every revision (up to 132 columns in the real files), and master data whose definitions conflict across source sheets (e.g. "RFI" meaning two different things in the same workbook). Success means document numbering is 100% collision-free under concurrent use, one register row always represents one document (revisions live in a separate table), and every classification field is a real foreign key instead of free text.

## Positioning

Purpose-built relational web app instead of the originally planned SharePoint Lists + Power Apps + Power Automate solution — Power Automate could not guarantee safe concurrent numbering, SharePoint Choice columns only loosely reference master data instead of enforcing relational integrity, and Power Apps could not deliver the Excel-like grid/filter/cascading-dropdown UX the team needs. The differentiating mechanism is a database-transaction-guaranteed numbering sequence combined with an Excel-familiar grid that real users already know how to operate.

## Operating Context

- Document numbers follow the pattern `[ProjectCode]-[Originator]-[GroupCode]-[TypeCode]-[SequenceNo]`, e.g. `CM24045-EPS-ME06-FD-0001`.
- ~60+ users and 170+ document groups; a Role Assignment Matrix determines who must receive/approve which document group (replacing a manual Excel matrix people had to look up by hand).
- Data model splits `DocumentRegister` (one row per document) from `DocumentSubmission` (one row per revision) to end the wide-column-per-revision problem.
- Documents sync to ConZol DMS; the dashboard tracks ERP/ConZol sync status per document.
- New Document entry is a cascading form: Discipline → Group (filtered by Discipline) → TypeCode (filtered by Group), with a live read-only preview of the document number that will be issued, updated as choices change.
- Master data fields (Group, TypeCode, Originator, Status, Project, etc.) are always selected via a code+description combobox — shows "code — description" while choosing, collapses to just the code once selected.
- Register grid needs Excel-style behavior: user-configurable show/hide/reorder/remembered columns, per-column AutoFilter, multi-column sort (shift-click), conditional row formatting (SLA overdue/near-due), and instant quick search.
- Realtime management dashboard (beyond the register grid) is a later roadmap phase, not current MVP scope.

## Capabilities and Constraints

- Frontend: React + Vite + TypeScript, Tailwind, shadcn/ui, TanStack Query — already scaffolded and in active development (grid, detail modal, submit-revision modal, new-document modal already exist).
- Backend: Node.js + TypeScript (strict) + Fastify + Prisma + PostgreSQL, communicating with the frontend only over REST.
- Document numbers must be issued inside a Prisma transaction with `SELECT ... FOR UPDATE` row locking; numbers are never derived client-side or via unguarded `MAX()+1`.
- Master data is not yet seeded from the real project Excel files (source files pending); current seed data is placeholder.
- Terminology: in this codebase, **RFI = Request For Inspection** and **RIN = Request For Information** (the source Excel files disagree with each other; this mapping is the standardized resolution).

## Brand Commitments

None mandated. No binding SCG corporate brand guideline, logo, or palette was specified for this tool's UI — the interface is free to establish its own professional/enterprise-appropriate visual identity.

## Evidence on Hand

- `docs/skills/00-05*.md` — business context, architecture, data model, numbering/concurrency rule, coding standards, and UX principles written for this project. Treat as authoritative product/UX source material.
- No real screenshots, logos, testimonials, or marketing assets on hand; this is an internal operational tool, not a marketed product.

## Product Principles

1. Zero manual numbering — the user never types or invents a document number.
2. Single source of truth — every classification field is a real foreign key/dropdown from the database, never free text.
3. Excel-familiar, not Excel-limited — keep the grid interaction model users already know, but add the data integrity Excel could never enforce.
4. Hide irrelevant choices instead of disabling them, to reduce choice overload in cascading forms.
5. Optimize for the desktop grid-heavy workflow of a document controller/engineer at a workstation, not for mobile.

## Accessibility & Inclusion

No formally mandated standard. Aim for solid contrast, readable text at data-dense grid sizes, and keyboard-friendly forms as general good practice.
