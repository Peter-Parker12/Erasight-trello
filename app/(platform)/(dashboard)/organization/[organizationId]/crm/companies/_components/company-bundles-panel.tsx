"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, X, Layers } from "lucide-react";
import type { Product, ProductBundle, ProductBundleItem } from "@prisma/client";

import { Button } from "@/components/ui/button";

type BundleWithItems = ProductBundle & {
  items: (ProductBundleItem & { product: Product })[];
};

type CompanyBundlesPanelProps = {
  companyId: string;
  assignedBundles: BundleWithItems[];
  allBundles: BundleWithItems[];
  organizationId: string;
};

function formatVnd(n: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(n));
}

function bundleTotal(bundle: BundleWithItems): number {
  const sum = bundle.items.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0);
  if (bundle.pricingMode === "FIXED") return Number(bundle.finalPrice ?? 0);
  if (bundle.pricingMode === "DISCOUNT_PERCENT") return sum * (1 - Number(bundle.discount ?? 0) / 100);
  if (bundle.pricingMode === "DISCOUNT_FLAT") return Math.max(0, sum - Number(bundle.discount ?? 0));
  return sum;
}

export const CompanyBundlesPanel = ({
  companyId,
  assignedBundles,
  allBundles,
  organizationId,
}: CompanyBundlesPanelProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBundleId, setSelectedBundleId] = useState("");

  const unassigned = allBundles.filter((b) => !assignedBundles.find((a) => a.id === b.id));

  const assign = (bundleId: string, add: boolean) => {
    startTransition(async () => {
      const res = await fetch("/api/actions/assign-company-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, bundleId, assign: add }),
      });

      if (!res.ok) {
        toast.error("Failed to update bundle assignment.");
        return;
      }

      router.refresh();
      if (add) {
        setSelectedBundleId("");
        toast.success("Bundle assigned.");
      } else {
        toast.success("Bundle removed.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />
          Bundles
        </h2>
        {unassigned.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedBundleId}
              onChange={(e) => setSelectedBundleId(e.target.value)}
              className="text-sm px-2 py-1 h-7 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
            >
              <option value="">Pick a bundle…</option>
              {unassigned.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={!selectedBundleId || isPending}
              onClick={() => selectedBundleId && assign(selectedBundleId, true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Assign
            </Button>
          </div>
        )}
      </div>

      {assignedBundles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bundles assigned yet.</p>
      ) : (
        <div className="divide-y divide-[#333] rounded-md border border-[#333]">
          {assignedBundles.map((bundle) => (
            <div key={bundle.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#e5e5e5]">{bundle.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bundle.items.map((i) => `${i.product.name} ×${i.quantity}`).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-violet-400">
                  {formatVnd(Math.round(bundleTotal(bundle)))} ₫
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => assign(bundle.id, false)}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {allBundles.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No bundles exist yet — create one in the{" "}
          <a href={`/organization/${organizationId}/crm/products`} className="underline hover:text-violet-400">
            Products page
          </a>.
        </p>
      )}
    </div>
  );
};
