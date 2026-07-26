"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Pencil, Loader2, Building2, Phone, Globe, MapPin, AlignLeft } from "lucide-react";
import type { Company } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompanyFormDialog } from "./company-form-dialog";
import { CompanyBundlesPanel } from "./company-bundles-panel";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type Contact = { id: string; firstName: string; lastName: string | null; email: string | null };
type Lead = { id: string; title: string; stage: { name: string } };
type BundleChildBundle = { id: string; name: string };
type BundleItem = { product: { id: string; name: string; unitPrice: unknown; unit: string } | null; childBundle: BundleChildBundle | null; quantity: number; unitPrice: unknown };
type Bundle = {
  id: string; orgId: string; name: string; description: string | null;
  pricingMode: string; discount: unknown; finalPrice: unknown;
  createdAt: string; updatedAt: string;
  items: BundleItem[];
};

type DetailData = {
  company: Company & { contacts: Contact[]; leads: Lead[]; bundles: { bundle: Bundle }[] };
  definitions: CustomFieldDefinitionDTO[];
  allBundles: Bundle[];
};

type CompanyDetailDialogProps = {
  companyId: string;
  companyName: string;
  organizationId: string;
  children: React.ReactNode;
};

export const CompanyDetailDialog = ({
  companyId,
  companyName,
  organizationId,
  children,
}: CompanyDetailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailData | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/companies/${companyId}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const onOpen = (v: boolean) => {
    setOpen(v);
    if (v && !data) fetchDetail();
  };

  const assignedBundles = data?.company.bundles.map((cb) => cb.bundle) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <span onClick={() => onOpen(true)} className="cursor-pointer">{children}</span>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{companyName}</span>
            {data && (
              <CompanyFormDialog
                company={data.company as Company}
                definitions={data.definitions}
                allBundles={data.allBundles.map((b) => ({ id: b.id, name: b.name }))}
                trigger={
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                }
              />
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* Core fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-border p-4">
              {data.company.industry && (
                <DetailField label="Industry" value={data.company.industry} />
              )}
              {data.company.domain && (
                <DetailField icon={<Globe className="h-3.5 w-3.5" />} label="Domain" value={data.company.domain} />
              )}
              {data.company.phone && (
                <DetailField icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={data.company.phone} />
              )}
              {data.company.website && (
                <DetailField icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={data.company.website} />
              )}
              {data.company.address && (
                <div className="col-span-2">
                  <DetailField icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={data.company.address} />
                </div>
              )}
              {data.company.description && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <AlignLeft className="h-3.5 w-3.5" /> Description
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{data.company.description}</p>
                </div>
              )}

              {/* Custom fields */}
              {data.definitions.length > 0 && (
                <div className="col-span-2 border-t border-border pt-3 grid grid-cols-2 gap-3">
                  {data.definitions.map((def) => {
                    const value = (data.company.customFields as Record<string, unknown>)[def.key];
                    const display = value === undefined || value === null || value === ""
                      ? null
                      : Array.isArray(value) ? value.join(", ") : String(value);
                    return <DetailField key={def.key} label={def.label} value={display} />;
                  })}
                </div>
              )}
            </div>

            {/* Contacts */}
            <Section title="Contacts" count={data.company.contacts.length}>
              {data.company.contacts.length === 0 ? (
                <Empty>No contacts linked yet.</Empty>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {data.company.contacts.map((c) => (
                    <li key={c.id} className="px-4 py-2 text-sm flex items-center gap-2">
                      <Link
                        href={`/organization/${organizationId}/crm/contacts/${c.id}`}
                        className="text-foreground hover:underline hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        {c.firstName} {c.lastName ?? ""}
                      </Link>
                      {c.email && <span className="text-muted-foreground text-xs">· {c.email}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Leads */}
            <Section title="Leads" count={data.company.leads.length}>
              {data.company.leads.length === 0 ? (
                <Empty>No leads linked yet.</Empty>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {data.company.leads.map((lead) => (
                    <li key={lead.id} className="px-4 py-2 text-sm flex items-center justify-between">
                      <Link
                        href={`/organization/${organizationId}/crm/leads`}
                        className="text-foreground hover:underline hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        {lead.title}
                      </Link>
                      <span className="text-muted-foreground text-xs">{lead.stage.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Bundles */}
            <CompanyBundlesPanel
              companyId={companyId}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              assignedBundles={assignedBundles as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              allBundles={data.allBundles as any}
              organizationId={organizationId}
              onAssign={fetchDetail}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DetailField = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-0.5">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
      {icon}{label}
    </p>
    <p className="text-sm text-foreground">{value || "—"}</p>
  </div>
);

const Section = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      {title}
      <span className="text-xs font-normal text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{count}</span>
    </h3>
    {children}
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);
