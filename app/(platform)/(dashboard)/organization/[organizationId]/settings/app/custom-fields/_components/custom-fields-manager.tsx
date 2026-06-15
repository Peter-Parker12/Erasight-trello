"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { CrmEntityType, CustomFieldType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createCustomField } from "@/actions/create-custom-field";
import { updateCustomField } from "@/actions/update-custom-field";
import { deleteCustomField } from "@/actions/delete-custom-field";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

const FIELD_TYPES: CustomFieldType[] = [
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
];

type CustomFieldsManagerProps = {
  entityType: CrmEntityType;
  label: string;
  fields: CustomFieldDefinitionDTO[];
};

export const CustomFieldsManager = ({ entityType, label, fields }: CustomFieldsManagerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-neutral-500">
            {fields.length} custom field{fields.length === 1 ? "" : "s"}
          </p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-neutral-500">No custom fields defined yet.</p>
          )}

          {fields.map((field) => (
            <FieldRow key={field.key} field={field} />
          ))}

          <AddFieldRow entityType={entityType} existingKeys={fields.map((f) => f.key)} />
        </div>
      )}
    </div>
  );
};

const FieldRow = ({ field }: { field: CustomFieldDefinitionDTO }) => {
  const { execute: executeUpdate } = useAction(updateCustomField, {
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteCustomField, {
    onSuccess: () => toast.success("Custom field deleted."),
    onError: (error) => toast.error(error),
  });

  const { id } = field;

  const onDelete = () => {
    if (!confirm(`Delete the "${field.label}" field? Existing values will remain stored but hidden.`)) return;
    executeDelete({ id });
  };

  return (
    <div className="flex items-center gap-2 border rounded-md p-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-neutral-500">
          {field.key} · {field.type}
          {field.options?.length ? ` · ${field.options.join(", ")}` : ""}
        </p>
      </div>
      <label className="flex items-center gap-1 text-xs text-neutral-600 whitespace-nowrap">
        <input
          type="checkbox"
          defaultChecked={field.required}
          onChange={(e) => id && executeUpdate({ id, required: e.target.checked })}
        />
        Required
      </label>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
        disabled={isDeleting}
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const AddFieldRow = ({
  entityType,
  existingKeys,
}: {
  entityType: CrmEntityType;
  existingKeys: string[];
}) => {
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [labelValue, setLabelValue] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("TEXT");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);

  const { execute, isLoading } = useAction(createCustomField, {
    onSuccess: () => {
      toast.success("Custom field created.");
      setKey("");
      setKeyTouched(false);
      setLabelValue("");
      setFieldType("TEXT");
      setOptions("");
      setRequired(false);
    },
    onError: (error) => toast.error(error),
  });

  const onLabelChange = (value: string) => {
    setLabelValue(value);
    if (!keyTouched) {
      setKey(value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelValue.trim() || !key.trim()) return;
    if (existingKeys.includes(key.trim())) {
      toast.error("A custom field with this key already exists.");
      return;
    }

    execute({
      entityType,
      key: key.trim(),
      label: labelValue.trim(),
      fieldType,
      required,
      options:
        fieldType === "SELECT" || fieldType === "MULTI_SELECT"
          ? options.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
    });
  };

  const needsOptions = fieldType === "SELECT" || fieldType === "MULTI_SELECT";

  return (
    <form onSubmit={onSubmit} className="space-y-2 pt-2 border-t">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Label (e.g. Lead source)"
          value={labelValue}
          onChange={(e) => onLabelChange(e.target.value)}
          className="h-8 text-sm"
        />
        <Input
          placeholder="key"
          value={key}
          onChange={(e) => {
            setKeyTouched(true);
            setKey(e.target.value);
          }}
          className="h-8 text-sm font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
          className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-background"
        >
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {needsOptions ? (
          <Input
            placeholder="Options, comma separated"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          <label className="flex items-center gap-1 text-xs text-neutral-600">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required
          </label>
        )}
      </div>

      {needsOptions && (
        <label className="flex items-center gap-1 text-xs text-neutral-600">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Required
        </label>
      )}

      <Button type="submit" size="sm" disabled={isLoading || !labelValue.trim() || !key.trim()}>
        <Plus className="h-4 w-4 mr-1" />
        Add field
      </Button>
    </form>
  );
};
