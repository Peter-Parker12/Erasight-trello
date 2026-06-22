import { z } from "zod";

// Shared base field shapes for CRM entities, reused across create/update
// action schemas. `customFields` is validated separately against the org's
// CustomFieldDefinitions (see lib/custom-fields.ts).
export const customFieldsSchema = z.record(z.string(), z.unknown()).optional();

export const companyBaseFields = {
  name: z.string().min(1, "Name is required."),
  domain: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  customFields: customFieldsSchema,
};

export const contactBaseFields = {
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  title: z.string().trim().optional().nullable(),
  companyId: z.string().optional().nullable(),
  customFields: customFieldsSchema,
};

export const pipelineStageBaseFields = {
  name: z.string().min(1, "Name is required."),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
};

export const leadBaseFields = {
  title: z.string().min(1, "Title is required."),
  value: z.number().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  stageId: z.string(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  productIds: z.array(z.string()).optional(),
  customFields: customFieldsSchema,
};

export const productBaseFields = {
  name: z.string().min(1, "Name is required."),
  description: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  unitPrice: z.number().min(0, "Price must be 0 or more."),
  unit: z.string().default("item"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  customFields: customFieldsSchema,
};

export const bundleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
});

export const bundleBaseFields = {
  name: z.string().min(1, "Name is required."),
  description: z.string().trim().optional().nullable(),
  pricingMode: z.enum(["SUM", "DISCOUNT_PERCENT", "DISCOUNT_FLAT", "FIXED"]).default("SUM"),
  discount: z.number().optional().nullable(),
  finalPrice: z.number().optional().nullable(),
  items: z.array(bundleItemSchema).min(1, "Add at least one product."),
};
