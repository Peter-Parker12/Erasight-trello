"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductsTable } from "./products-table";
import type { ProductCategoryDef } from "./category-select";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type Props = {
  initialProducts: Product[];
  definitions: CustomFieldDefinitionDTO[];
  initialCategories: ProductCategoryDef[];
  onProductCreated?: (product: Product) => void;
  onProductDeleted?: (id: string) => void;
};

export const ProductsClientSection = ({
  initialProducts,
  definitions,
  initialCategories,
  onProductCreated,
  onProductDeleted,
}: Props) => {
  const [products, setProducts]     = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);

  const handleCreated = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    onProductCreated?.(product);
  };

  const handleUpdated = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const handleDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    onProductDeleted?.(id);
  };

  const handleCategoryCreated = (cat: ProductCategoryDef) => {
    setCategories((prev) => [...prev, cat]);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products &amp; Services</h1>
          <p className="text-sm text-muted-foreground">
            The service catalogue your organisation offers.
          </p>
        </div>
        <ProductFormDialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New product
            </Button>
          }
          definitions={definitions}
          categories={categories}
          onCategoryCreated={handleCategoryCreated}
          onCreated={handleCreated}
        />
      </div>

      <ProductsTable
        products={products}
        definitions={definitions}
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
};
