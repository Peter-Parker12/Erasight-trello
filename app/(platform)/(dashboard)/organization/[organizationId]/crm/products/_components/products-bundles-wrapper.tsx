"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Layers } from "lucide-react";
import type { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/crm/kpi-card";
import { ProductsClientSection } from "./products-client-section";
import { BundlesTable } from "./bundles-table";
import { BundleFormDialog, type BundleWithItems } from "./bundle-form-dialog";
import type { ProductCategoryDef } from "./category-select";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type Props = {
  initialProducts: Product[];
  definitions: CustomFieldDefinitionDTO[];
  initialCategories: ProductCategoryDef[];
  initialBundles: BundleWithItems[];
};

export const ProductsBundlesWrapper = ({
  initialProducts,
  definitions,
  initialCategories,
  initialBundles,
}: Props) => {
  // Live products list — kept in sync so bundle dialogs always see the latest products
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [bundles,  setBundles]  = useState<BundleWithItems[]>(initialBundles);

  // Sync both when the server re-renders (e.g. after router.refresh())
  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);
  useEffect(() => { setBundles(initialBundles);   }, [initialBundles]);

  // New product created → immediately available in the bundle product picker
  const handleProductCreated = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  // Product deleted → remove it from the picker and strip its items from every bundle
  const handleProductDeleted = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setBundles((prev) =>
      prev.map((bundle) => ({
        ...bundle,
        items: bundle.items.filter((item) => item.productId !== productId),
      }))
    );
  };

  const handleBundleUpdated = (updated: BundleWithItems) =>
    setBundles((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

  const handleBundleDeleted = (id: string) =>
    setBundles((prev) => prev.filter((b) => b.id !== id));

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;

  return (
    <>
      {/* ── KPI cards — derived from live state so numbers update instantly ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Total products" value={products.length} icon={Package} />
        <KpiCard label="Active"         value={activeCount}     icon={Package} iconColor="text-emerald-400" />
        <KpiCard label="Bundles"        value={bundles.length}  icon={Layers}  iconColor="text-primary" />
      </div>

      {/* ── Products section ── */}
      <div className="space-y-4">
        <ProductsClientSection
          initialProducts={initialProducts}
          definitions={definitions}
          initialCategories={initialCategories}
          onProductCreated={handleProductCreated}
          onProductDeleted={handleProductDeleted}
        />
      </div>

      {/* ── Bundles section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Bundles</h2>
            <p className="text-sm text-muted-foreground">
              Group products into a quoted bundle with flexible pricing.
            </p>
          </div>
          <BundleFormDialog
            products={products}
            bundles={bundles}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New bundle
              </Button>
            }
          />
        </div>

        <BundlesTable
          bundles={bundles}
          products={products}
          onBundleUpdated={handleBundleUpdated}
          onBundleDeleted={handleBundleDeleted}
        />
      </div>
    </>
  );
};
