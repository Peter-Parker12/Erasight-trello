import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Package, Layers } from "lucide-react";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { KpiCard } from "@/components/crm/kpi-card";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { ProductsBundlesWrapper } from "./_components/products-bundles-wrapper";

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

      {/* Custom fields (admin only) */}
      {isAdmin && (
        <CustomFieldsManager entityType="PRODUCT" label="Custom fields" fields={definitions} />
      )}

      {/* Products + Bundles — single client wrapper so product deletions propagate to bundles */}
      <ProductsBundlesWrapper
        initialProducts={products}
        definitions={definitions}
        initialCategories={categories}
        initialBundles={bundles}
      />
    </div>
  );
};

export default ProductsPage;
