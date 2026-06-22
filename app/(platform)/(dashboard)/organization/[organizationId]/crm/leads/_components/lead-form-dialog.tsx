"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Lead, PipelineStage } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { Label } from "@/components/ui/label";
import { CustomFieldsFields } from "@/components/crm/custom-fields-fields";
import { useAction } from "@/hooks/use-action";
import { createLead } from "@/actions/create-lead";
import { updateLead } from "@/actions/update-lead";
import { extractCustomFieldsFromFormData } from "@/lib/custom-fields-form";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type LeadFormDialogProps = {
  trigger: React.ReactNode;
  stages: PipelineStage[];
  defaultStageId?: string;
  definitions: CustomFieldDefinitionDTO[];
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
  products?: { id: string; name: string; unitPrice: unknown; unit: string }[];
  lead?: Lead & { products?: { product: { id: string; name: string } }[] };
};

export const LeadFormDialog = ({
  trigger,
  stages,
  defaultStageId,
  definitions,
  companies,
  contacts,
  products = [],
  lead,
}: LeadFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!lead;

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    lead?.products?.map((lp) => lp.product.id) ?? []
  );

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

  };

  const saveProductLinks = async (leadId: string) => {
    if (products.length === 0) return;
    await fetch("/api/actions/update-lead-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, productIds: selectedProductIds }),
    });
  };

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createLead, {
    onSuccess: async (data) => {
      await saveProductLinks(data.id);
      toast.success("Lead created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateLead, {
    onSuccess: async (data) => {
      await saveProductLinks(data.id);
      toast.success("Lead updated.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const fieldErrors = isEdit ? updateErrors : createErrors;

  const onSubmit = (formData: FormData) => {
    const valueRaw = formData.get("value") as string;
    const companyId = (formData.get("companyId") as string) || undefined;
    const contactId = (formData.get("contactId") as string) || undefined;

    const fields = {
      title: formData.get("title") as string,
      value: valueRaw ? Number(valueRaw) : undefined,
      stageId: formData.get("stageId") as string,
      companyId,
      contactId,
      customFields: extractCustomFieldsFromFormData(formData, definitions),
    };

    if (isEdit) {
      executeUpdate({ id: lead!.id, ...fields });
    } else {
      executeCreate(fields);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "New lead"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <FormInput
            id="title"
            label="Title"
            required
            defaultValue={lead?.title}
            errors={fieldErrors}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="value"
              label="Value"
              type="number"
              defaultValue={lead?.value ? String(lead.value) : ""}
              errors={fieldErrors}
            />

            <div className="space-y-1">
              <Label htmlFor="stageId" className="text-xs font-semibold text-[#e5e5e5]">
                Stage
              </Label>
              <select
                id="stageId"
                name="stageId"
                required
                defaultValue={lead?.stageId ?? defaultStageId ?? stages[0]?.id}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-background"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="companyId" className="text-xs font-semibold text-[#e5e5e5]">
                Company
              </Label>
              <select
                id="companyId"
                name="companyId"
                defaultValue={lead?.companyId ?? ""}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-background"
              >
                <option value="">No company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactId" className="text-xs font-semibold text-[#e5e5e5]">
                Contact
              </Label>
              <select
                id="contactId"
                name="contactId"
                defaultValue={lead?.contactId ?? ""}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-background"
              >
                <option value="">No contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName ?? ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CustomFieldsFields
            definitions={definitions}
            defaultValues={(lead?.customFields as Record<string, unknown>) ?? {}}
            errors={fieldErrors}
          />

          {products.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#e5e5e5]">Products / Services</Label>
              <div className="flex flex-wrap gap-2">
                {products.map((product) => {
                  const selected = selectedProductIds.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        selected
                          ? "bg-violet-600/20 border-violet-600/60 text-violet-400"
                          : "bg-[#2a2a2a] border-[#333] text-muted-foreground hover:border-violet-600/40"
                      }`}
                    >
                      {product.name}
                      {selected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create lead"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
