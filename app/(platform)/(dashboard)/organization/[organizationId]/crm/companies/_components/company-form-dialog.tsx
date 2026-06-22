"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Company } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { CustomFieldsFields } from "@/components/crm/custom-fields-fields";
import { useAction } from "@/hooks/use-action";
import { createCompany } from "@/actions/create-company";
import { updateCompany } from "@/actions/update-company";
import { extractCustomFieldsFromFormData } from "@/lib/custom-fields-form";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type BundleOption = { id: string; name: string };

type CompanyFormDialogProps = {
  trigger: React.ReactNode;
  definitions: CustomFieldDefinitionDTO[];
  company?: Company & { bundles?: { bundleId: string }[] };
  allBundles?: BundleOption[];
};

async function syncBundles(companyId: string, selectedIds: string[], previousIds: string[]) {
  const toAdd = selectedIds.filter((id) => !previousIds.includes(id));
  const toRemove = previousIds.filter((id) => !selectedIds.includes(id));

  await Promise.all([
    ...toAdd.map((bundleId) =>
      fetch("/api/actions/assign-company-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, bundleId, assign: true }),
      })
    ),
    ...toRemove.map((bundleId) =>
      fetch("/api/actions/assign-company-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, bundleId, assign: false }),
      })
    ),
  ]);
}

export const CompanyFormDialog = ({ trigger, definitions, company, allBundles = [] }: CompanyFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!company;

  const currentBundleIds = company?.bundles?.map((b) => b.bundleId) ?? [];
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>(currentBundleIds);

  const toggleBundle = (id: string) =>
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setSelectedBundleIds(currentBundleIds);
  };

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createCompany, {
    onSuccess: async (data) => {
      if (selectedBundleIds.length > 0) {
        await syncBundles(data.id, selectedBundleIds, []);
      }
      toast.success("Company created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateCompany, {
    onSuccess: async (data) => {
      await syncBundles(data.id, selectedBundleIds, currentBundleIds);
      toast.success("Company updated.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const fieldErrors = isEdit ? updateErrors : createErrors;

  const onSubmit = (formData: FormData) => {
    const fields = {
      name: formData.get("name") as string,
      domain: (formData.get("domain") as string) || undefined,
      industry: (formData.get("industry") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      customFields: extractCustomFieldsFromFormData(formData, definitions),
    };

    if (isEdit) {
      executeUpdate({ id: company!.id, ...fields });
    } else {
      executeCreate(fields);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit company" : "New company"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <FormInput
            id="name"
            label="Name"
            required
            defaultValue={company?.name}
            errors={fieldErrors}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="domain"
              label="Domain"
              defaultValue={company?.domain ?? ""}
              errors={fieldErrors}
            />
            <FormInput
              id="industry"
              label="Industry"
              defaultValue={company?.industry ?? ""}
              errors={fieldErrors}
            />
            <FormInput
              id="phone"
              label="Phone"
              placeholder="+84 123 456 789"
              defaultValue={company?.phone ?? ""}
              errors={fieldErrors}
            />
            <FormInput
              id="website"
              label="Website"
              placeholder="https://example.com"
              defaultValue={company?.website ?? ""}
              errors={fieldErrors}
            />
          </div>

          <FormInput
            id="address"
            label="Address"
            defaultValue={company?.address ?? ""}
            errors={fieldErrors}
          />

          <FormTextarea
            id="description"
            label="Description"
            defaultValue={company?.description ?? ""}
            errors={fieldErrors}
          />

          <CustomFieldsFields
            definitions={definitions}
            defaultValues={(company?.customFields as Record<string, unknown>) ?? {}}
            errors={fieldErrors}
          />

          {allBundles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#e5e5e5]">
                Bundles
              </Label>
              <div className="flex flex-wrap gap-2">
                {allBundles.map((bundle) => {
                  const selected = selectedBundleIds.includes(bundle.id);
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => toggleBundle(bundle.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        selected
                          ? "bg-violet-600/20 border-violet-600/60 text-violet-400"
                          : "bg-[#2a2a2a] border-[#333] text-muted-foreground hover:border-violet-600/40"
                      }`}
                    >
                      {bundle.name}
                      {selected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create company"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
