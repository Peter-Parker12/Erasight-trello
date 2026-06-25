// Static descriptions of the "standard" (non-custom) fields for each CRM
// entity, returned alongside org-specific custom field definitions by the
// /api/v1/schema/* endpoints.
export type StandardFieldDTO = {
  key: string;
  label: string;
  type: string;
  required: boolean;
};

export const COMPANY_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "name", label: "Name", type: "TEXT", required: true },
  { key: "domain", label: "Domain", type: "TEXT", required: false },
  { key: "industry", label: "Industry", type: "TEXT", required: false },
  { key: "phone", label: "Phone", type: "PHONE", required: false },
  { key: "website", label: "Website", type: "URL", required: false },
  { key: "address", label: "Address", type: "TEXT", required: false },
  { key: "description", label: "Description", type: "TEXT", required: false },
];

export const CONTACT_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "firstName", label: "First name", type: "TEXT", required: true },
  { key: "lastName", label: "Last name", type: "TEXT", required: false },
  { key: "email", label: "Email", type: "EMAIL", required: false },
  { key: "phone", label: "Phone", type: "PHONE", required: false },
  { key: "title", label: "Title", type: "TEXT", required: false },
  { key: "companyId", label: "Company ID", type: "TEXT", required: false },
];

export const LEAD_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "title", label: "Title", type: "TEXT", required: true },
  { key: "value", label: "Value", type: "CURRENCY", required: false },
  { key: "ownerId", label: "Owner ID", type: "TEXT", required: false },
  { key: "stageId", label: "Pipeline stage ID", type: "TEXT", required: false },
  { key: "companyId", label: "Company ID", type: "TEXT", required: false },
  { key: "contactId", label: "Contact ID", type: "TEXT", required: false },
];

export const PRODUCT_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "name", label: "Name", type: "TEXT", required: true },
  { key: "description", label: "Description", type: "TEXT", required: false },
  { key: "category", label: "Category", type: "TEXT", required: false },
  { key: "unitPrice", label: "Unit price", type: "CURRENCY", required: true },
  { key: "unit", label: "Unit", type: "TEXT", required: false },
  { key: "status", label: "Status (ACTIVE / INACTIVE)", type: "SELECT", required: false },
];

export const BUNDLE_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "name", label: "Name", type: "TEXT", required: true },
  { key: "description", label: "Description", type: "TEXT", required: false },
  {
    key: "pricingMode",
    label: "Pricing mode (SUM / DISCOUNT_PERCENT / DISCOUNT_FLAT / FIXED)",
    type: "SELECT",
    required: false,
  },
  { key: "discount", label: "Discount", type: "CURRENCY", required: false },
  { key: "finalPrice", label: "Final price", type: "CURRENCY", required: false },
];

export const PIPELINE_STAGE_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "name", label: "Name", type: "TEXT", required: true },
  { key: "order", label: "Order", type: "NUMBER", required: false },
  { key: "isWon", label: "Marks closed-won stage", type: "BOOLEAN", required: false },
  { key: "isLost", label: "Marks closed-lost stage", type: "BOOLEAN", required: false },
];

export const CUSTOM_FIELD_DEFINITION_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "entityType", label: "Entity type (COMPANY / CONTACT / LEAD / PRODUCT)", type: "SELECT", required: true },
  { key: "key", label: "Field key", type: "TEXT", required: true },
  { key: "label", label: "Display label", type: "TEXT", required: true },
  {
    key: "fieldType",
    label: "Field type (TEXT / NUMBER / BOOLEAN / DATE / SELECT / MULTI_SELECT / CURRENCY / EMAIL / PHONE / URL)",
    type: "SELECT",
    required: true,
  },
  { key: "required", label: "Required", type: "BOOLEAN", required: false },
  { key: "order", label: "Order", type: "NUMBER", required: false },
];

export const BOARD_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "title", label: "Title", type: "TEXT", required: true },
  { key: "backgroundType", label: "Background type (image / color)", type: "SELECT", required: false },
  { key: "backgroundColor", label: "Background color (when type=color)", type: "TEXT", required: false },
];

export const LIST_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "title", label: "Title", type: "TEXT", required: true },
  { key: "order", label: "Order within board", type: "NUMBER", required: false },
  { key: "boardId", label: "Board ID", type: "TEXT", required: true },
  { key: "wipLimit", label: "WIP limit", type: "NUMBER", required: false },
  { key: "type", label: "Type (STANDARD / DONE / FAILED / CANCELLED)", type: "SELECT", required: false },
];

export const CARD_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "title", label: "Title", type: "TEXT", required: true },
  { key: "listId", label: "List ID", type: "TEXT", required: true },
  { key: "order", label: "Order within list", type: "NUMBER", required: false },
  { key: "description", label: "Description", type: "TEXT", required: false },
  { key: "priority", label: "Priority (NONE / LOW / MEDIUM / HIGH / URGENT)", type: "SELECT", required: false },
  { key: "dueDate", label: "Due date", type: "DATE", required: false },
  { key: "startDate", label: "Start date", type: "DATE", required: false },
  { key: "completed", label: "Completed", type: "BOOLEAN", required: false },
];

export const COMMENT_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "content", label: "Comment text", type: "TEXT", required: true },
  { key: "cardId", label: "Card ID", type: "TEXT", required: true },
];

export const ATTACHMENT_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "name", label: "Name", type: "TEXT", required: true },
  { key: "url", label: "URL", type: "URL", required: true },
  { key: "cardId", label: "Card ID", type: "TEXT", required: true },
];

export const CHECKLIST_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "title", label: "Title", type: "TEXT", required: true },
  { key: "cardId", label: "Card ID", type: "TEXT", required: true },
  { key: "order", label: "Order", type: "NUMBER", required: false },
];

export const CHECKLIST_ITEM_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "content", label: "Item content", type: "TEXT", required: true },
  { key: "checklistId", label: "Checklist ID", type: "TEXT", required: true },
  { key: "completed", label: "Completed", type: "BOOLEAN", required: false },
  { key: "order", label: "Order", type: "NUMBER", required: false },
];

export const LABEL_STANDARD_FIELDS: StandardFieldDTO[] = [
  { key: "name", label: "Name", type: "TEXT", required: true },
  { key: "color", label: "Color", type: "TEXT", required: true },
  { key: "boardId", label: "Board ID", type: "TEXT", required: true },
];
