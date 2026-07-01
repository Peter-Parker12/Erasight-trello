"use client";

import { useState, useCallback, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import type { Company, Product } from "@prisma/client";
import type { EnrichmentPayload } from "@/lib/enrichment/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { CustomFieldsFields } from "@/components/crm/custom-fields-fields";
import { useAction } from "@/hooks/use-action";
import { createCompany } from "@/actions/create-company";
import { updateCompany } from "@/actions/update-company";
import { extractCustomFieldsFromFormData } from "@/lib/custom-fields-form";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { BundleFormDialog } from "../../products/_components/bundle-form-dialog";

type BundleOption = { id: string; name: string };

type CompanyRow = Company & { bundles: { bundleId: string }[] };

type CompanyFormDialogProps = {
  trigger: React.ReactNode;
  definitions: CustomFieldDefinitionDTO[];
  company?: Company & { bundles?: { bundleId: string }[] };
  allBundles?: BundleOption[];
  onCreated?: (company: CompanyRow) => void;
  onUpdated?: (company: CompanyRow) => void;
};

async function syncBundles(companyId: string, selectedIds: string[], previousIds: string[]) {
  const toAdd = selectedIds.filter((id) => !previousIds.includes(id));
  const toRemove = previousIds.filter((id) => !selectedIds.includes(id));

  await Promise.all([
    ...toAdd.map((bundleId) =>
      fetch("/api/actions/assign-company-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, bundleId, assign: true }),
      })
    ),
    ...toRemove.map((bundleId) =>
      fetch("/api/actions/assign-company-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, bundleId, assign: false }),
      })
    ),
  ]);
}

export const CompanyFormDialog = ({ trigger, definitions, company, allBundles = [], onCreated, onUpdated }: CompanyFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);
  const isEdit = !!company;

  // Refs for fields that can be auto-filled from the scraped website data.
  const nameRef = useRef<HTMLInputElement>(null);
  const domainRef = useRef<HTMLInputElement>(null);
  const industryRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const currentBundleIds = company?.bundles?.map((b) => b.bundleId) ?? [];
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>(currentBundleIds);
  const [localBundles, setLocalBundles] = useState<BundleOption[]>(allBundles);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [newBundleOpen, setNewBundleOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (products !== null) return;
    try {
      const res = await fetch("/api/crm/products");
      if (res.ok) setProducts(await res.json());
    } catch {
      setProducts([]);
    }
  }, [products]);

  const toggleBundle = (id: string) =>
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );

  // Applies scraped data into empty inputs. Only fills a field if the input is
  // currently blank — never overwrites something the user already typed.
  const applyEnrichmentData = useCallback(
    (data: EnrichmentPayload, sourceDomain: string) => {
      let filled = 0;

      const tryFill = (ref: React.RefObject<HTMLInputElement | null>, value: string | undefined) => {
        if (ref.current && !ref.current.value.trim() && value?.trim()) {
          ref.current.value = value.trim();
          filled++;
        }
      };

      tryFill(nameRef, data.name);
      tryFill(industryRef, data.industry);
      tryFill(addressRef, data.address);
      tryFill(phoneRef, data.phone);

      // Email has no Company field — surface it separately so user can copy it
      if (data.email && filled === 0) {
        toast.info(`Found email: ${data.email}`);
      } else if (data.email) {
        toast.success(`Auto-filled ${filled} field${filled > 1 ? "s" : ""} from website · Email found: ${data.email}`);
      } else if (filled > 0) {
        toast.success(`Auto-filled ${filled} field${filled > 1 ? "s" : ""} from website`);
      }
    },
    []
  );

  const runEnrichment = useCallback(
    async (domain: string) => {
      if (enriching) return;
      setEnriching(true);
      try {
        const res = await fetch(
          `/api/enrichment/preview?domain=${encodeURIComponent(domain)}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data?: EnrichmentPayload };
        if (json.data) applyEnrichmentData(json.data, domain);
      } catch {
        // enrichment errors are silent — form still works normally
      } finally {
        setEnriching(false);
      }
    },
    [enriching, applyEnrichmentData]
  );

  // Triggered when the user leaves the Website field.
  const onWebsiteBlur = useCallback(async () => {
    const raw = (document.getElementById("website") as HTMLInputElement | null)?.value?.trim();
    if (!raw) return;
    try {
      const domain = new URL(raw).hostname.replace(/^www\./, "");
      if (domain) await runEnrichment(domain);
    } catch {
      // not a valid URL yet — do nothing
    }
  }, [runEnrichment]);

  // Triggered when the user leaves the Domain field directly.
  const onDomainBlur = useCallback(async () => {
    const raw = domainRef.current?.value?.trim();
    if (!raw) return;
    await runEnrichment(raw.replace(/^www\./, ""));
  }, [runEnrichment]);

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) fetchProducts();
    if (!v) {
      setSelectedBundleIds(currentBundleIds);
      setLocalBundles(allBundles);
    }
  };

  const { execute: executeCreate, fieldErrors: createErrors } = useAction(createCompany, {
    skipRefresh: true,
    onSuccess: async (data) => {
      if (selectedBundleIds.length > 0) {
        await syncBundles(data.id, selectedBundleIds, []);
      }
      onCreated?.({ ...data, bundles: selectedBundleIds.map(id => ({ bundleId: id })) });
      toast.success("Company created.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, fieldErrors: updateErrors } = useAction(updateCompany, {
    skipRefresh: true,
    onSuccess: async (data) => {
      await syncBundles(data.id, selectedBundleIds, currentBundleIds);
      onUpdated?.({ ...data, bundles: selectedBundleIds.map(id => ({ bundleId: id })) });
      toast.success("Company updated.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const fieldErrors = isEdit ? updateErrors : createErrors;

  const onSubmit = (formData: FormData) => {
    const fields = {
      name: formData.get("name") as string,
      domain: (formData.get("domain") as string) || undefined,
      industry: (formData.get("industry") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      customFields: extractCustomFieldsFromFormData(formData, definitions),
    };

    if (isEdit) {
      executeUpdate({ id: company!.id, ...fields });
    } else {
      executeCreate(fields);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit company" : "New company"}</DialogTitle>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        <form action={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <FormInput
            ref={nameRef}
            id="name"
            label="Name"
            required
            defaultValue={company?.name}
            errors={fieldErrors}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              ref={domainRef}
              id="domain"
              label="Domain"
              defaultValue={company?.domain ?? ""}
              errors={fieldErrors}
              onBlur={onDomainBlur}
            />
            <FormInput
              ref={industryRef}
              id="industry"
              label="Industry"
              defaultValue={company?.industry ?? ""}
              errors={fieldErrors}
            />
            <FormInput
              ref={phoneRef}
              id="phone"
              label="Phone"
              placeholder="+84 123 456 789"
              defaultValue={company?.phone ?? ""}
              errors={fieldErrors}
            />
            <div className="relative">
              <FormInput
                id="website"
                label="Website"
                placeholder="https://example.com"
                defaultValue={company?.website ?? ""}
                errors={fieldErrors}
                onBlur={onWebsiteBlur}
              />
              {enriching && (
                <div className="absolute right-2 top-6 flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Fetching info…</span>
                </div>
              )}
            </div>
          </div>

          <FormInput
            ref={addressRef}
            id="address"
            label="Address"
            defaultValue={company?.address ?? ""}
            errors={fieldErrors}
          />

          <FormTextarea
            id="description"
            label="Description"
            defaultValue={company?.description ?? ""}
            errors={fieldErrors}
          />

          <CustomFieldsFields
            definitions={definitions}
            defaultValues={(company?.customFields as Record<string, unknown>) ?? {}}
            errors={fieldErrors}
          />

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#e5e5e5]">Bundles</Label>

            {selectedBundleIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBundleIds.map((id) => {
                  const bundle = localBundles.find((b) => b.id === id);
                  return bundle ? (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleBundle(id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-violet-600/20 border-violet-600/60 text-violet-400 transition hover:border-violet-400"
                    >
                      {bundle.name}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null;
                })}
              </div>
            )}

            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__new__") {
                  setNewBundleOpen(true);
                } else if (val) {
                  toggleBundle(val);
                }
                e.target.value = "";
              }}
              className="w-full text-sm px-2 py-1 h-8 border rounded-md bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
            >
              <option value="" disabled>
                {localBundles.filter((b) => !selectedBundleIds.includes(b.id)).length === 0
                  ? "All bundles selected"
                  : "Add a bundle..."}
              </option>
              {localBundles
                .filter((b) => !selectedBundleIds.includes(b.id))
                .map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              <option value="__new__">+ Create new bundle</option>
            </select>

            {products !== null && (
              <BundleFormDialog
                products={products}
                open={newBundleOpen}
                onOpenChange={setNewBundleOpen}
                onCreated={(bundle) => {
                  setLocalBundles((prev) => [...prev, bundle]);
                  setSelectedBundleIds((prev) => [...prev, bundle.id]);
                }}
              />
            )}
          </div>

          <div className="flex justify-end">
            <FormSubmit>{isEdit ? "Save changes" : "Create company"}</FormSubmit>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
