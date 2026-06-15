import { z } from "zod";
import type { CrmEntityType, CustomFieldDefinition, CustomFieldType } from "@prisma/client";

import { db } from "@/lib/db";

export type CustomFieldOptions = {
  options?: string[];
};

export const getFieldDefinitions = (
  orgId: string,
  entityType: CrmEntityType
): Promise<CustomFieldDefinition[]> =>
  db.customFieldDefinition.findMany({
    where: { orgId, entityType },
    orderBy: { order: "asc" },
  });

const baseSchemaForType = (def: CustomFieldDefinition): z.ZodTypeAny => {
  const options = (def.options as CustomFieldOptions | null)?.options ?? [];

  switch (def.fieldType as CustomFieldType) {
    case "TEXT":
      return z.string();
    case "EMAIL":
      return z.string().email();
    case "URL":
      return z.string().url();
    case "PHONE":
      return z.string();
    case "NUMBER":
    case "CURRENCY":
      return z.number();
    case "BOOLEAN":
      return z.boolean();
    case "DATE":
      return z.string(); // ISO date string
    case "SELECT":
      return options.length > 0 ? z.enum(options as [string, ...string[]]) : z.string();
    case "MULTI_SELECT":
      return options.length > 0
        ? z.array(z.enum(options as [string, ...string[]]))
        : z.array(z.string());
    default:
      return z.unknown();
  }
};

// Builds a Zod object schema for the `customFields` JSON blob of an entity,
// based on its org's CustomFieldDefinitions. Unknown keys are stripped.
export const buildCustomFieldsSchema = (definitions: CustomFieldDefinition[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const def of definitions) {
    let fieldSchema = baseSchemaForType(def);

    if (!def.required) {
      fieldSchema = fieldSchema.nullable().optional();
    }

    shape[def.key] = fieldSchema;
  }

  return z.object(shape).strip();
};

export type CustomFieldsValidationResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: z.ZodError };

export const validateCustomFields = (
  definitions: CustomFieldDefinition[],
  values: Record<string, unknown> | null | undefined
): CustomFieldsValidationResult => {
  const schema = buildCustomFieldsSchema(definitions);
  const result = schema.safeParse(values ?? {});

  if (!result.success) return { success: false, error: result.error };
  return { success: true, data: result.data };
};

// Shape returned by the public schema endpoints (/api/v1/schema/*) and used
// by the dynamic field-rendering UI.
export type CustomFieldDefinitionDTO = {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options: string[] | null;
  order: number;
};

export const toFieldDefinitionDTO = (def: CustomFieldDefinition): CustomFieldDefinitionDTO => ({
  id: def.id,
  key: def.key,
  label: def.label,
  type: def.fieldType,
  required: def.required,
  options: (def.options as CustomFieldOptions | null)?.options ?? null,
  order: def.order,
});
