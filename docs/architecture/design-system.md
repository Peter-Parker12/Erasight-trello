# Design system

## Token source of truth

`app/globals.css` — Tailwind v4 CSS-first config (there is no `tailwind.config.*` file; `components.json`'s reference to one is stale and harmless). All theme tokens are declared in an `@theme` block wrapping raw HSL custom properties:

| Tailwind class | CSS variable | Value | Approx hex |
|---|---|---|---|
| `bg-background` | `--background` | `0 0% 9%` | `#171717` |
| `bg-foreground` / `text-foreground` | `--foreground` | `0 0% 90%` | `#e5e5e5` |
| `bg-card` / `text-card-foreground` | `--card` / `--card-foreground` | `0 0% 12%` | `#1f1f1f` |
| `bg-popover` / `text-popover-foreground` | `--popover` / `--popover-foreground` | `0 0% 12%` | `#1f1f1f` |
| `bg-primary` / `text-primary-foreground` | `--primary` / `--primary-foreground` | `262 83% 58%` | `#7c3aed` |
| `bg-secondary` / `bg-muted` / `bg-input` | `--secondary` / `--muted` / `--input` | `0 0% 16%` | `#2a2a2a` |
| `text-muted-foreground` | `--muted-foreground` | `0 0% 53%` | `#888888` |
| `bg-destructive` / `text-destructive-foreground` | `--destructive` / `--destructive-foreground` | `0 84% 60%` | `#ef4444` |
| `border-border` | `--border` | `0 0% 20%` | `#333333` |
| `ring-ring` | `--ring` | `262 83% 58%` (= primary) | `#7c3aed` |
| radius | `--radius` (`--radius-lg`=base, `--radius-md`=`-2px`, `--radius-sm`=`-4px`) | `0.375rem` | — |

The app is **dark-only** — `:root` and `.dark` hold identical values. There is no functional light theme; don't build one unless asked.

**If you add or rename a token in `globals.css`, update this table too** — it's the reference other docs (and `lib/clerk-appearance.ts`) point back to.

## The rule: tokens for neutrals, palette for accents

- Surfaces, text, borders → always the tokens above. Never `bg-[#2a2a2a]`, `text-neutral-500`, `border-gray-200`, etc.
- **Semantic/accent colors are the deliberate exception** — priority levels, KPI trend up/down, status pills, per-item rotating identity colors (e.g. a hash-based list color), label swatches bound to a user-chosen hex. These stay as plain Tailwind palette classes (`bg-red-500/20`, `text-blue-400`) rather than being forced onto the neutral scale.
- Priority specifically is centralized in `lib/priority.ts` — `PRIORITY_ORDER`, `PRIORITY_LABELS`, `PRIORITY_BADGE_CLASS`, `PRIORITY_DOT_CLASS`, `PRIORITY_TEXT_CLASS`. Import from there; three separate call sites used to redeclare this with color drift before it was centralized — don't reintroduce that.
- One documented exception exists in `app/(platform)/(dashboard)/organization/[organizationId]/settings/app/api-docs/_components/api-docs-client.tsx`: `text-[#a9b1d6]` for monospace API-path text, a syntax-highlight-style accent that doesn't map to any neutral token. Left as-is deliberately — don't "fix" it.

## Hex → token mapping (for any future stray hardcoded color)

| Hex | Maps to |
|---|---|
| `#171717` | `bg-background` |
| `#1f1f1f` | `bg-card`, `bg-popover` |
| `#2a2a2a` | `bg-secondary`, `bg-muted`, `bg-input` (pick by context: form input → `input`, hover/muted surface → `muted`/`secondary`) |
| `#333` | `border-border` (as border), `bg-muted` (as hover/bg) |
| `#e5e5e5` | `text-foreground` (or `text-card-foreground`/`text-popover-foreground` inside those components) |
| `#888` | `text-muted-foreground` |
| `#7c3aed` / any `violet-*` | `bg-primary` / `text-primary` / `border-primary` / `ring-primary` |
| Other near-black grays not in this table | nearest of `background`/`card`/`secondary` **by visual role**, not string similarity |

## `components/ui/` primitive inventory

Reach for these before hand-rolling a new pattern:

`accordion` · `alert-dialog` · `avatar` · `badge` · `button` (variants: `default` `destructive` `outline` `secondary` `ghost` `link` `transparent`; sizes: `default` `sm` `lg` `icon` `inline`) · `card` (`Card`/`CardHeader`/`CardTitle`/`CardContent`) · `checkbox` · `dialog` · `dropdown-menu` · `input` · `label` · `popover` · `select` · `separator` · `sheet` · `skeleton` · `table` · `tabs` · `textarea` · `tooltip`

All of the above are token-correct as of the last design-system cleanup. If you scaffold a new one via `npx shadcn@latest add <name>`, **audit the generated file before use** — shadcn's default generator sometimes emits light-mode-only classes (`neutral-100`, etc.) that need the same token substitution as everything else here. Note: this repo has both `bun.lock` and `package-lock.json`; the shadcn CLI auto-detects `bun` from the lockfile and fails if `bun` isn't actually installed — temporarily `mv bun.lock bun.lock.bak` before running `shadcn add`, then restore it.

## Clerk theming

`lib/clerk-appearance.ts` is the single source of truth for Clerk's UI (`SignIn`, `SignUp`, `UserButton`, `OrganizationSwitcher`, `OrganizationProfile`, etc.). It builds a theme via `@clerk/themes`' `experimental_createTheme`, pointing Clerk's `variables` at this app's own `--color-*` CSS custom properties (the `@theme`-block names, which are pre-wrapped in `hsl(...)` and so resolve as valid CSS colors — the bare `--card`/`--primary` names are not, since they hold raw HSL triples).

Applied once, on the root `ClerkProvider` in `app/layout.tsx`; it cascades to every mounted Clerk component automatically. Don't add per-component `appearance` color/variable overrides — only small `elements`-level tweaks that are genuinely local (e.g. compact sizing in the navbar, hiding a specific action for non-admins) belong at the call site, merged on top of the cascade.
