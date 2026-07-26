"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import { Pencil } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { ProductFormDialog } from "./product-form-dialog";
import { CategoryBadge, type ProductCategoryDef } from "./category-select";
import { cn } from "@/lib/utils";

function formatVnd(n: number | string | { toNumber?: () => number; toString: () => string }) {
  return new Intl.NumberFormat("vi-VN").format(
    typeof n === "object" && n !== null && "toNumber" in n && typeof n.toNumber === "function"
      ? n.toNumber()
      : Number(n)
  );
}

type DetailRowProps = {
  label: string;
  children: React.ReactNode;
};

const DetailRow = ({ label, children }: DetailRowProps) => (
  <div className="grid grid-cols-[120px_1fr] gap-2 py-2 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground pt-0.5">{label}</span>
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

type ProductDetailSheetProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitions: CustomFieldDefinitionDTO[];
  categories: ProductCategoryDef[];
  onCategoryCreated: (cat: ProductCategoryDef) => void;
  onUpdated: (product: Product) => void;
};

export const ProductDetailSheet = ({
  product,
  open,
  onOpenChange,
  definitions,
  categories,
  onCategoryCreated,
  onUpdated,
}: ProductDetailSheetProps) => {
  const [editOpen, setEditOpen] = useState(false);

  if (!product) return null;

  const productCats = (product.categories ?? [])
    .map((name) => categories.find((c) => c.name === name))
    .filter(Boolean) as ProductCategoryDef[];

  const customFields = product.customFields as Record<string, unknown>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md bg-background border-border overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3 pr-6">
            <SheetTitle className="text-foreground text-lg font-semibold leading-snug">
              {product.name || <span className="text-muted-foreground italic">Untitled</span>}
            </SheetTitle>
            <ProductFormDialog
              trigger={
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 rounded px-2 py-1 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              }
              product={product}
              definitions={definitions}
              categories={categories}
              onCategoryCreated={onCategoryCreated}
              onCreated={(updated) => {
                onUpdated(updated);
                setEditOpen(false);
              }}
            />
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-0">
          <DetailRow label="Status">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                product.status === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {product.status === "ACTIVE" ? "Active" : "Inactive"}
            </span>
          </DetailRow>

          {product.description && (
            <DetailRow label="Description">
              <p className="whitespace-pre-wrap text-foreground">{product.description}</p>
            </DetailRow>
          )}

          <DetailRow label="Categories">
            {productCats.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {productCats.map((cat) => (
                  <CategoryBadge key={cat.name} name={cat.name} color={cat.color} size="xs" />
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground italic">—</span>
            )}
          </DetailRow>

          <DetailRow label="Unit price">
            <span className="text-primary font-medium tabular-nums">
              {formatVnd(product.unitPrice)} ₫
            </span>
          </DetailRow>

          <DetailRow label="Unit">
            <span className="text-muted-foreground">{product.unit}</span>
          </DetailRow>

          {definitions.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Custom fields
              </p>
              {definitions.map((def) => {
                const value = customFields[def.key];
                const display =
                  value === undefined || value === null || value === ""
                    ? null
                    : Array.isArray(value)
                    ? value.join(", ")
                    : String(value);
                return (
                  <DetailRow key={def.key} label={def.label}>
                    {display ?? <span className="text-muted-foreground italic">—</span>}
                  </DetailRow>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
