"use client";

import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteProduct } from "@/actions/delete-product";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { ProductFormDialog } from "./product-form-dialog";
import { cn } from "@/lib/utils";

function formatVnd(n: number | string | { toNumber?: () => number; toString: () => string }) {
  return new Intl.NumberFormat("vi-VN").format(
    typeof n === "object" && n !== null && "toNumber" in n && typeof n.toNumber === "function"
      ? n.toNumber()
      : Number(n)
  );
}

type ProductsTableProps = {
  products: Product[];
  definitions: CustomFieldDefinitionDTO[];
};

export const ProductsTable = ({ products }: ProductsTableProps) => {
  const { execute, isLoading } = useAction(deleteProduct, {
    onSuccess: () => toast.success("Product deleted."),
    onError: (error) => toast.error(error),
  });

  const onDelete = (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    execute({ id: product.id });
  };

  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#333] p-8 text-center text-sm text-muted-foreground">
        No products yet. Create your first product to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[#333]">
      <table className="w-full text-sm">
        <thead className="bg-[#2a2a2a] text-left text-xs font-semibold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Price (VND)</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333]">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-[#2a2a2a]">
              <td className="px-4 py-2 font-medium text-[#e5e5e5]">{product.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{product.category || "—"}</td>
              <td className="px-4 py-2 text-violet-400 font-medium">{formatVnd(product.unitPrice)} ₫</td>
              <td className="px-4 py-2 text-muted-foreground">{product.unit}</td>
              <td className="px-4 py-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-semibold",
                  product.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-[#333] text-[#888]"
                )}>
                  {product.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <ProductFormDialog
                    product={product}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    disabled={isLoading}
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
