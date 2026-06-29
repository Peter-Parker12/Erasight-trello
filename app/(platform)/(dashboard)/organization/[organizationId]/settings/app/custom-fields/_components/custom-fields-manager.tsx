"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X, Check } from "lucide-react";
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

const PRODUCT_DEFAULT_FIELDS: { label: string; key: string; type: string; note?: string }[] = [
  { label: "Name",        key: "name",        type: "text",         note: "required" },
  { label: "Description", key: "description", type: "text" },
  { label: "Categories",  key: "categories",  type: "multi-select", note: "colored tags" },
  { label: "Unit Price",  key: "unitPrice",   type: "currency",     note: "required" },
  { label: "Unit",        key: "unit",        type: "select" },
  { label: "Status",      key: "status",      type: "select" },
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
          <p className="text-xs text-muted-foreground">
            {fields.length} custom field{fields.length === 1 ? "" : "s"}
          </p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-3">
          {/* Default / built-in fields for PRODUCT entity */}
          {entityType === "PRODUCT" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Default fields
              </p>
              {PRODUCT_DEFAULT_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2 border border-[#2e2e2e] rounded-md px-3 py-2 bg-[#1a1a1a]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e5e5e5] truncate">{f.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.key} · {f.type}
                      {f.note ? <span className="ml-1 text-violet-400/80">· {f.note}</span> : null}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/50 italic shrink-0">built-in</span>
                </div>
              ))}
              {fields.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
                  Custom fields
                </p>
              )}
            </div>
          )}

          {fields.length === 0 && entityType !== "PRODUCT" && (
            <p className="text-sm text-muted-foreground">No custom fields defined yet.</p>
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
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(field.label);
  const [optionsValue, setOptionsValue] = useState(field.options?.join(", ") ?? "");
  const [requiredValue, setRequiredValue] = useState(field.required);

  const { execute: executeUpdate, isLoading: isSaving } = useAction(updateCustomField, {
    onSuccess: () => { toast.success("Custom field updated."); setEditing(false); },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteCustomField, {
    onSuccess: () => toast.success("Custom field deleted."),
    onError: (error) => toast.error(error),
  });

  const needsOptions = field.type === "SELECT" || field.type === "MULTI_SELECT";
  const { id } = field;

  const onSave = () => {
    if (!labelValue.trim()) return;
    executeUpdate({
      id,
      label: labelValue.trim(),
      required: requiredValue,
      ...(needsOptions
        ? { options: optionsValue.split(",").map((o) => o.trim()).filter(Boolean) }
        : {}),
    });
  };

  const onCancel = () => {
    setLabelValue(field.label);
    setOptionsValue(field.options?.join(", ") ?? "");
    setRequiredValue(field.required);
    setEditing(false);
  };

  const onDelete = () => {
    if (!confirm(`Delete the "${field.label}" field? Existing values will remain stored but hidden.`)) return;
    executeDelete({ id });
  };

  if (editing) {
    return (
      <div className="border border-violet-600/40 rounded-md p-3 space-y-2 bg-[#1f1f1f]">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Label</p>
            <Input
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Key (read-only)</p>
            <Input value={field.key} readOnly className="h-8 text-sm font-mono opacity-50 cursor-not-allowed" />
          </div>
        </div>

        {needsOptions && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Options (comma separated)</p>
            <Input
              value={optionsValue}
              onChange={(e) => setOptionsValue(e.target.value)}
              placeholder="Option A, Option B, Option C"
              className="h-8 text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-[#e5e5e5]">
            <input
              type="checkbox"
              checked={requiredValue}
              onChange={(e) => setRequiredValue(e.target.checked)}
            />
            Required
          </label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onCancel}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="h-7 px-2 text-xs" disabled={isSaving || !labelValue.trim()} onClick={onSave}>
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border rounded-md p-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-muted-foreground">
          {field.key} · {field.type}
          {field.options?.length ? ` · ${field.options.join(", ")}` : ""}
        </p>
      </div>
      <label className="flex items-center gap-1 text-xs text-[#e5e5e5] whitespace-nowrap">
        <input
          type="checkbox"
          checked={requiredValue}
          onChange={(e) => {
            setRequiredValue(e.target.checked);
            id && executeUpdate({ id, required: e.target.checked });
          }}
        />
        Required
      </label>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-[#e5e5e5]"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-red-500 hover:text-red-400"
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
          <label className="flex items-center gap-1 text-xs text-[#e5e5e5]">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required
          </label>
        )}
      </div>

      {needsOptions && (
        <label className="flex items-center gap-1 text-xs text-[#e5e5e5]">
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
