"use client";

import { useMemo, useState, type ElementRef, useRef } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import type { Company } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { enrichCompany } from "@/actions/enrich-company";
import {
  computeEnrichmentPatch,
  resolveOverrideMode,
} from "@/lib/enrichment/apply";
import { buildMockPayload } from "@/lib/enrichment/providers";

type EnrichCompanyDialogProps = {
  company: Pick<
    Company,
    | "id"
    | "name"
    | "domain"
    | "industry"
    | "address"
    | "logoUrl"
    | "companySize"
    | "revenueRange"
    | "linkedinUrl"
    | "enrichmentStatus"
    | "enrichmentSource"
    | "enrichmentLastRunAt"
  >;
  trigger?: React.ReactNode;
};

const STATUS_LABEL: Record<NonNullable<Company["enrichmentStatus"]>, string> = {
  PENDING: "Pending",
  SUCCESS: "Success",
  FAILED: "Failed",
  NOT_FOUND: "Not found",
};

const STATUS_TONE: Record<NonNullable<Company["enrichmentStatus"]>, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  SUCCESS: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  FAILED: "bg-red-500/15 text-red-300 border-red-500/40",
  NOT_FOUND: "bg-zinc-500/15 text-zinc-300 border-zinc-500/40",
};

export const EnrichCompanyDialog = ({
  company,
  trigger,
}: EnrichCompanyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"EMPTY_ONLY" | "OVERWRITE_ALL">("EMPTY_ONLY");
  const closeRef = useRef<ElementRef<"button">>(null);

  const isFirstRun = !company.enrichmentStatus;
  const effectiveMode = resolveOverrideMode(company, mode);

  // Phase 1 — preview against mock payload so admin sees what *would* change.
  // Server uses real provider output, so the actual patch may differ slightly.
  const previewPatch = useMemo(
    () =>
      company.domain
        ? computeEnrichmentPatch(
            company,
            buildMockPayload(company.domain),
            effectiveMode
          )
        : {},
    [company, effectiveMode]
  );
  const previewEntries = Object.entries(previewPatch);

  const { execute, isLoading } = useAction(enrichCompany, {
    onSuccess: () => {
      toast.success("Company enriched.");
      closeRef.current?.click();
    },
    onError: (error) => toast.error(error),
  });

  const onConfirm = () => {
    execute({ id: company.id, overrideMode: mode });
  };

  const disabled = !company.domain;

  const defaultTrigger = (
    <Button size="sm" variant="outline" disabled={disabled}>
      <Sparkles className="h-4 w-4 mr-2" />
      Enrich
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enrich company</DialogTitle>
          <DialogDescription>
            Pull firmographic data from the enrichment provider into this company.
          </DialogDescription>
        </DialogHeader>

        <DialogClose ref={closeRef} className="hidden" />

        {disabled ? (
          <p className="text-sm text-amber-300">
            Cần điền domain trước khi enrich.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {company.enrichmentStatus ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                    STATUS_TONE[company.enrichmentStatus]
                  }`}
                >
                  {STATUS_LABEL[company.enrichmentStatus]}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                  Never enriched
                </span>
              )}
              {company.enrichmentSource && (
                <span className="text-muted-foreground">
                  via {company.enrichmentSource}
                </span>
              )}
              {company.enrichmentLastRunAt && (
                <span className="text-muted-foreground">
                  · last run {new Date(company.enrichmentLastRunAt).toLocaleString()}
                </span>
              )}
            </div>

            {isFirstRun ? (
              <p className="text-sm text-muted-foreground">
                Lần đầu tiên — chỉ các field đang trống sẽ được điền.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Override mode</p>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="overrideMode"
                    value="EMPTY_ONLY"
                    checked={mode === "EMPTY_ONLY"}
                    onChange={() => setMode("EMPTY_ONLY")}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Update empty fields only</span>
                    <span className="block text-xs text-muted-foreground">
                      Skip fields that already have a value.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="overrideMode"
                    value="OVERWRITE_ALL"
                    checked={mode === "OVERWRITE_ALL"}
                    onChange={() => setMode("OVERWRITE_ALL")}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Overwrite all fields</span>
                    <span className="block text-xs text-muted-foreground">
                      Replace existing values with provider data.
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div className="rounded-md border p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Fields to update ({effectiveMode})
              </p>
              {previewEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No fields will change based on the current mode.
                </p>
              ) : (
                <ul className="text-sm space-y-1">
                  {previewEntries.map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="truncate max-w-[60%] text-right">
                        {String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Enriching…" : "Confirm enrich"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
