"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { updateProduct } from "@/actions/update-product";
import { deleteProduct } from "@/actions/delete-product";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { CategoryBadge, CategorySelect, type ProductCategoryDef } from "./category-select";
import { cn } from "@/lib/utils";
import { ProductDetailSheet } from "./product-detail-sheet";

function formatVnd(n: number | string | { toNumber?: () => number; toString: () => string }) {
  return new Intl.NumberFormat("vi-VN").format(
    typeof n === "object" && n !== null && "toNumber" in n && typeof n.toNumber === "function"
      ? n.toNumber()
      : Number(n)
  );
}

const UNITS = ["item", "hour", "month", "year", "seat", "project"] as const;

type EditState = {
  id: string;
  field: "unitPrice";
  value: string;
};

type ProductsTableProps = {
  products: Product[];
  definitions: CustomFieldDefinitionDTO[];
  categories: ProductCategoryDef[];
  onCategoryCreated: (cat: ProductCategoryDef) => void;
  onUpdated: (product: Product) => void;
  onDeleted: (id: string) => void;
};

export const ProductsTable = ({
  products,
  definitions,
  categories,
  onCategoryCreated,
  onUpdated,
  onDeleted,
}: ProductsTableProps) => {
  const [edit, setEdit]     = useState<EditState | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const cancellingRef       = useRef(false);

  // Track which row has the category dropdown open
  const [catEditId, setCatEditId] = useState<string | null>(null);

  // Detail sheet state
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const startEdit = (product: Product, field: EditState["field"]) => {
    const value = String(Number(product.unitPrice));
    setEdit({ id: product.id, field, value });
  };

  const cancelEdit = () => {
    cancellingRef.current = true;
    setEdit(null);
  };

  const commitEdit = async (product: Product) => {
    if (!edit || edit.id !== product.id) return;

    const { field, value } = edit;
    const original = String(Number(product.unitPrice));

    if (value === original) { setEdit(null); return; }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) { setEdit(null); return; }

    const optimistic = { ...product, unitPrice: numValue } as unknown as Product;
    setEdit(null);
    onUpdated(optimistic);
    setSaving(product.id);

    const result = await updateProduct({
      id:          product.id,
      name:        product.name,
      description: product.description   ?? undefined,
      category:    product.categories[0] ?? product.category ?? undefined,
      categories:  product.categories,
      unitPrice:   numValue,
      unit:        product.unit,
      status:      product.status,
    });

    setSaving(null);
    if (result.error) { toast.error(result.error); onUpdated(product); }
    else if (result.data) onUpdated(result.data);
  };

  const saveField = async (product: Product, field: "unit" | "status", value: string) => {
    const optimistic = { ...product, [field]: value } as Product;
    onUpdated(optimistic);

    const result = await updateProduct({
      id:          product.id,
      name:        product.name,
      description: product.description   ?? undefined,
      category:    product.categories[0] ?? product.category ?? undefined,
      categories:  product.categories,
      unitPrice:   Number(product.unitPrice),
      unit:        field === "unit"   ? value : product.unit,
      status:      field === "status" ? (value as "ACTIVE" | "INACTIVE") : product.status,
    });

    if (result.error) { toast.error(result.error); onUpdated(product); }
    else if (result.data) onUpdated(result.data);
  };

  const saveCategories = async (product: Product, newCategories: string[]) => {
    const optimistic = { ...product, categories: newCategories } as Product;
    onUpdated(optimistic);

    const result = await updateProduct({
      id:          product.id,
      name:        product.name,
      description: product.description ?? undefined,
      category:    newCategories[0]    ?? undefined,
      categories:  newCategories,
      unitPrice:   Number(product.unitPrice),
      unit:        product.unit,
      status:      product.status,
    });

    if (result.error) { toast.error(result.error); onUpdated(product); }
    else if (result.data) onUpdated(result.data);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    onDeleted(product.id);
    const result = await deleteProduct({ id: product.id });
    if (result.error) { toast.error(result.error); onUpdated(product); }
    else toast.success("Product deleted.");
  };

  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#333] p-8 text-center text-sm text-muted-foreground">
        No products yet. Create your first product to get started.
      </div>
    );
  }

  const cellInputCls = cn(
    "w-full h-full px-3 py-[9px] text-sm border-0 focus:outline-none",
    "bg-blue-500/10 ring-2 ring-inset ring-blue-500/60 text-[#e5e5e5]"
  );

  return (
    <div className="rounded-md border border-[#333] overflow-visible">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-[#252525] border-b border-[#333]">
          <tr className="text-xs font-semibold uppercase text-muted-foreground">
            <th className="w-8 px-2 py-2 text-center border-r border-[#333] select-none">#</th>
            <th className="px-3 py-2 text-left border-r border-[#333]">Name</th>
            <th className="px-3 py-2 text-left border-r border-[#333]">Categories</th>
            <th className="px-3 py-2 text-right border-r border-[#333] w-48">Unit price (VND)</th>
            <th className="px-3 py-2 text-center border-r border-[#333] w-24">Unit</th>
            <th className="px-3 py-2 text-center border-r border-[#333] w-24">Status</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e2e2e]">
          {products.map((product, idx) => {
            const isEditPrice = edit?.id === product.id && edit.field === "unitPrice";
            const isSaving    = saving === product.id;
            const isCatOpen   = catEditId === product.id;

            const productCats = (product.categories ?? [])
              .map((name) => categories.find((c) => c.name === name))
              .filter(Boolean) as ProductCategoryDef[];

            return (
              <tr
                key={product.id}
                className={cn(
                  "group hover:bg-[#1e1e1e]",
                  (isEditPrice || isCatOpen) && "bg-[#1e1e1e]",
                  isSaving && "opacity-60"
                )}
              >
                {/* # */}
                <td className="w-8 px-2 text-center text-xs text-muted-foreground border-r border-[#2e2e2e] select-none">
                  {idx + 1}
                </td>

                {/* Name — click to open detail sheet */}
                <td className="p-0 border-r border-[#2e2e2e] min-w-[160px]">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-[9px] font-medium text-[#e5e5e5] hover:text-violet-400 transition-colors"
                    onClick={() => setDetailProduct(product)}
                  >
                    {product.name || <span className="text-muted-foreground italic">Untitled</span>}
                  </button>
                </td>

                {/* Categories — inline multi-select */}
                <td className="p-0 border-r border-[#2e2e2e] min-w-[180px] relative">
                  {isCatOpen ? (
                    <div className="px-2 py-1">
                      <CategorySelect
                        value={product.categories ?? []}
                        onChange={(v) => {
                          saveCategories(product, v);
                        }}
                        categories={categories}
                        onCategoryCreated={(cat) => {
                          onCategoryCreated(cat);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setCatEditId(null)}
                        className="mt-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div
                      className="px-3 py-[9px] flex flex-wrap gap-1 cursor-pointer min-h-[38px]"
                      onClick={() => setCatEditId(product.id)}
                    >
                      {productCats.length > 0 ? (
                        productCats.map((cat) => (
                          <CategoryBadge key={cat.name} name={cat.name} color={cat.color} size="xs" />
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/30 italic">—</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Unit Price */}
                <td
                  className={cn("p-0 border-r border-[#2e2e2e] w-48", !isEditPrice && "cursor-text")}
                  onClick={() => !isEditPrice && startEdit(product, "unitPrice")}
                >
                  {isEditPrice ? (
                    <input
                      autoFocus
                      type="number"
                      min={0}
                      value={edit!.value}
                      onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => {
                        if (cancellingRef.current) { cancellingRef.current = false; return; }
                        commitEdit(product);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")  { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className={cn(cellInputCls, "text-right tabular-nums")}
                    />
                  ) : (
                    <div className="px-3 py-[9px] text-right text-violet-400 font-medium tabular-nums">
                      {formatVnd(product.unitPrice)} ₫
                    </div>
                  )}
                </td>

                {/* Unit */}
                <td className="p-0 border-r border-[#2e2e2e] w-24">
                  <select
                    value={product.unit}
                    onChange={(e) => saveField(product, "unit", e.target.value)}
                    className="w-full h-full px-3 py-[9px] text-sm bg-transparent text-muted-foreground hover:bg-[#2a2a2a] cursor-pointer focus:outline-none appearance-none"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>

                {/* Status */}
                <td className="p-0 border-r border-[#2e2e2e] w-24">
                  <select
                    value={product.status}
                    onChange={(e) => saveField(product, "status", e.target.value)}
                    className={cn(
                      "w-full h-full px-3 py-[9px] text-sm bg-transparent cursor-pointer focus:outline-none appearance-none",
                      product.status === "ACTIVE" ? "text-emerald-400" : "text-[#888]"
                    )}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </td>

                {/* Delete */}
                <td className="w-10 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#2e2e2e] text-[11px] text-muted-foreground/50 select-none">
        Click name to view details · Click price to edit · Click categories to select tags · Unit &amp; Status save on change
      </div>

      <ProductDetailSheet
        product={detailProduct}
        open={!!detailProduct}
        onOpenChange={(open) => { if (!open) setDetailProduct(null); }}
        definitions={definitions}
        categories={categories}
        onCategoryCreated={onCategoryCreated}
        onUpdated={(updated) => {
          onUpdated(updated);
          setDetailProduct(updated);
        }}
      />
    </div>
  );
};
