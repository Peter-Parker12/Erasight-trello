import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { canAccessModule } from "@/lib/module-access";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { ProductsBundlesWrapper } from "./_components/products-bundles-wrapper";

type ProductsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ProductsPage = async ({ params }: ProductsPageProps) => {
  const { organizationId } = await params;
  const { orgId, userId } = await auth();

  if (!orgId || !userId || orgId !== organizationId) redirect("/select-org");

  const [canManageFields, products, bundles, definitionRows, categories] = await Promise.all([
    canAccessModule(orgId, userId, "CRM"),
    db.product.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
    db.productBundle.findMany({
      where: { orgId },
      include: {
        items: { where: { active: true }, include: { product: true, childBundle: true } },
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

  const definitions = definitionRows.map(toFieldDefinitionDTO);

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {canManageFields && (
        <CustomFieldsManager entityType="PRODUCT" label="Custom fields" fields={definitions} />
      )}

      {/* KPI cards + Products + Bundles — single client wrapper keeps all counts live */}
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
