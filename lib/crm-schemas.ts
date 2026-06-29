import { z } from "zod";

// Shared base field shapes for CRM entities, reused across create/update
// action schemas. `customFields` is validated separately against the org's
// CustomFieldDefinitions (see lib/custom-fields.ts).
export const customFieldsSchema = z.record(z.string(), z.unknown()).optional();

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d\s\-()]*$/, "Phone must contain only digits, spaces, and + - ( )")
  .optional()
  .nullable();

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

const websiteSchema = z
  .string()
  .trim()
  .url("Must be a valid URL (e.g. https://example.com)")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

export const companyBaseFields = {
  name: z.string().min(1, "Name is required.").max(200, "Name is too long."),
  domain: z.string().trim().max(200, "Domain is too long.").optional().nullable(),
  industry: z.string().trim().max(100, "Industry is too long.").optional().nullable(),
  phone: phoneSchema,
  website: websiteSchema,
  address: z.string().trim().max(500, "Address is too long.").optional().nullable(),
  description: z.string().trim().max(2000, "Description is too long.").optional().nullable(),
  customFields: customFieldsSchema,
};

export const contactBaseFields = {
  firstName: z.string().min(1, "First name is required.").max(100, "First name is too long."),
  lastName: z.string().trim().max(100, "Last name is too long.").optional().nullable(),
  email: emailSchema,
  phone: phoneSchema,
  title: z.string().trim().max(100, "Job title is too long.").optional().nullable(),
  companyId: z.string().optional().nullable(),
  customFields: customFieldsSchema,
};

export const pipelineStageBaseFields = {
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
};

export const leadBaseFields = {
  title: z.string().min(1, "Title is required.").max(200, "Title is too long."),
  value: z.number().min(0, "Value must be 0 or more.").optional().nullable(),
  ownerId: z.string().optional().nullable(),
  stageId: z.string(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  productIds: z.array(z.string()).optional(),
  customFields: customFieldsSchema,
};

export const productBaseFields = {
  name: z.string().min(1, "Name is required.").max(200, "Name is too long."),
  description: z.string().trim().max(2000, "Description is too long.").optional().nullable(),
  category: z.string().trim().max(100, "Category is too long.").optional().nullable(),
  categories: z.array(z.string()).optional().default([]),
  unitPrice: z.number().min(0, "Price must be 0 or more."),
  unit: z.string().default("item"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  customFields: customFieldsSchema,
};

export const bundleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").default(1),
  unitPrice: z.number().min(0, "Price must be 0 or more."),
});

export const bundleBaseFields = {
  name: z.string().min(1, "Name is required.").max(200, "Name is too long."),
  description: z.string().trim().max(2000, "Description is too long.").optional().nullable(),
  pricingMode: z.enum(["SUM", "DISCOUNT_PERCENT", "DISCOUNT_FLAT", "FIXED"]).default("SUM"),
  discount: z.number().min(0, "Discount must be 0 or more.").optional().nullable(),
  finalPrice: z.number().min(0, "Price must be 0 or more.").optional().nullable(),
  items: z.array(bundleItemSchema).min(1, "Add at least one product."),
};
