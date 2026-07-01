"use client";

import { useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";

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
import { createProduct } from "@/actions/create-product";
import { updateProduct } from "@/actions/update-product";
import { CustomFieldsFields } from "@/components/crm/custom-fields-fields";
import { extractCustomFieldsFromFormData } from "@/lib/custom-fields-form";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { CategorySelect, type ProductCategoryDef } from "./category-select";

const UNITS = ["item", "hour", "month", "year", "seat", "project"];

type ProductFormDialogProps = {
  trigger: React.ReactNode;
  product?: Product;
  definitions?: CustomFieldDefinitionDTO[];
  categories?: ProductCategoryDef[];
  onCategoryCreated?: (cat: ProductCategoryDef) => void;
  onCreated?: (product: Product) => void;
};

export const ProductFormDialog = ({
  trigger,
  product,
  definitions = [],
  categories = [],
  onCategoryCreated,
  onCreated,
}: ProductFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!product;

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories ?? []
  );

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createProduct, {
    skipRefresh: true,
    onSuccess: (data) => {
      toast.success("Product created.");
      onCreated?.(data);
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateProduct, {
    onSuccess: () => { toast.success("Product updated."); closeRef.current?.click(); },
    onError: (error) => toast.error(error),
  });

  const fieldErrors = isEdit ? updateErrors : createErrors;

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setSelectedCategories(product?.categories ?? []);
  };

  const onSubmit = (formData: FormData) => {
    const fields = {
      name:         formData.get("name") as string,
      description:  (formData.get("description") as string) || undefined,
      category:     selectedCategories[0] || undefined,
      categories:   selectedCategories,
      unitPrice:    Number(formData.get("unitPrice") as string),
      unit:         (formData.get("unit") as string) || "item",
      status:       (formData.get("status") as "ACTIVE" | "INACTIVE") || "ACTIVE",
      customFields: extractCustomFieldsFromFormData(formData, definitions),
    };

    if (isEdit) {
      executeUpdate({ id: product!.id, ...fields });
    } else {
      executeCreate(fields);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-4">
          <FormInput
            id="name"
            label="Name"
            required
            defaultValue={product?.name}
            errors={fieldErrors}
          />

          <FormTextarea
            id="description"
            label="Description"
            defaultValue={product?.description ?? ""}
            errors={fieldErrors}
          />

          {/* Category multi-select */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#e5e5e5]">Categories</Label>
            <CategorySelect
              value={selectedCategories}
              onChange={setSelectedCategories}
              categories={categories}
              onCategoryCreated={(cat) => {
                onCategoryCreated?.(cat);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs font-semibold text-[#e5e5e5]">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={product?.status ?? "ACTIVE"}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="unit" className="text-xs font-semibold text-[#e5e5e5]">
                Unit
              </Label>
              <select
                id="unit"
                name="unit"
                defaultValue={product?.unit ?? "item"}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="unitPrice" className="text-xs font-semibold text-[#e5e5e5]">
              Unit price (VND)
            </Label>
            <FormInput
              id="unitPrice"
              label=""
              type="number"
              required
              defaultValue={product?.unitPrice ? String(product.unitPrice) : ""}
              errors={fieldErrors}
            />
          </div>

          <CustomFieldsFields
            definitions={definitions}
            defaultValues={(product?.customFields as Record<string, unknown>) ?? {}}
            errors={fieldErrors}
          />

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create product"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
