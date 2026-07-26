"use client";

import { useState, useRef, type ElementRef, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Search, Check, Layers } from "lucide-react";
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

// lineId is a client-only stable key
type BundleItem = {
  lineId: string;
  productId?: string;
  childBundleId?: string;
  quantity: number;
  unitPrice: number;
};

export type BundleWithItems = ProductBundle & {
  items: (ProductBundleItem & { product: Product | null; childBundle: ProductBundle | null })[];
  _count: { companies: number };
};

type BundleFormDialogProps = {
  trigger?: React.ReactNode;
  products: Product[];
  bundles?: BundleWithItems[];
  bundle?: BundleWithItems;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onCreated?: (bundle: { id: string; name: string }) => void;
  onUpdated?: (bundle: BundleWithItems) => void;
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

function calcBundleTotal(b: BundleWithItems): number {
  const sum = b.items.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0);
  if (b.pricingMode === "FIXED")            return Number(b.finalPrice ?? 0);
  if (b.pricingMode === "DISCOUNT_PERCENT") return sum * (1 - Number(b.discount ?? 0) / 100);
  if (b.pricingMode === "DISCOUNT_FLAT")    return Math.max(0, sum - Number(b.discount ?? 0));
  return sum;
}

function itemsFromBundle(bundle: BundleWithItems): BundleItem[] {
  return bundle.items.map((i) => ({
    lineId:        i.id,
    productId:     i.productId     ?? undefined,
    childBundleId: i.childBundleId ?? undefined,
    quantity:      i.quantity,
    unitPrice:     Number(i.unitPrice),
  }));
}

export const BundleFormDialog = ({
  trigger,
  products,
  bundles,
  bundle,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCreated,
  onUpdated,
}: BundleFormDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open    = controlledOpen         ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit   = !!bundle;

  const [items, setItems] = useState<BundleItem[]>(bundle ? itemsFromBundle(bundle) : []);
  const [pricingMode, setPricingMode] = useState<"SUM" | "DISCOUNT_PERCENT" | "DISCOUNT_FLAT" | "FIXED">(
    bundle?.pricingMode ?? "SUM"
  );
  const [discount,   setDiscount]   = useState(Number(bundle?.discount   ?? 0));
  const [finalPrice, setFinalPrice] = useState(Number(bundle?.finalPrice ?? 0));

  // Product picker
  const [pickerSearch,   setPickerSearch]   = useState("");
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());

  // Bundle picker
  const [bundleSearch,   setBundleSearch]   = useState("");
  const [bundleSelected, setBundleSelected] = useState<Set<string>>(new Set());

  // Refs for Tab/Enter navigation
  const qtyRefs   = useRef<(HTMLInputElement | null)[]>([]);
  const priceRefs = useRef<(HTMLInputElement | null)[]>([]);

  const availableToAdd    = products.filter((p) => p.status === "ACTIVE");
  const availableBundles  = (bundles ?? []).filter((b) => b.id !== bundle?.id);

  const pickerFiltered  = availableToAdd.filter((p) =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(pickerSearch.toLowerCase())
  );
  const bundlesFiltered = availableBundles.filter((b) =>
    b.name.toLowerCase().includes(bundleSearch.toLowerCase())
  );

  const togglePicker = (id: string) =>
    setPickerSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleBundlePicker = (id: string) =>
    setBundleSelected((prev) => {
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

  const addSelectedBundles = () => {
    const newRows: BundleItem[] = [];
    bundleSelected.forEach((childBundleId) => {
      const b = availableBundles.find((b) => b.id === childBundleId);
      if (!b) return;
      newRows.push({
        lineId:        crypto.randomUUID(),
        childBundleId: b.id,
        quantity:      1,
        unitPrice:     Math.round(calcBundleTotal(b)),
      });
    });
    setItems((prev) => [...prev, ...newRows]);
    setBundleSelected(new Set());
    setBundleSearch("");
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
    skipRefresh: true,
    onSuccess: (data) => {
      toast.success("Bundle updated.");
      if (onUpdated) {
        const rebuilt: BundleWithItems = {
          ...data,
          items: items.map(({ lineId, productId, childBundleId, quantity, unitPrice }) => ({
            id:            lineId,
            bundleId:      data.id,
            productId:     productId     ?? null,
            childBundleId: childBundleId ?? null,
            quantity,
            unitPrice:     unitPrice as unknown as ProductBundleItem["unitPrice"],
            active:        true,
            createdAt:     new Date(),
            updatedAt:     new Date(),
            product:       productId     ? (products.find((p) => p.id === productId)            ?? null) : null,
            childBundle:   childBundleId ? (availableBundles.find((b) => b.id === childBundleId) ?? null) : null,
          })),
          _count: bundle!._count,
        };
        onUpdated(rebuilt);
      }
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const onSubmit = (formData: FormData) => {
    if (items.length === 0) { toast.error("Add at least one product or bundle."); return; }
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
      setItems(bundle ? itemsFromBundle(bundle) : []);
      setPricingMode(bundle?.pricingMode ?? "SUM");
      setDiscount(Number(bundle?.discount   ?? 0));
      setFinalPrice(Number(bundle?.finalPrice ?? 0));
      setPickerSearch("");
      setPickerSelected(new Set());
      setBundleSearch("");
      setBundleSelected(new Set());
    }
  };

  const cellInput = cn(
    "w-full h-full px-3 py-2.5 text-sm bg-transparent text-foreground tabular-nums",
    "focus:outline-none focus:bg-primary/[0.08] transition-colors"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="w-[min(90vw,1100px)] max-w-none p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-border">
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
                <Label className="text-xs font-semibold text-foreground">Pricing mode</Label>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value as typeof pricingMode)}
                  className="w-full text-sm px-3 py-2 h-9 border rounded-md bg-secondary border-border text-foreground focus:outline-none focus:border-primary"
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
                <Label className="text-xs font-semibold text-foreground">Line items</Label>
                <span className="text-[11px] text-muted-foreground/50 select-none">
                  Tab / Enter moves between cells
                </span>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted text-xs text-muted-foreground border-b border-border">
                      <th className="w-9 px-3 py-2.5 text-center border-r border-border font-medium select-none">#</th>
                      <th className="px-4 py-2.5 text-left border-r border-border font-medium">Item</th>
                      <th className="w-28 px-4 py-2.5 text-center border-r border-border font-medium">Qty</th>
                      <th className="w-52 px-4 py-2.5 text-right border-r border-border font-medium">
                        Unit Price (VND)
                      </th>
                      <th className="w-52 px-4 py-2.5 text-right border-r border-border font-medium">
                        Subtotal
                        <span className="ml-1 text-[10px] text-muted-foreground/40 font-normal">= Qty × Price</span>
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                          No items yet — add products or bundles below.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const product         = products.find((p) => p.id === item.productId);
                        const childBundleInfo = availableBundles.find((b) => b.id === item.childBundleId);
                        const isBundle        = !!item.childBundleId;
                        const displayName     = product?.name ?? childBundleInfo?.name ?? "Unknown";
                        const rowSubtotal     = item.unitPrice * item.quantity;

                        return (
                          <tr key={item.lineId} className="hover:bg-muted/40 group">
                            {/* # */}
                            <td className="w-9 px-3 text-center text-xs text-muted-foreground/60 border-r border-border select-none">
                              {idx + 1}
                            </td>

                            {/* Item name */}
                            <td className="px-4 py-2.5 border-r border-border">
                              <div className="flex items-center gap-2">
                                {isBundle && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0">
                                    <Layers className="h-2.5 w-2.5" />
                                    BUNDLE
                                  </span>
                                )}
                                <span className="font-medium text-foreground">{displayName}</span>
                                {!isBundle && product?.unit && (
                                  <span className="text-muted-foreground text-xs">/ {product.unit}</span>
                                )}
                              </div>
                            </td>

                            {/* Qty */}
                            <td className="w-28 p-0 border-r border-border overflow-hidden">
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
                            <td className="w-52 p-0 border-r border-border overflow-hidden">
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
                            <td className="w-52 px-4 py-2.5 text-right border-r border-border text-primary font-medium text-xs tabular-nums select-none">
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
                    <tfoot className="border-t border-border">
                      {/* Subtotal */}
                      <tr className="bg-muted/40">
                        <td colSpan={4} className="px-4 py-2.5 text-right text-xs text-muted-foreground border-r border-border">
                          Subtotal
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-medium text-foreground border-r border-border tabular-nums">
                          {formatVnd(subtotal)} ₫
                        </td>
                        <td />
                      </tr>

                      {/* Discount % */}
                      {pricingMode === "DISCOUNT_PERCENT" && (
                        <tr className="bg-muted/40">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-border">
                            Discount (%)
                          </td>
                          <td className="px-3 py-1.5 border-r border-border">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number" min={0} max={100}
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="w-16 text-sm px-2 py-1 text-right rounded-md border border-border bg-secondary text-foreground focus:outline-none focus:border-primary tabular-nums"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-red-400 border-r border-border tabular-nums">
                            −{formatVnd(Math.round(discountAmount))} ₫
                          </td>
                          <td />
                        </tr>
                      )}

                      {/* Discount flat */}
                      {pricingMode === "DISCOUNT_FLAT" && (
                        <tr className="bg-muted/40">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-border">
                            Discount (VND)
                          </td>
                          <td className="px-3 py-1.5 border-r border-border">
                            <input
                              type="number" min={0}
                              value={discount}
                              onChange={(e) => setDiscount(Number(e.target.value))}
                              className="w-full text-sm px-2 py-1 text-right rounded-md border border-border bg-secondary text-foreground focus:outline-none focus:border-primary tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-red-400 border-r border-border tabular-nums">
                            −{formatVnd(Math.min(discount, subtotal))} ₫
                          </td>
                          <td />
                        </tr>
                      )}

                      {/* Fixed price */}
                      {pricingMode === "FIXED" && (
                        <tr className="bg-muted/40">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs text-muted-foreground border-r border-border">
                            Fixed price
                          </td>
                          <td className="px-3 py-1.5 border-r border-border">
                            <input
                              type="number" min={0}
                              value={finalPrice}
                              onChange={(e) => setFinalPrice(Number(e.target.value))}
                              className="w-full text-sm px-2 py-1 text-right rounded-md border border-border bg-secondary text-foreground focus:outline-none focus:border-primary tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-orange-400 border-r border-border tabular-nums">
                            {formatVnd(finalPrice)} ₫
                          </td>
                          <td />
                        </tr>
                      )}

                      {/* Total */}
                      <tr className="bg-primary/10 border-t border-primary/20">
                        <td colSpan={4} className="px-4 py-3.5 text-right text-sm font-semibold text-foreground border-r border-primary/20">
                          Total
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-bold text-primary border-r border-primary/20 tabular-nums">
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
                <Label className="text-xs font-semibold text-foreground">Add products</Label>

                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted border-b border-border">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search products…"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                    />
                    {pickerSelected.size > 0 && (
                      <span className="text-xs font-medium text-primary shrink-0 tabular-nums">
                        {pickerSelected.size} selected
                      </span>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {pickerFiltered.length === 0 ? (
                      <p className="px-4 py-5 text-xs text-muted-foreground text-center italic">
                        No products found.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
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
                                  ? "bg-primary/10 hover:bg-primary/[0.14]"
                                  : "hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                                checked ? "bg-primary border-primary" : "border-input"
                              )}>
                                {checked && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className="flex-1 text-sm text-foreground truncate">
                                {product.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70 bg-secondary px-1.5 py-0.5 rounded shrink-0">
                                {product.unit}
                              </span>
                              <span className="text-xs text-primary tabular-nums shrink-0 min-w-[90px] text-right">
                                {formatVnd(Number(product.unitPrice))} ₫
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setPickerSelected(new Set(pickerFiltered.map((p) => p.id)))}
                        className="hover:text-foreground transition-colors"
                      >
                        Select all
                      </button>
                      {pickerSelected.size > 0 && (
                        <>
                          <span className="opacity-30">·</span>
                          <button
                            type="button"
                            onClick={() => setPickerSelected(new Set())}
                            className="hover:text-foreground transition-colors"
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

            {/* ── Bundle picker ── */}
            {availableBundles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Add bundles</Label>
                <p className="text-[11px] text-muted-foreground/60">
                  Nest another bundle as a line item. Unit price defaults to the bundle total and can be overridden.
                </p>

                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted border-b border-border">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search bundles…"
                      value={bundleSearch}
                      onChange={(e) => setBundleSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                    />
                    {bundleSelected.size > 0 && (
                      <span className="text-xs font-medium text-primary shrink-0 tabular-nums">
                        {bundleSelected.size} selected
                      </span>
                    )}
                  </div>

                  <div className="max-h-40 overflow-y-auto divide-y divide-border">
                    {bundlesFiltered.length === 0 ? (
                      <p className="px-4 py-5 text-xs text-muted-foreground text-center italic">
                        No bundles found.
                      </p>
                    ) : (
                      bundlesFiltered.map((b) => {
                        const checked = bundleSelected.has(b.id);
                        const bTotal  = Math.round(calcBundleTotal(b));
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => toggleBundlePicker(b.id)}
                            className={cn(
                              "w-full flex items-center gap-3.5 px-4 py-2.5 text-left transition-colors",
                              checked ? "bg-primary/10 hover:bg-primary/[0.14]" : "hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                              checked ? "bg-primary border-primary" : "border-input"
                            )}>
                              {checked && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <Layers className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                            <span className="flex-1 text-sm text-foreground truncate">{b.name}</span>
                            <span className="text-xs text-primary tabular-nums shrink-0 min-w-[90px] text-right">
                              {formatVnd(bTotal)} ₫
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center justify-end px-4 py-2.5 bg-muted border-t border-border">
                    <Button
                      type="button"
                      size="sm"
                      disabled={bundleSelected.size === 0}
                      onClick={addSelectedBundles}
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add{bundleSelected.size > 0 ? ` ${bundleSelected.size}` : ""} bundle{bundleSelected.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* ── Sticky footer ── */}
        <div className="px-7 py-4 border-t border-border flex justify-end bg-background">
          <Button type="submit" form="bundle-form" size="sm">
            {isEdit ? "Save changes" : "Create bundle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
