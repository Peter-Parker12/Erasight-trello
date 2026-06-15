import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

// Companion to components/crm/custom-fields-fields.tsx — reads the
// `cf_<key>` form fields back into a customFields object to send to the
// create/update server actions.
export const extractCustomFieldsFromFormData = (
  formData: FormData,
  definitions: CustomFieldDefinitionDTO[]
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const def of definitions) {
    const name = `cf_${def.key}`;

    switch (def.type) {
      case "BOOLEAN":
        result[def.key] = formData.get(name) === "on";
        break;
      case "NUMBER":
      case "CURRENCY": {
        const raw = formData.get(name) as string | null;
        result[def.key] = raw ? Number(raw) : undefined;
        break;
      }
      case "MULTI_SELECT":
        result[def.key] = formData.getAll(name).map(String);
        break;
      default: {
        const raw = formData.get(name) as string | null;
        result[def.key] = raw || undefined;
      }
    }
  }

  return result;
};
