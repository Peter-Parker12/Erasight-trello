"use client";

import { useState, useRef, type ElementRef, type KeyboardEvent } from "react";
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
import { cn } from "@/lib/utils";

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
  { value: "SUM",              label: "Sum of items" },
  { value: "DISCOUNT_PERCENT", label: "Discount %" },
  { value: "DISCOUNT_FLAT",    label: "Discount flat (VND)" },
  { value: "FIXED",            label: "Fixed price" },
];

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function calcTotal(
  items: BundleItem[],
  pricingMode: string,
  discount: number,
  finalPrice: number
): number {
  const sum = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  if (pricingMode === "FIXED")            return finalPrice;
  if (pricingMode === "DISCOUNT_PERCENT") return sum * (1 - discount / 100);
  if (pricingMode === "DISCOUNT_FLAT")    return Math.max(0, sum - discount);
  return sum;
}

export const BundleFormDialog = ({
  trigger,
  products,
  bundle,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCreated,
}: BundleFormDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open   = controlledOpen   ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!bundle;

  const [items, setItems] = useState<BundleItem[]>(
    bundle?.items.map((i) => ({
      productId: i.productId,
      quantity:  i.quantity,
      unitPrice: Number(i.unitPrice),
    })) ?? []
  );
  const [pricingMode, setPricingMode] = useState<"SUM" | "DISCOUNT_PERCENT" | "DISCOUNT_FLAT" | "FIXED">(bundle?.pricingMode ?? "SUM");
  const [discount,    setDiscount]    = useState(Number(bundle?.discount   ?? 0));
  const [finalPrice,  setFinalPrice]  = useState(Number(bundle?.finalPrice ?? 0));
  const [addProductId, setAddProductId] = useState(products[0]?.id ?? "");

  // Refs for Tab/Enter navigation between Qty ↔ Unit Price cells
  const qtyRefs   = useRef<(HTMLInputElement | null)[]>([]);
  const priceRefs = useRef<(HTMLInputElement | null)[]>([]);

  const availableToAdd = products.filter(
    (p) => p.status === "ACTIVE" && !items.find((i) => i.productId === p.id)
  );

  const addItem = (productId?: string) => {
    const id = productId ?? addProductId;
    if (!id) return;
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      { productId: product.id, quantity: 1, unitPrice: Number(product.unitPrice) },
    ]);
    const remaining = availableToAdd.filter((p) => p.id !== id);
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

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const total    = calcTotal(items, pricingMode, discount, finalPrice);

  const discountAmount =
    pricingMode === "DISCOUNT_PERCENT" ? subtotal * (discount / 100)
    : pricingMode === "DISCOUNT_FLAT"  ? Math.min(discount, subtotal)
    : 0;

  const handleQtyKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      priceRefs.current[idx]?.focus();
      priceRefs.current[idx]?.select();
    } else if (e.key === "Enter") {
      e.preventDefault();
      priceRefs.current[idx]?.focus();
      priceRefs.current[idx]?.select();
    }
  };

  const handlePriceKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (idx < items.length - 1) {
        qtyRefs.current[idx + 1]?.focus();
        qtyRefs.current[idx + 1]?.select();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      qtyRefs.current[idx]?.focus();
      qtyRefs.current[idx]?.select();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (idx < items.length - 1) {
        qtyRefs.current[idx + 1]?.focus();
        qtyRefs.current[idx + 1]?.select();
      }
    }
  };

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
      name:        formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      pricingMode: pricingMode as "SUM" | "DISCOUNT_PERCENT" | "DISCOUNT_FLAT" | "FIXED",
      discount:    pricingMode !== "SUM" && pricingMode !== "FIXED" ? discount   : undefined,
      finalPrice:  pricingMode === "FIXED"                          ? finalPrice  : undefined,
      items,
    };

    if (isEdit) executeUpdate({ id: bundle!.id, ...fields });
    else        executeCreate(fields);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setItems(
        bundle?.items.map((i) => ({
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: Number(i.unitPrice),
        })) ?? []
      );
      setPricingMode(bundle?.pricingMode ?? "SUM");
      setDiscount(Number(bundle?.discount   ?? 0));
      setFinalPrice(Number(bundle?.finalPrice ?? 0));
    }
  };

  const inputCls = cn(
    "w-full px-3 py-[9px] text-sm bg-transparent text-[#e5e5e5] tabular-nums",
    "focus:outline-none focus:bg-blue-500/10 focus:ring-1 focus:ring-inset focus:ring-blue-500/50"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit bundle" : "New bundle"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Name + pricing mode */}
          <div className="grid grid-cols-2 gap-3">
            <FormInput id="name" label="Bundle name" required defaultValue={bundle?.name} />
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#e5e5e5]">Pricing mode</Label>
              <select
                value={pricingMode}
                onChange={(e) => setPricingMode(e.target.value as "SUM" | "DISCOUNT_PERCENT" | "DISCOUNT_FLAT" | "FIXED")}
                className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
              >
                {PRICING_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <FormTextarea id="description" label="Description" defaultValue={bundle?.description ?? ""} />

          {/* ── Excel-style line items ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#e5e5e5]">Line items</Label>
              <span className="text-[11px] text-muted-foreground/60 select-none">
                Tab / Enter to move between cells
              </span>
            </div>

            <div className="rounded-md border border-[#333] overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#252525] text-xs text-muted-foreground border-b border-[#333]">
                    <th className="w-8 px-2 py-2 text-center border-r border-[#333] font-medium select-none">#</th>
                    <th className="px-3 py-2 text-left border-r border-[#333] font-medium">Product</th>
                    <th className="w-28 px-3 py-2 text-center border-r border-[#333] font-medium">Qty</th>
                    <th className="w-48 px-3 py-2 text-right border-r border-[#333] font-medium">
                      Unit Price (VND)
                    </th>
                    <th className="w-48 px-3 py-2 text-right border-r border-[#333] font-medium">
                      Subtotal
                      <span className="ml-1 text-[10px] text-muted-foreground/50 font-normal">= Qty × Price</span>
                    </th>
                    <th className="w-9" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2e2e2e]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-xs text-muted-foreground italic">
                        No products yet — use the selector below to add line items.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const product     = products.find((p) => p.id === item.productId);
                      const rowSubtotal = item.unitPrice * item.quantity;

                      return (
                        <tr key={item.productId} className="hover:bg-[#1e1e1e] group">
                          {/* # */}
                          <td className="w-8 px-2 py-0 text-center text-xs text-muted-foreground border-r border-[#2e2e2e] select-none">
                            {idx + 1}
                          </td>

                          {/* Product name */}
                          <td className="px-3 py-2 border-r border-[#2e2e2e]">
                            <span className="font-medium text-[#e5e5e5]">
                              {product?.name ?? "Unknown"}
                            </span>
                            {product?.unit && (
                              <span className="text-muted-foreground text-xs ml-1.5">/ {product.unit}</span>
                            )}
                          </td>

                          {/* Qty */}
                          <td className="w-28 p-0 border-r border-[#2e2e2e]">
                            <input
                              ref={(el) => { qtyRefs.current[idx] = el; }}
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.productId, "quantity", Math.max(1, Number(e.target.value)))
                              }
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => handleQtyKeyDown(e, idx)}
                              className={cn(inputCls, "text-center")}
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="w-48 p-0 border-r border-[#2e2e2e]">
                            <input
                              ref={(el) => { priceRefs.current[idx] = el; }}
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(item.productId, "unitPrice", Number(e.target.value))
                              }
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => handlePriceKeyDown(e, idx)}
                              className={cn(inputCls, "text-right")}
                            />
                          </td>

                          {/* Subtotal (read-only, calculated) */}
                          <td className="w-48 px-3 py-2 text-right border-r border-[#2e2e2e] text-violet-400 font-medium text-xs tabular-nums select-none">
                            {formatVnd(rowSubtotal)} ₫
                          </td>

                          {/* Delete */}
                          <td className="w-9 px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* ── Summary rows (tfoot) ── */}
                {items.length > 0 && (
                  <tfoot className="border-t border-[#333]">
                    {/* Subtotal row */}
                    <tr className="bg-[#1e1e1e]">
                      <td colSpan={4} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-[#2e2e2e]">
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium text-[#e5e5e5] border-r border-[#2e2e2e] tabular-nums">
                        {formatVnd(subtotal)} ₫
                      </td>
                      <td />
                    </tr>

                    {/* Discount % row */}
                    {pricingMode === "DISCOUNT_PERCENT" && (
                      <tr className="bg-[#1e1e1e]">
                        <td colSpan={3} className="px-4 py-1.5 text-right text-xs text-muted-foreground border-r border-[#2e2e2e]">
                          Discount (%)
                        </td>
                        <td className="px-3 py-1 border-r border-[#2e2e2e]">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={discount}
                              onChange={(e) => setDiscount(Number(e.target.value))}
                              className="w-16 text-sm px-2 py-1 text-right rounded border border-[#333] bg-[#252525] text-[#e5e5e5] focus:outline-none focus:border-blue-500 tabular-nums"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs font-medium text-red-400 border-r border-[#2e2e2e] tabular-nums">
                          −{formatVnd(Math.round(discountAmount))} ₫
                        </td>
                        <td />
                      </tr>
                    )}

                    {/* Discount flat row */}
                    {pricingMode === "DISCOUNT_FLAT" && (
                      <tr className="bg-[#1e1e1e]">
                        <td colSpan={3} className="px-4 py-1.5 text-right text-xs text-muted-foreground border-r border-[#2e2e2e]">
                          Discount (VND)
                        </td>
                        <td className="px-3 py-1 border-r border-[#2e2e2e]">
                          <input
                            type="number"
                            min={0}
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-full text-sm px-2 py-1 text-right rounded border border-[#333] bg-[#252525] text-[#e5e5e5] focus:outline-none focus:border-blue-500 tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs font-medium text-red-400 border-r border-[#2e2e2e] tabular-nums">
                          −{formatVnd(Math.min(discount, subtotal))} ₫
                        </td>
                        <td />
                      </tr>
                    )}

                    {/* Fixed price row */}
                    {pricingMode === "FIXED" && (
                      <tr className="bg-[#1e1e1e]">
                        <td colSpan={3} className="px-4 py-1.5 text-right text-xs text-muted-foreground border-r border-[#2e2e2e]">
                          Fixed price
                        </td>
                        <td className="px-3 py-1 border-r border-[#2e2e2e]">
                          <input
                            type="number"
                            min={0}
                            value={finalPrice}
                            onChange={(e) => setFinalPrice(Number(e.target.value))}
                            className="w-full text-sm px-2 py-1 text-right rounded border border-[#333] bg-[#252525] text-[#e5e5e5] focus:outline-none focus:border-blue-500 tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs font-medium text-orange-400 border-r border-[#2e2e2e] tabular-nums">
                          {formatVnd(finalPrice)} ₫
                        </td>
                        <td />
                      </tr>
                    )}

                    {/* Total row */}
                    <tr className="bg-violet-600/10 border-t border-violet-600/20">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-[#e5e5e5] border-r border-violet-600/20">
                        Total
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-bold text-violet-400 border-r border-violet-600/20 tabular-nums">
                        {formatVnd(Math.round(total))} ₫
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Add product row */}
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
                <Button type="button" size="sm" variant="outline" onClick={() => addItem()}>
                  <Plus className="h-4 w-4 mr-1" /> Add row
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create bundle"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
