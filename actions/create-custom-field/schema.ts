import { z } from "zod";

export const CreateCustomField = z.object({
  entityType: z.enum(["COMPANY", "CONTACT", "LEAD", "PRODUCT"]),
  key: z
    .string()
    .min(1, "Key is required.")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must start with a letter and contain only letters, numbers and underscores."),
  label: z.string().min(1, "Label is required."),
  fieldType: z.enum([
    "TEXT",
    "NUMBER",
    "BOOLEAN",
    "DATE",
    "SELECT",
    "MULTI_SELECT",
    "CURRENCY",
    "EMAIL",
    "PHONE",
    "URL",
  ]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});
