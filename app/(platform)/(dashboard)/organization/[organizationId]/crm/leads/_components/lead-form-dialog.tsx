"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
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
  lead?: Lead;
};

export const LeadFormDialog = ({
  trigger,
  stages,
  defaultStageId,
  definitions,
  companies,
  contacts,
  lead,
}: LeadFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!lead;

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createLead, {
    onSuccess: () => {
      toast.success("Lead created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateLead, {
    onSuccess: () => {
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
      <DialogContent className="max-w-2xl">
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

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create lead"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
