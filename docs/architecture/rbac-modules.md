# Access control: modules + RBAC

Two layers, checked in order: **module access** (is this whole feature area turned on for this org?) then **role permissions** (can this specific user do this specific thing?).

## Module registry — `lib/modules.ts`

```ts
export const MODULE_REGISTRY = {
  TASKS:          { label: "Taskify",       defaultAccess: "open" },
  CRM:            { label: "CRM",           defaultAccess: "closed" },
  KNOWLEDGE_BASE: { label: "Knowledge Base", defaultAccess: "closed" },
  DASHBOARD:      { label: "Dashboard",     defaultAccess: "closed" },
} as const;
```

This is the single source of truth — nav visibility, the settings access-management UI, and `canAccessModule` all read from it. **Adding a new "big module" only requires a new entry here.**

## Role permissions — `lib/rbac.ts`

Free-form action strings (e.g. `"crm:lead:delete"`) stored on `Role.actions`, assigned to users via `UserRoleAssignment`.

- `getUserRoles(orgId, userId)` / `getUserPermissions(orgId, userId)` — cached per-request via React `cache`.
- `hasPermission(orgId, userId, action)` — role-grant-only check, does **not** bypass for org admins. Use when you need to know if a permission came from an explicit role (e.g. to render a UI badge).
- `canPerform(orgId, userId, action)` — **the call-site helper**: admin bypass OR explicit role grant. Use this at enforcement points.
- Role management: `listOrgRoles`, `findRoleByNameCI`, `getRoleMemberIds`.

## Prisma model groups

`prisma/schema.prisma`, grouped by the domain they belong to (useful for finding the right model fast without grepping the whole schema):

| Domain | Models |
|---|---|
| Kanban/Boards | `Board`, `BoardTelegramConfig`, `BoardAiConfig`, `ReviewSkill`, `ReviewPartner`, `BoardMember`, `List`, `ListTransitionRule`, `Card`, `Label`, `CardLabel`, `Checklist`, `ChecklistItem`, `Comment`, `Attachment`, `CardMember`, `CardWatcher`, `CardTemplate` |
| Auditing/Notifications | `AuditLog`, `Notification` |
| Access control | `ModuleAccess`, `Role`, `UserRoleAssignment`, `ApiKey`, `CustomFieldDefinition` |
| CRM | `Company`, `Contact`, `PipelineStage`, `Lead`, `Product`, `ProductCategory`, `ProductBundle`, `ProductBundleItem`, `CompanyBundle`, `LeadProduct` |
| Knowledge Base | `KbIndustry`, `KbFolder`, `KbDocument` |
| Org/People | `Department`, `UserTelegramAccount`, `UserDisplayName`, `OrgTelegramConfig` |
| OKR/KPI/Dashboard | `Objective`, `KeyResult`, `OkrCheckIn`, `Kpi`, `KpiEntry`, `DailyReport` |

## Route structure

```
app/(platform)/
  (clerk)/
    sign-in/[[...sign-in]]
    sign-up/[[...sign-up]]
    select-org/[[...select-org]]
  (dashboard)/
    board/[boardId]                                   Kanban board (Tasks module)
    organization/[organizationId]/
      tasks                                            "My Tasks" cross-board view
      activity                                         Org-wide activity feed
      crm/{leads,contacts,companies,products}           CRM module
      dashboard/{okrs,daily-report}                     Dashboard module
      knowledge-base/[industryId]                       Knowledge Base module
      settings/app/{modules,roles,members,api-keys,api-docs,custom-fields,ai-settings}
```
