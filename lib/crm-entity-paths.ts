import type { CrmEntityType } from "@prisma/client";

// Maps a CRM entity type to its segment under /crm, used for revalidation
// after custom field definitions change.
export const ENTITY_TYPE_PATHS: Record<CrmEntityType, string> = {
  COMPANY: "companies",
  CONTACT: "contacts",
  LEAD: "leads",
  PRODUCT: "products",
};
