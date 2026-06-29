"use client";

import { useState, useRef, type ElementRef, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Search, Check } from "lucide-react";
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
import { useAction } from "@/hooks/use-action";
import { createBundle } from "@/actions/create-bundle";
import { updateBundle } from "@/actions/update-bundle";
import { cn } from "@/lib/utils";

// lineId is a client-only stable key; productId can repeat across rows
type BundleItem = { lineId: string; productId: string; quantity: number; unitPrice: number };
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
  const open    = controlledOpen          ?? internalOpen;
  const setOpen = controlledOnOpenChange  ?? setInternalOpen;
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit   = !!bundle;

  const [items, setItems] = useState<BundleItem[]>(
    bundle?.items.map((i) => ({
      lineId:    i.id,
      productId: i.productId,
      quantity:  i.quantity,
      unitPrice: Number(i.unitPrice),
    })) ?? []
  );
  const [pricingMode, setPricingMode] = useState<"SUM" | "DISCOUNT_PERCENT" | "DISCOUNT_FLAT" | "FIXED">(
    bundle?.pricingMode ?? "SUM"
  );
  const [discount,   setDiscount]   = useState(Number(bundle?.discount   ?? 0));
  const [finalPrice, setFinalPrice] = useState(Number(bundle?.finalPrice ?? 0));

  // Product picker
  const [pickerSearch,   setPickerSearch]   = useState("");
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());

  // Refs for Tab/Enter navigation between Qty ↔ Unit Price
  const qtyRefs   = useRef<(HTMLInputElement | null)[]>([]);
  const priceRefs = useRef<(HTMLInputElement | null)[]>([]);

  const availableToAdd  = products.filter((p) => p.status === "ACTIVE");
  const pickerFiltered  = availableToAdd.filter((p) =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const togglePicker = (id: string) =>
    setPickerSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addSelectedItems = () => {
    const newRows: BundleItem[] = [];
    pickerSelected.forEach((productId) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      newRows.push({
        lineId:    crypto.randomUUID(),
        productId: product.id,
        quantity:  1,
        unitPrice: Number(product.unitPrice),
      });
    });
    setItems((prev) => [...prev, ...newRows]);
    setPickerSelected(new Set());
    setPickerSearch("");
  };

  const removeItem = (lineId: string) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const updateItem = (lineId: string, field: "quantity" | "unitPrice", value: number) =>
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, [field]: value } : i))
    );

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const total    = calcTotal(items, pricingMode, discount, finalPrice);
  const discountAmount =
    pricingMode === "DISCOUNT_PERCENT" ? subtotal * (discount / 100)
    : pricingMode === "DISCOUNT_FLAT"  ? Math.min(discount, subtotal)
    : 0;

  const handleQtyKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if ((e.key === "Tab" && !e.shiftKey) || e.key === "Enter") {
      e.preventDefault();
      priceRefs.current[idx]?.focus();
      priceRefs.current[idx]?.select();
    }
  };

  const handlePriceKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      qtyRefs.current[idx]?.focus();
      qtyRefs.current[idx]?.select();
    } else if ((e.key === "Tab" && !e.shiftKey) || e.key === "Enter") {
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
      pricingMode,
      discount:    pricingMode !== "SUM" && pricingMode !== "FIXED" ? discount    : undefined,
      finalPrice:  pricingMode === "FIXED"                          ? finalPrice   : undefined,
      items: items.map(({ lineId: _l, ...rest }) => rest),
    };
    if (isEdit) executeUpdate({ id: bundle!.id, ...fields });
    else        executeCreate(fields);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setItems(
        bundle?.items.map((i) => ({
          lineId:    i.id,
          productId: i.productId,
          quantity:  i.quantity,
          unitPrice: Number(i.unitPrice),
        })) ?? []
      );
      setPricingMode(bundle?.pricingMode ?? "SUM");
      setDiscount(Number(bundle?.discount   ?? 0));
      setFinalPrice(Number(bundle?.finalPrice ?? 0));
      setPickerSearch("");
      setPickerSelected(new Set());
    }
  };

  // Cell input: no ring on a border-collapsed table (prevents bleed into neighbours)
  // Instead we use a background shift + subtle left border as focus indicator.
  const cellInput = cn(
    "w-full h-full px-3 py-2.5 text-sm bg-transparent text-[#e5e5e5] tabular-nums",
    "focus:outline-none focus:bg-blue-500/[0.08] transition-colors"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      {/* wider + taller — use 90vw cap with explicit max */}
      <DialogContent className="w-[min(90vw,1100px)] max-w-none p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-[#2e2e2e]">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "Edit bundle" : "New bundle"}
          </DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto max-h-[calc(90vh-130px)] px-7 py-6 space-y-6">
          <form id="bundle-form" action={onSubmit} className="space-y-6">

            {/* Row 1: name + pricing mode */}
            <div className="grid grid-cols-2 gap-5">
              <FormInput id="name" label="Bundle name" required defaultValue={bundle?.name} />
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#e5e5e5]">Pricing mode</Label>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value as typeof pricingMode)}
                  className="w-full text-sm px-3 py-2 h-9 border rounded-md bg-[#2a2a2a] border-[#3a3a3a] text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                >
                  {PRICING_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: description */}
            <FormTextarea id="description" label="Description" defaultValue={bundle?.description ?? ""} />

            {/* ── Line items table ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#e5e5e5]">Line items</Label>
                <span className="text-[11px] text-muted-foreground/50 select-none">
                  Tab / Enter moves between cells
                </span>
              </div>

              {/* wrapper: rounded-md + overflow-hidden clips cell highlights to the border radius */}
              <div className="rounded-lg border border-[#2e2e2e] overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#222] text-xs text-muted-foreground border-b border-[#2e2e2e]">
                      <th className="w-9 px-3 py-2.5 text-center border-r border-[#2e2e2e] font-medium select-none">#</th>
                      <th className="px-4 py-2.5 text-left border-r border-[#2e2e2e] font-medium">Product</th>
                      <th className="w-28 px-4 py-2.5 text-center border-r border-[#2e2e2e] font-medium">Qty</th>
                      <th className="w-52 px-4 py-2.5 text-right border-r border-[#2e2e2e] font-medium">
                        Unit Price (VND)
                      </th>
                      <th className="w-52 px-4 py-2.5 text-right border-r border-[#2e2e2e] font-medium">
                        Subtotal
                        <span className="ml-1 text-[10px] text-muted-foreground/40 font-normal">= Qty × Price</span>
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#262626]">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                          No products yet — select some from the picker below.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const product     = products.find((p) => p.id === item.productId);
                        const rowSubtotal = item.unitPrice * item.quantity;
                        return (
                          <tr key={item.lineId} className="hover:bg-[#1c1c1c] group">
                            {/* # */}
                            <td className="w-9 px-3 text-center text-xs text-muted-foreground/60 border-r border-[#262626] select-none">
                              {idx + 1}
                            </td>

                            {/* Product */}
                            <td className="px-4 py-2.5 border-r border-[#262626]">
                              <span className="font-medium text-[#e5e5e5]">
                                {product?.name ?? "Unknown"}
                              </span>
                              {product?.unit && (
                                <span className="text-muted-foreground text-xs ml-2">/ {product.unit}</span>
                              )}
                            </td>

                            {/* Qty — overflow-hidden keeps focus bg inside cell */}
                            <td className="w-28 p-0 border-r border-[#262626] overflow-hidden">
                              <input
                                ref={(el) => { qtyRefs.current[idx] = el; }}
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(item.lineId, "quantity", Math.max(1, Number(e.target.value)))
                                }
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleQtyKeyDown(e, idx)}
                                className={cn(cellInput, "text-center py-2.5")}
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="w-52 p-0 border-r border-[#262626] overflow-hidden">
                              <input
                                ref={(el) => { priceRefs.current[idx] = el; }}
                                type="number"
                                min={0}
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(item.lineId, "unitPrice", Number(e.target.value))
                                }
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handlePriceKeyDown(e, idx)}
                                className={cn(cellInput, "text-right py-2.5")}
                              />
                            </td>

                            {/* Subtotal */}
                            <td className="w-52 px-4 py-2.5 text-right border-r border-[#262626] text-violet-400 font-medium text-xs tabular-nums select-none">
                              {formatVnd(rowSubtotal)} ₫
                            </td>

                            {/* Delete */}
                            <td className="w-10 px-2 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(item.lineId)}
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

                  {/* ── Summary tfoot ── */}
                  {items.length > 0 && (
                    <tfoot className="border-t border-[#2e2e2e]">
                      {/* Subtotal */}
                      <tr className="bg-[#1c1c1c]">
                        <td colSpan={4} className="px-4 py-2.5 text-right text-xs text-muted-foreground border-r border-[#262626]">
                          Subtotal
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-medium text-[#e5e5e5] border-r border-[#262626] tabular-nums">
                          {formatVnd(subtotal)} ₫
                        </td>
                        <td />
                      </tr>

                      {/* Discount % */}
                      {pricingMode === "DISCOUNT_PERCENT" && (
                        <tr className="bg-[#1c1c1c]">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-[#262626]">
                            Discount (%)
                          </td>
                          <td className="px-3 py-1.5 border-r border-[#262626]">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number" min={0} max={100}
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="w-16 text-sm px-2 py-1 text-right rounded-md border border-[#333] bg-[#252525] text-[#e5e5e5] focus:outline-none focus:border-blue-500 tabular-nums"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-red-400 border-r border-[#262626] tabular-nums">
                            −{formatVnd(Math.round(discountAmount))} ₫
                          </td>
                          <td />
                        </tr>
                      )}

                      {/* Discount flat */}
                      {pricingMode === "DISCOUNT_FLAT" && (
                        <tr className="bg-[#1c1c1c]">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-[#262626]">
                            Discount (VND)
                          </td>
                          <td className="px-3 py-1.5 border-r border-[#262626]">
                            <input
                              type="number" min={0}
                              value={discount}
                              onChange={(e) => setDiscount(Number(e.target.value))}
                              className="w-full text-sm px-2 py-1 text-right rounded-md border border-[#333] bg-[#252525] text-[#e5e5e5] focus:outline-none focus:border-blue-500 tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-red-400 border-r border-[#262626] tabular-nums">
                            −{formatVnd(Math.min(discount, subtotal))} ₫
                          </td>
                          <td />
                        </tr>
                      )}

                      {/* Fixed price */}
                      {pricingMode === "FIXED" && (
                        <tr className="bg-[#1c1c1c]">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-[#262626]">
                            Fixed price
                          </td>
                          <td className="px-3 py-1.5 border-r border-[#262626]">
                            <input
                              type="number" min={0}
                              value={finalPrice}
                              onChange={(e) => setFinalPrice(Number(e.target.value))}
                              className="w-full text-sm px-2 py-1 text-right rounded-md border border-[#333] bg-[#252525] text-[#e5e5e5] focus:outline-none focus:border-blue-500 tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-orange-400 border-r border-[#262626] tabular-nums">
                            {formatVnd(finalPrice)} ₫
                          </td>
                          <td />
                        </tr>
                      )}

                      {/* Total */}
                      <tr className="bg-violet-950/40 border-t border-violet-800/20">
                        <td colSpan={4} className="px-4 py-3.5 text-right text-sm font-semibold text-[#e5e5e5] border-r border-violet-800/20">
                          Total
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-bold text-violet-400 border-r border-violet-800/20 tabular-nums">
                          {formatVnd(Math.round(total))} ₫
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ── Product picker ── */}
            {availableToAdd.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#e5e5e5]">Add products</Label>

                <div className="rounded-lg border border-[#2e2e2e] overflow-hidden">
                  {/* Search */}
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#222] border-b border-[#2e2e2e]">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search products…"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent text-[#e5e5e5] focus:outline-none placeholder:text-muted-foreground/40"
                    />
                    {pickerSelected.size > 0 && (
                      <span className="text-xs font-medium text-violet-400 shrink-0 tabular-nums">
                        {pickerSelected.size} selected
                      </span>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-48 overflow-y-auto">
                    {pickerFiltered.length === 0 ? (
                      <p className="px-4 py-5 text-xs text-muted-foreground text-center italic">
                        No products found.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#262626]">
                        {pickerFiltered.map((product) => {
                          const checked = pickerSelected.has(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => togglePicker(product.id)}
                              className={cn(
                                "w-full flex items-center gap-3.5 px-4 py-2.5 text-left transition-colors",
                                checked
                                  ? "bg-violet-600/10 hover:bg-violet-600/[0.14]"
                                  : "hover:bg-[#222]"
                              )}
                            >
                              {/* Custom checkbox */}
                              <div className={cn(
                                "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                                checked ? "bg-violet-600 border-violet-600" : "border-[#555]"
                              )}>
                                {checked && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>

                              {/* Name */}
                              <span className="flex-1 text-sm text-[#e5e5e5] truncate">
                                {product.name}
                              </span>

                              {/* Unit badge */}
                              <span className="text-[11px] text-muted-foreground/70 bg-[#2a2a2a] px-1.5 py-0.5 rounded shrink-0">
                                {product.unit}
                              </span>

                              {/* Price */}
                              <span className="text-xs text-violet-400 tabular-nums shrink-0 min-w-[90px] text-right">
                                {formatVnd(Number(product.unitPrice))} ₫
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#222] border-t border-[#2e2e2e]">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setPickerSelected(new Set(pickerFiltered.map((p) => p.id)))}
                        className="hover:text-[#e5e5e5] transition-colors"
                      >
                        Select all
                      </button>
                      {pickerSelected.size > 0 && (
                        <>
                          <span className="opacity-30">·</span>
                          <button
                            type="button"
                            onClick={() => setPickerSelected(new Set())}
                            className="hover:text-[#e5e5e5] transition-colors"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      disabled={pickerSelected.size === 0}
                      onClick={addSelectedItems}
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add{pickerSelected.size > 0 ? ` ${pickerSelected.size}` : ""} row{pickerSelected.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* ── Sticky footer with save button ── */}
        <div className="px-7 py-4 border-t border-[#2e2e2e] flex justify-end bg-[#161616]">
          <Button type="submit" form="bundle-form" size="sm">
            {isEdit ? "Save changes" : "Create bundle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
