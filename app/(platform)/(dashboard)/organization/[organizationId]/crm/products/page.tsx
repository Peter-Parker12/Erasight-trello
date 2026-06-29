import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Plus, Package, Layers } from "lucide-react";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { KpiCard } from "@/components/crm/kpi-card";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { BundleFormDialog } from "./_components/bundle-form-dialog";
import { BundlesTable } from "./_components/bundles-table";
import { ProductsClientSection } from "./_components/products-client-section";

type ProductsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ProductsPage = async ({ params }: ProductsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const [isAdmin, products, bundles, definitionRows, categories] = await Promise.all([
    isOrgAdmin(orgId),
    db.product.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
    db.productBundle.findMany({
      where: { orgId },
      include: {
        items: { where: { active: true }, include: { product: true } },
        _count: { select: { companies: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getFieldDefinitions(orgId, "PRODUCT"),
    db.productCategory.findMany({
      where: { orgId },
      orderBy: { order: "asc" },
    }),
  ]);

  const definitions   = definitionRows.map(toFieldDefinitionDTO);
  const activeProducts = products.filter((p) => p.status === "ACTIVE").length;

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Total products" value={products.length}  icon={Package} />
        <KpiCard label="Active"         value={activeProducts}    icon={Package} iconColor="text-emerald-400" />
        <KpiCard label="Bundles"        value={bundles.length}    icon={Layers}  iconColor="text-violet-400" />
      </div>

      {/* Products section (client wrapper for immediate-add + inline-edit) */}
      <div className="space-y-4">
        {isAdmin && (
          <CustomFieldsManager entityType="PRODUCT" label="Custom fields" fields={definitions} />
        )}

        <ProductsClientSection
          initialProducts={products}
          definitions={definitions}
          initialCategories={categories}
        />
      </div>

      {/* Bundles section */}
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
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New bundle
              </Button>
            }
          />
        </div>

        <BundlesTable bundles={bundles} products={products} />
      </div>
    </div>
  );
};

export default ProductsPage;
