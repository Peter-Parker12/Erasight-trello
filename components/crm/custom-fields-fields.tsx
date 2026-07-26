"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormErrors } from "@/components/form/form-errors";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type CustomFieldsFieldsProps = {
  definitions: CustomFieldDefinitionDTO[];
  defaultValues?: Record<string, unknown>;
  errors?: Record<string, string[] | undefined>;
};

// Renders one input per CustomFieldDefinition, named `cf_<key>`. Pairs with
// lib/custom-fields-form.ts#extractCustomFieldsFromFormData on submit.
export const CustomFieldsFields = ({
  definitions,
  defaultValues = {},
  errors,
}: CustomFieldsFieldsProps) => {
  if (definitions.length === 0) return null;

  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-xs font-semibold text-muted-foreground">Custom fields</p>

      {definitions.map((def) => {
        const name = `cf_${def.key}`;
        const value = defaultValues[def.key];

        return (
          <div key={def.key} className="space-y-1">
            <Label htmlFor={name} className="text-xs font-semibold text-foreground">
              {def.label}
              {def.required && <span className="text-destructive"> *</span>}
            </Label>

            {def.type === "BOOLEAN" ? (
              <input
                type="checkbox"
                id={name}
                name={name}
                defaultChecked={Boolean(value)}
                className="h-4 w-4"
              />
            ) : def.type === "SELECT" ? (
              <select
                id={name}
                name={name}
                defaultValue={typeof value === "string" ? value : ""}
                required={def.required}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-background"
              >
                <option value="" disabled>
                  Select...
                </option>
                {(def.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : def.type === "MULTI_SELECT" ? (
              <select
                id={name}
                name={name}
                multiple
                defaultValue={Array.isArray(value) ? (value as string[]) : []}
                className="w-full text-sm px-2 py-1 border rounded-md bg-background"
              >
                {(def.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={name}
                name={name}
                required={def.required}
                type={
                  def.type === "NUMBER" || def.type === "CURRENCY"
                    ? "number"
                    : def.type === "DATE"
                      ? "date"
                      : def.type === "EMAIL"
                        ? "email"
                        : def.type === "URL"
                          ? "url"
                          : "text"
                }
                step={def.type === "CURRENCY" ? "0.01" : undefined}
                defaultValue={
                  typeof value === "string" || typeof value === "number" ? value : ""
                }
                className="text-sm px-2 py-1 h-8"
              />
            )}

            <FormErrors id={name} errors={errors} />
          </div>
        );
      })}
    </div>
  );
};
