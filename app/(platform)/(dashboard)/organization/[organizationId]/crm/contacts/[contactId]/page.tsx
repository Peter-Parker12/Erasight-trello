import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Pencil } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { ContactFormDialog } from "../_components/contact-form-dialog";

type ContactDetailPageProps = {
  params: Promise<{ organizationId: string; contactId: string }>;
};

const ContactDetailPage = async ({ params }: ContactDetailPageProps) => {
  const { organizationId, contactId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const [contact, companies, definitionRows] = await Promise.all([
    db.contact.findUnique({
      where: { id: contactId, orgId },
      include: {
        company: { select: { id: true, name: true } },
        leads: { include: { stage: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    db.company.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getFieldDefinitions(orgId, "CONTACT"),
  ]);

  if (!contact) notFound();

  const definitions = definitionRows.map(toFieldDefinitionDTO);

  return (
    <div className="w-full p-4 md:p-6 space-y-6 max-w-4xl">
      <Link
        href={`/organization/${organizationId}/crm/contacts`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-[#e5e5e5]"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to contacts
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact.firstName} {contact.lastName ?? ""}
          </h1>
          {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
        </div>
        <ContactFormDialog
          contact={contact}
          definitions={definitions}
          companies={companies}
          trigger={
            <Button size="sm" variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
        <DetailField label="Email" value={contact.email} />
        <DetailField label="Phone" value={contact.phone} />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Company</p>
          {contact.company ? (
            <Link
              href={`/organization/${organizationId}/crm/companies/${contact.company.id}`}
              className="text-sm hover:underline"
            >
              {contact.company.name}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>

        {definitions.length > 0 && (
          <div className="md:col-span-2 border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {definitions.map((def) => {
              const value = (contact.customFields as Record<string, unknown>)[def.key];
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
        <h2 className="text-sm font-semibold">Leads</h2>
        {contact.leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads linked to this contact yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {contact.leads.map((lead) => (
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
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    <p className="text-sm">{value || "—"}</p>
  </div>
);

export default ContactDetailPage;
