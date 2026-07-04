"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

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
import { useAction } from "@/hooks/use-action";
import { createRole } from "@/actions/create-role";
import { updateRole } from "@/actions/update-role";
import { ActionChipInput } from "./action-chip-input";

type RoleFormDialogProps = {
  trigger: React.ReactNode;
  role?: Role;
};

export const RoleFormDialog = ({ trigger, role }: RoleFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!role;

  const [actions, setActions] = useState<string[]>(role?.actions ?? []);

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createRole, {
    onSuccess: () => {
      toast.success("Role created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateRole, {
    onSuccess: () => {
      toast.success("Role updated.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const fieldErrors = isEdit ? updateErrors : createErrors;

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setActions(role?.actions ?? []);
  };

  const onSubmit = (formData: FormData) => {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || undefined;

    if (isEdit) {
      executeUpdate({ id: role!.id, name, description, actions });
    } else {
      executeCreate({ name, description, actions });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "New role"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-4">
          <FormInput
            id="name"
            label="Name"
            defaultValue={role?.name}
            errors={fieldErrors}
          />

          <FormTextarea
            id="description"
            label="Description"
            defaultValue={role?.description ?? ""}
            errors={fieldErrors}
          />

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#e5e5e5]">Actions</Label>
            <ActionChipInput value={actions} onChange={setActions} />
          </div>

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create role"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
