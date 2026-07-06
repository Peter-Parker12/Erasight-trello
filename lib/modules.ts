// Central registry of "big modules" (Taskify, CRM, ...). Adding a new module
// only requires a new entry here — nav, settings access-management UI, and
// `canAccessModule` all read from this registry.

export const MODULE_REGISTRY = {
  TASKS: {
    label: "Taskify",
    description: "Boards, lists and cards for day-to-day task management.",
    defaultAccess: "open",
  },
  CRM: {
    label: "CRM",
    description: "Companies, contacts and the sales lead pipeline.",
    defaultAccess: "closed",
  },
  KNOWLEDGE_BASE: {
    label: "Knowledge Base",
    description: "Centralized document library organized by industry and folder.",
    defaultAccess: "closed",
  },
  DASHBOARD: {
    label: "Dashboard",
    description: "Team oversight: due/overdue tasks, daily reports, OKRs & KPIs.",
    defaultAccess: "closed",
  },
} as const satisfies Record<
  string,
  { label: string; description: string; defaultAccess: "open" | "closed" }
>;

export type ModuleKey = keyof typeof MODULE_REGISTRY;

export const MODULE_KEYS = Object.keys(MODULE_REGISTRY) as ModuleKey[];

export const isModuleKey = (value: string): value is ModuleKey =>
  (MODULE_KEYS as string[]).includes(value);
