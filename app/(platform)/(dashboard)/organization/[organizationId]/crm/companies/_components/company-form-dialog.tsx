"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import type { Company } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { CustomFieldsFields } from "@/components/crm/custom-fields-fields";
import { useAction } from "@/hooks/use-action";
import { createCompany } from "@/actions/create-company";
import { updateCompany } from "@/actions/update-company";
import { extractCustomFieldsFromFormData } from "@/lib/custom-fields-form";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type CompanyFormDialogProps = {
  trigger: React.ReactNode;
  definitions: CustomFieldDefinitionDTO[];
  company?: Company;
};

export const CompanyFormDialog = ({ trigger, definitions, company }: CompanyFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!company;

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createCompany, {
    onSuccess: () => {
      toast.success("Company created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateCompany, {
    onSuccess: () => {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
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
              defaultValue={company?.phone ?? ""}
              errors={fieldErrors}
            />
            <FormInput
              id="website"
              label="Website"
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

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create company"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
