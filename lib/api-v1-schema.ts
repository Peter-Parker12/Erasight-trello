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
