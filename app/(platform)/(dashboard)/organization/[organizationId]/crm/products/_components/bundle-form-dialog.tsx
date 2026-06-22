"use client";

import { useState, useRef, type ElementRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { Product, ProductBundle, ProductBundleItem } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { createBundle } from "@/actions/create-bundle";
import { updateBundle } from "@/actions/update-bundle";

type BundleItem = { productId: string; quantity: number; unitPrice: number };

type BundleWithItems = ProductBundle & { items: (ProductBundleItem & { product: Product })[] };

type BundleFormDialogProps = {
  trigger?: React.ReactNode;
  products: Product[];
  bundle?: BundleWithItems;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onCreated?: (bundle: { id: string; name: string }) => void;
};

const PRICING_MODES = [
  { value: "SUM", label: "Sum of items" },
  { value: "DISCOUNT_PERCENT", label: "Discount %" },
  { value: "DISCOUNT_FLAT", label: "Discount flat (VND)" },
  { value: "FIXED", label: "Fixed price" },
];

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function calcTotal(items: BundleItem[], pricingMode: string, discount: number, finalPrice: number): number {
  const sum = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  if (pricingMode === "FIXED") return finalPrice;
  if (pricingMode === "DISCOUNT_PERCENT") return sum * (1 - discount / 100);
  if (pricingMode === "DISCOUNT_FLAT") return Math.max(0, sum - discount);
  return sum;
}

export const BundleFormDialog = ({ trigger, products, bundle, open: controlledOpen, onOpenChange: controlledOnOpenChange, onCreated }: BundleFormDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!bundle;

  const [items, setItems] = useState<BundleItem[]>(
    bundle?.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })) ?? []
  );
  const [pricingMode, setPricingMode] = useState<string>(bundle?.pricingMode ?? "SUM");
  const [discount, setDiscount] = useState(Number(bundle?.discount ?? 0));
  const [finalPrice, setFinalPrice] = useState(Number(bundle?.finalPrice ?? 0));
  const [addProductId, setAddProductId] = useState(products[0]?.id ?? "");

  const availableToAdd = products.filter((p) => p.status === "ACTIVE" && !items.find((i) => i.productId === p.id));

  const addItem = () => {
    if (!addProductId) return;
    const product = products.find((p) => p.id === addProductId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      { productId: product.id, quantity: 1, unitPrice: Number(product.unitPrice) },
    ]);
    const remaining = availableToAdd.filter((p) => p.id !== addProductId);
    setAddProductId(remaining[0]?.id ?? "");
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateItem = (productId: string, field: "quantity" | "unitPrice", value: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i))
    );
  };

  const total = calcTotal(items, pricingMode, discount, finalPrice);

  const { execute: executeCreate } = useAction(createBundle, {
    onSuccess: (data) => {
      toast.success("Bundle created.");
      closeRef.current?.click();
      onCreated?.({ id: data.id, name: data.name });
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate } = useAction(updateBundle, {
    onSuccess: () => { toast.success("Bundle updated."); closeRef.current?.click(); },
    onError: (error) => toast.error(error),
  });

  const onSubmit = (formData: FormData) => {
    if (items.length === 0) { toast.error("Add at least one product."); return; }

    const fields = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      pricingMode: pricingMode as "SUM" | "DISCOUNT_PERCENT" | "DISCOUNT_FLAT" | "FIXED",
      discount: pricingMode !== "SUM" && pricingMode !== "FIXED" ? discount : undefined,
      finalPrice: pricingMode === "FIXED" ? finalPrice : undefined,
      items,
    };

    if (isEdit) {
      executeUpdate({ id: bundle!.id, ...fields });
    } else {
      executeCreate(fields);
    }
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      // Reset when closing
      setItems(bundle?.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: Number(i.unitPrice) })) ?? []);
      setPricingMode(bundle?.pricingMode ?? "SUM");
      setDiscount(Number(bundle?.discount ?? 0));
      setFinalPrice(Number(bundle?.finalPrice ?? 0));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit bundle" : "New bundle"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <FormInput id="name" label="Bundle name" required defaultValue={bundle?.name} />
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#e5e5e5]">Pricing mode</Label>
              <select
                value={pricingMode}
                onChange={(e) => setPricingMode(e.target.value)}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
              >
                {PRICING_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <FormTextarea id="description" label="Description" defaultValue={bundle?.description ?? ""} />

          {/* Product line items */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#e5e5e5]">Products</Label>

            {items.length > 0 && (
              <div className="rounded-md border border-[#333] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#2a2a2a] text-xs text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Product</th>
                      <th className="text-left px-3 py-2 font-medium w-24">Qty</th>
                      <th className="text-left px-3 py-2 font-medium w-36">Unit price (VND)</th>
                      <th className="text-left px-3 py-2 font-medium w-32">Subtotal</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <tr key={item.productId} className="hover:bg-[#2a2a2a]">
                          <td className="px-3 py-2 text-[#e5e5e5]">
                            {product?.name ?? "Unknown"}
                            {product?.unit && (
                              <span className="text-muted-foreground text-xs ml-1">/ {product.unit}</span>
                            )}
                          </td>
                          <td className="px-3 py-1">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItem(item.productId, "quantity", Number(e.target.value))}
                              className="w-20 text-sm px-2 py-1 rounded border border-[#333] bg-[#1f1f1f] text-[#e5e5e5]"
                            />
                          </td>
                          <td className="px-3 py-1">
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.productId, "unitPrice", Number(e.target.value))}
                              className="w-32 text-sm px-2 py-1 rounded border border-[#333] bg-[#1f1f1f] text-[#e5e5e5]"
                            />
                          </td>
                          <td className="px-3 py-2 text-violet-400 font-medium text-xs">
                            {formatVnd(item.unitPrice * item.quantity)} ₫
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {availableToAdd.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="flex-1 text-sm px-2 py-1 h-8 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
                >
                  {availableToAdd.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            )}

            {items.length === 0 && (
              <p className="text-xs text-muted-foreground">No products added yet.</p>
            )}
          </div>

          {/* Pricing adjustments */}
          {(pricingMode === "DISCOUNT_PERCENT" || pricingMode === "DISCOUNT_FLAT") && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#e5e5e5]">
                {pricingMode === "DISCOUNT_PERCENT" ? "Discount %" : "Discount amount (VND)"}
              </Label>
              <input
                type="number"
                min={0}
                max={pricingMode === "DISCOUNT_PERCENT" ? 100 : undefined}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-48 text-sm px-2 py-1 rounded border border-[#333] bg-[#2a2a2a] text-[#e5e5e5]"
              />
            </div>
          )}

          {pricingMode === "FIXED" && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#e5e5e5]">Final price (VND)</Label>
              <input
                type="number"
                min={0}
                value={finalPrice}
                onChange={(e) => setFinalPrice(Number(e.target.value))}
                className="w-48 text-sm px-2 py-1 rounded border border-[#333] bg-[#2a2a2a] text-[#e5e5e5]"
              />
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between rounded-md bg-violet-600/10 border border-violet-600/30 px-4 py-3">
            <span className="text-sm font-semibold text-[#e5e5e5]">Total</span>
            <span className="text-lg font-bold text-violet-400">
              {formatVnd(Math.round(total))} ₫
            </span>
          </div>

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create bundle"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
