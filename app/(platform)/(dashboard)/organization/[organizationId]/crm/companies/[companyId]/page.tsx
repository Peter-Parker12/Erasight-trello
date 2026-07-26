import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Pencil } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CompanyFormDialog } from "../_components/company-form-dialog";
import { CompanyBundlesPanel } from "../_components/company-bundles-panel";

type CompanyDetailPageProps = {
  params: Promise<{ organizationId: string; companyId: string }>;
};

const CompanyDetailPage = async ({ params }: CompanyDetailPageProps) => {
  const { organizationId, companyId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const [company, definitionRows, allBundles] = await Promise.all([
    db.company.findUnique({
      where: { id: companyId, orgId },
      include: {
        contacts: { orderBy: { createdAt: "desc" } },
        leads: { include: { stage: true }, orderBy: { createdAt: "desc" } },
        bundles: {
          include: {
            bundle: {
              include: { items: { include: { product: true, childBundle: true } } },
            },
          },
        },
      },
    }),
    getFieldDefinitions(orgId, "COMPANY"),
    db.productBundle.findMany({
      where: { orgId },
      include: { items: { include: { product: true, childBundle: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!company) notFound();

  const definitions = definitionRows.map(toFieldDefinitionDTO);
  const assignedBundles = company.bundles.map((cb) => cb.bundle);

  return (
    <div className="w-full p-4 md:p-6 space-y-6 max-w-4xl">
      <Link
        href={`/organization/${organizationId}/crm/companies`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to companies
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          {company.industry && <p className="text-sm text-muted-foreground">{company.industry}</p>}
        </div>
        <CompanyFormDialog
          company={company}
          definitions={definitions}
          trigger={
            <Button size="sm" variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
        <DetailField label="Domain" value={company.domain} />
        <DetailField label="Phone" value={company.phone} />
        <DetailField label="Website" value={company.website} />
        <DetailField label="Address" value={company.address} />
        {company.description && (
          <div className="md:col-span-2 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Description</p>
            <p className="text-sm whitespace-pre-wrap">{company.description}</p>
          </div>
        )}

        {definitions.length > 0 && (
          <div className="md:col-span-2 border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {definitions.map((def) => {
              const value = (company.customFields as Record<string, unknown>)[def.key];
              return (
                <DetailField
                  key={def.key}
                  label={def.label}
                  value={
                    value === undefined || value === null || value === ""
                      ? null
                      : Array.isArray(value)
                        ? value.join(", ")
                        : String(value)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Contacts</h2>
        {company.contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contacts linked to this company yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {company.contacts.map((contact) => (
              <li key={contact.id} className="px-4 py-2 text-sm">
                <Link
                  href={`/organization/${organizationId}/crm/contacts/${contact.id}`}
                  className="hover:underline"
                >
                  {contact.firstName} {contact.lastName ?? ""}
                </Link>
                {contact.email && (
                  <span className="text-muted-foreground"> · {contact.email}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Leads</h2>
        {company.leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads linked to this company yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {company.leads.map((lead) => (
              <li key={lead.id} className="px-4 py-2 text-sm flex items-center justify-between">
                <Link
                  href={`/organization/${organizationId}/crm/leads`}
                  className="hover:underline"
                >
                  {lead.title}
                </Link>
                <span className="text-muted-foreground">{lead.stage.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CompanyBundlesPanel
        companyId={company.id}
        assignedBundles={assignedBundles}
        allBundles={allBundles}
        organizationId={organizationId}
      />
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    <p className="text-sm">{value || "—"}</p>
  </div>
);

export default CompanyDetailPage;
