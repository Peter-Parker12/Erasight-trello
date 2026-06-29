"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { updateProduct } from "@/actions/update-product";
import { deleteProduct } from "@/actions/delete-product";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { cn } from "@/lib/utils";

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
  field: "name" | "category" | "unitPrice";
  value: string;
};

type ProductsTableProps = {
  products: Product[];
  definitions: CustomFieldDefinitionDTO[];
};

export const ProductsTable = ({ products: initialProducts }: ProductsTableProps) => {
  const [products, setProducts] = useState(initialProducts);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const cancellingRef = useRef(false);

  const startEdit = (product: Product, field: EditState["field"]) => {
    const value =
      field === "unitPrice"
        ? String(Number(product.unitPrice))
        : String((product as Record<string, unknown>)[field] ?? "");
    setEdit({ id: product.id, field, value });
  };

  const cancelEdit = () => {
    cancellingRef.current = true;
    setEdit(null);
  };

  const commitEdit = async (product: Product) => {
    if (!edit || edit.id !== product.id) return;

    const { field, value } = edit;

    const original =
      field === "unitPrice"
        ? String(Number(product.unitPrice))
        : String((product as Record<string, unknown>)[field] ?? "");

    if (value === original) {
      setEdit(null);
      return;
    }

    const numValue = field === "unitPrice" ? Number(value) : null;
    if (field === "unitPrice" && (isNaN(numValue!) || numValue! < 0)) {
      setEdit(null);
      return;
    }

    const optimistic = {
      ...product,
      [field]: field === "unitPrice" ? numValue : value,
    } as Product;

    setEdit(null);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? optimistic : p)));
    setSaving(product.id);

    const result = await updateProduct({
      id: product.id,
      name: field === "name" ? value : product.name,
      description: product.description ?? undefined,
      category:
        field === "category" ? (value || undefined) : (product.category ?? undefined),
      unitPrice: field === "unitPrice" ? numValue! : Number(product.unitPrice),
      unit: product.unit,
      status: product.status,
    });

    setSaving(null);

    if (result.error) {
      toast.error(result.error);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    } else if (result.data) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? result.data! : p)));
    }
  };

  const saveField = async (
    product: Product,
    field: "unit" | "status",
    value: string
  ) => {
    const optimistic = { ...product, [field]: value } as Product;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? optimistic : p)));

    const result = await updateProduct({
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      category: product.category ?? undefined,
      unitPrice: Number(product.unitPrice),
      unit: field === "unit" ? value : product.unit,
      status: field === "status" ? (value as "ACTIVE" | "INACTIVE") : product.status,
    });

    if (result.error) {
      toast.error(result.error);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    } else if (result.data) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? result.data! : p)));
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    const result = await deleteProduct({ id: product.id });
    if (result.error) {
      toast.error(result.error);
      setProducts((prev) => {
        const srcIdx = initialProducts.findIndex((p) => p.id === product.id);
        if (srcIdx === -1) return [...prev, product];
        const copy = [...prev];
        copy.splice(srcIdx, 0, product);
        return copy;
      });
    } else {
      toast.success("Product deleted.");
    }
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
    <div className="rounded-md border border-[#333] overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-[#252525] border-b border-[#333]">
          <tr className="text-xs font-semibold uppercase text-muted-foreground">
            <th className="w-8 px-2 py-2 text-center border-r border-[#333] select-none">#</th>
            <th className="px-3 py-2 text-left border-r border-[#333]">Name</th>
            <th className="px-3 py-2 text-left border-r border-[#333]">Category</th>
            <th className="px-3 py-2 text-right border-r border-[#333] w-48">Unit price (VND)</th>
            <th className="px-3 py-2 text-center border-r border-[#333] w-24">Unit</th>
            <th className="px-3 py-2 text-center border-r border-[#333] w-24">Status</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e2e2e]">
          {products.map((product, idx) => {
            const isEditName  = edit?.id === product.id && edit.field === "name";
            const isEditCat   = edit?.id === product.id && edit.field === "category";
            const isEditPrice = edit?.id === product.id && edit.field === "unitPrice";
            const isSaving    = saving === product.id;

            return (
              <tr
                key={product.id}
                className={cn(
                  "group hover:bg-[#1e1e1e]",
                  (isEditName || isEditCat || isEditPrice) && "bg-[#1e1e1e]",
                  isSaving && "opacity-60"
                )}
              >
                {/* Row number */}
                <td className="w-8 px-2 text-center text-xs text-muted-foreground border-r border-[#2e2e2e] select-none">
                  {idx + 1}
                </td>

                {/* Name */}
                <td
                  className={cn("p-0 border-r border-[#2e2e2e] min-w-[160px]", !isEditName && "cursor-text")}
                  onClick={() => !isEditName && startEdit(product, "name")}
                >
                  {isEditName ? (
                    <input
                      autoFocus
                      type="text"
                      value={edit!.value}
                      onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
                      onBlur={() => {
                        if (cancellingRef.current) { cancellingRef.current = false; return; }
                        commitEdit(product);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                        else if (e.key === "Escape") cancelEdit();
                      }}
                      className={cellInputCls}
                    />
                  ) : (
                    <div className="px-3 py-[9px] font-medium text-[#e5e5e5]">{product.name}</div>
                  )}
                </td>

                {/* Category */}
                <td
                  className={cn("p-0 border-r border-[#2e2e2e] min-w-[120px]", !isEditCat && "cursor-text")}
                  onClick={() => !isEditCat && startEdit(product, "category")}
                >
                  {isEditCat ? (
                    <input
                      autoFocus
                      type="text"
                      value={edit!.value}
                      placeholder="Category..."
                      onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
                      onBlur={() => {
                        if (cancellingRef.current) { cancellingRef.current = false; return; }
                        commitEdit(product);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                        else if (e.key === "Escape") cancelEdit();
                      }}
                      className={cellInputCls}
                    />
                  ) : (
                    <div className="px-3 py-[9px] text-muted-foreground">
                      {product.category || <span className="opacity-30 italic text-xs">—</span>}
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
                        if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                        else if (e.key === "Escape") cancelEdit();
                      }}
                      className={cn(cellInputCls, "text-right tabular-nums")}
                    />
                  ) : (
                    <div className="px-3 py-[9px] text-right text-violet-400 font-medium tabular-nums">
                      {formatVnd(product.unitPrice)} ₫
                    </div>
                  )}
                </td>

                {/* Unit dropdown */}
                <td className="p-0 border-r border-[#2e2e2e] w-24">
                  <select
                    value={product.unit}
                    onChange={(e) => saveField(product, "unit", e.target.value)}
                    className="w-full h-full px-3 py-[9px] text-sm bg-transparent text-muted-foreground hover:bg-[#2a2a2a] cursor-pointer focus:outline-none appearance-none"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>

                {/* Status dropdown */}
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
        Click any cell to edit · Enter to confirm · Esc to cancel · Unit &amp; Status save on change
      </div>
    </div>
  );
};
