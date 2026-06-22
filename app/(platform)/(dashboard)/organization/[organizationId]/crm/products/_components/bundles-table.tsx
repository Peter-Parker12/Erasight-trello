"use client";

import { toast } from "sonner";
import type { Product, ProductBundle, ProductBundleItem } from "@prisma/client";
import { Pencil, Trash2, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteBundle } from "@/actions/delete-bundle";
import { BundleFormDialog } from "./bundle-form-dialog";

type BundleWithItems = ProductBundle & {
  items: (ProductBundleItem & { product: Product })[];
  _count: { companies: number };
};

function formatVnd(n: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(n));
}

function bundleTotal(bundle: BundleWithItems): number {
  const sum = bundle.items.reduce(
    (acc, item) => acc + Number(item.unitPrice) * item.quantity,
    0
  );
  if (bundle.pricingMode === "FIXED") return Number(bundle.finalPrice ?? 0);
  if (bundle.pricingMode === "DISCOUNT_PERCENT") return sum * (1 - Number(bundle.discount ?? 0) / 100);
  if (bundle.pricingMode === "DISCOUNT_FLAT") return Math.max(0, sum - Number(bundle.discount ?? 0));
  return sum;
}

const PRICING_LABEL: Record<string, string> = {
  SUM: "Sum",
  DISCOUNT_PERCENT: "Discount %",
  DISCOUNT_FLAT: "Discount flat",
  FIXED: "Fixed",
};

type BundlesTableProps = {
  bundles: BundleWithItems[];
  products: Product[];
};

export const BundlesTable = ({ bundles, products }: BundlesTableProps) => {
  const { execute, isLoading } = useAction(deleteBundle, {
    onSuccess: () => toast.success("Bundle deleted."),
    onError: (error) => toast.error(error),
  });

  const onDelete = (bundle: BundleWithItems) => {
    if (!confirm(`Delete bundle "${bundle.name}"? This cannot be undone.`)) return;
    execute({ id: bundle.id });
  };

  if (bundles.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#333] p-8 text-center text-sm text-muted-foreground">
        No bundles yet. Create a bundle to start quoting services.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[#333]">
      <table className="w-full text-sm">
        <thead className="bg-[#2a2a2a] text-left text-xs font-semibold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Bundle name</th>
            <th className="px-4 py-2">Products</th>
            <th className="px-4 py-2">Pricing</th>
            <th className="px-4 py-2">Total (VND)</th>
            <th className="px-4 py-2">Companies</th>
            <th className="px-4 py-2 w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333]">
          {bundles.map((bundle) => (
            <tr key={bundle.id} className="hover:bg-[#2a2a2a]">
              <td className="px-4 py-2 font-medium text-[#e5e5e5]">
                {bundle.name}
                {bundle.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{bundle.description}</p>
                )}
              </td>
              <td className="px-4 py-2 text-muted-foreground text-xs">
                {bundle.items.map((i) => i.product.name).join(", ") || "—"}
              </td>
              <td className="px-4 py-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-500/20 text-violet-400">
                  {PRICING_LABEL[bundle.pricingMode]}
                </span>
              </td>
              <td className="px-4 py-2 text-violet-400 font-semibold">
                {formatVnd(Math.round(bundleTotal(bundle)))} ₫
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {bundle._count.companies}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <BundleFormDialog
                    bundle={bundle}
                    products={products}
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
                    onClick={() => onDelete(bundle)}
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
