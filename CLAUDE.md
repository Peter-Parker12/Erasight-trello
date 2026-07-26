# CLAUDE.md

This file orients an AI assistant working in this repo. Keep it scannable — deep dives live in `docs/architecture/`.

## What this is

A multi-tenant Next.js app (Clerk organizations = tenants) that started as a Trello clone ("Taskify") and grew into four modules:
- **Tasks** — Kanban boards, lists, cards, checklists, subtasks, comments, attachments (open to all org members by default)
- **CRM** — companies, contacts, a lead pipeline, products/bundles (closed by default, per-module access)
- **Knowledge Base** — a document library organized by industry/folder (closed by default)
- **Dashboard** — OKRs/KPIs, due/overdue tasks, daily reports (closed by default)

Module gating and the four-module list live in `lib/modules.ts` (`MODULE_REGISTRY`), which is the single source of truth — see [docs/architecture/rbac-modules.md](docs/architecture/rbac-modules.md).

`README.md` is a stale, unmodified OSS tutorial template from before this project grew the CRM/OKR/KPI/KB/Telegram/RBAC features — don't treat it as a feature inventory. `docs/user-guide.md` is genuinely current but end-user facing (click-paths, not architecture).

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind v4, CSS-first config (no `tailwind.config.*` file — tokens live in `app/globals.css`). `components.json` still references a `tailwind.config.ts` that doesn't exist; harmless, shadcn's CLI doesn't need it. |
| Components | shadcn/ui, style "default", baseColor "neutral" — primitives in `components/ui/` |
| DB | Prisma + Postgres (`prisma/schema.prisma`) |
| Auth | Clerk v7 (organizations = tenants) |
| State/data | React Query for client caching, Zustand where noted, Zod for input validation |

Commands: `npm run dev`, `npm run build` (runs `prisma generate && next build --webpack`), `npm run lint`. There's no `typecheck` script — use `npx tsc --noEmit`.

## Adding or changing a server action

There are **two coexisting conventions** in `actions/<name>/`. Check the first line of `index.ts` to know which one a given folder uses:

- **Pattern A — "API-route"** (majority; Board/Kanban/CRM domains). `actions/<name>/index.ts` is a thin client wrapper calling `callApiAction("/api/actions/<name>", data)`. The real handler — auth, Prisma, `createSafeAction`, audit log — lives in `app/api/actions/<name>/route.ts`.
- **Pattern B — direct server action** (newer; OKR/KPI/Department/Telegram-config domains). `actions/<name>/index.ts` starts with `"use server"` and calls `createSafeAction` inline — no separate route file.

**Default to Pattern B for new actions** — it's simpler, no split-file indirection — unless you're adding to an existing Pattern-A domain (Board/Kanban/CRM), in which case match the sibling actions already there. Full walkthrough with real examples: [docs/architecture/actions.md](docs/architecture/actions.md).

## Design system — never hardcode colors

All surfaces/text/borders go through the CSS variable tokens in `app/globals.css` (`bg-background`, `bg-card`, `bg-popover`, `bg-secondary`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, etc.) — **never hardcode hex** (`bg-[#2a2a2a]`) or raw Tailwind neutrals (`bg-neutral-100`, `text-gray-500`). This app is dark-only; there is no light theme to worry about, just token discipline.

The one deliberate exception: **semantic/accent colors** — priority levels, KPI trend, status pills, per-item rotating identity colors — stay as plain Tailwind palette classes (`bg-red-500/20`, `text-blue-400`) rather than being forced onto the neutral token scale. Priority specifically is centralized in `lib/priority.ts` (`PRIORITY_LABELS`, `PRIORITY_BADGE_CLASS`, `PRIORITY_DOT_CLASS`) — import from there, don't redeclare a local priority map.

Clerk's UI (`SignIn`, `UserButton`, `OrganizationSwitcher`, etc.) is themed from the same tokens via `lib/clerk-appearance.ts`, applied once on the root `ClerkProvider` in `app/layout.tsx` — don't add new per-component `appearance` overrides beyond small element-level tweaks (sizing, hiding an element).

Full token table, the hex→token mapping used during the last cleanup pass, and the `components/ui/` primitive inventory: [docs/architecture/design-system.md](docs/architecture/design-system.md).

## Access control

`lib/modules.ts` gates whole modules (Tasks/CRM/KB/Dashboard) per org. `lib/rbac.ts` layers fine-grained role permissions on top (`canPerform(orgId, userId, action)` is the call-site helper — admin bypass OR explicit role grant). Details and the Prisma model-to-domain map: [docs/architecture/rbac-modules.md](docs/architecture/rbac-modules.md).

## Comment style

Match the codebase's existing convention: terse, single-line `//` comments only where there's non-obvious business rationale (see `lib/okr-score.ts`, `lib/rbac.ts`, `lib/modules.ts` for the target style). No JSDoc blocks, no comments that restate what the code already says. Most boilerplate files (`lib/create-safe-action.ts`, action `index.ts` files) have zero comments by design — that's expected, not a gap to fill.
