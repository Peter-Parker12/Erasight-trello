"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import type { Contact } from "@prisma/client";

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
import { createContact } from "@/actions/create-contact";
import { updateContact } from "@/actions/update-contact";
import { extractCustomFieldsFromFormData } from "@/lib/custom-fields-form";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type ContactFormDialogProps = {
  trigger: React.ReactNode;
  definitions: CustomFieldDefinitionDTO[];
  companies: { id: string; name: string }[];
  contact?: Contact;
};

export const ContactFormDialog = ({
  trigger,
  definitions,
  companies,
  contact,
}: ContactFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!contact;

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createContact, {
    onSuccess: () => {
      toast.success("Contact created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateContact, {
    onSuccess: () => {
      toast.success("Contact updated.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const fieldErrors = isEdit ? updateErrors : createErrors;

  const onSubmit = (formData: FormData) => {
    const companyId = (formData.get("companyId") as string) || undefined;

    const fields = {
      firstName: formData.get("firstName") as string,
      lastName: (formData.get("lastName") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      title: (formData.get("title") as string) || undefined,
      companyId,
      customFields: extractCustomFieldsFromFormData(formData, definitions),
    };

    if (isEdit) {
      executeUpdate({ id: contact!.id, ...fields });
    } else {
      executeCreate(fields);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "New contact"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="firstName"
              label="First name"
              required
              defaultValue={contact?.firstName}
              errors={fieldErrors}
            />
            <FormInput
              id="lastName"
              label="Last name"
              defaultValue={contact?.lastName ?? ""}
              errors={fieldErrors}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="email"
              label="Email"
              type="email"
              defaultValue={contact?.email ?? ""}
              errors={fieldErrors}
            />
            <FormInput
              id="phone"
              label="Phone"
              defaultValue={contact?.phone ?? ""}
              errors={fieldErrors}
            />
          </div>
          <FormInput
            id="title"
            label="Job title"
            defaultValue={contact?.title ?? ""}
            errors={fieldErrors}
          />

          <div className="space-y-1">
            <Label htmlFor="companyId" className="text-xs font-semibold text-[#e5e5e5]">
              Company
            </Label>
            <select
              id="companyId"
              name="companyId"
              defaultValue={contact?.companyId ?? ""}
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

          <CustomFieldsFields
            definitions={definitions}
            defaultValues={(contact?.customFields as Record<string, unknown>) ?? {}}
            errors={fieldErrors}
          />

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create contact"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
