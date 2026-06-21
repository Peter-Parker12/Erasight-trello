import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Plus, Users, Building2, Mail } from "lucide-react";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { KpiCard } from "@/components/crm/kpi-card";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { ContactsTable } from "./_components/contacts-table";
import { ContactFormDialog } from "./_components/contact-form-dialog";

type ContactsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ContactsPage = async ({ params }: ContactsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const isAdmin = await isOrgAdmin(orgId);

  const [contacts, companies, definitionRows] = await Promise.all([
    db.contact.findMany({
      where: { orgId },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.company.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getFieldDefinitions(orgId, "CONTACT"),
  ]);

  const definitions = definitionRows.map(toFieldDefinitionDTO);
  const linkedToCompany = contacts.filter((c) => c.company).length;
  const withEmail = contacts.filter((c) => c.email).length;

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            People you&apos;re in touch with, optionally linked to a company.
          </p>
        </div>
        <ContactFormDialog
          definitions={definitions}
          companies={companies}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New contact
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Total contacts" value={contacts.length} icon={Users} />
        <KpiCard label="Linked to company" value={linkedToCompany} icon={Building2} iconColor="text-emerald-400" />
        <KpiCard label="With email" value={withEmail} icon={Mail} iconColor="text-amber-400" />
      </div>

      {isAdmin && (
        <CustomFieldsManager entityType="CONTACT" label="Custom fields" fields={definitions} />
      )}

      <ContactsTable
        contacts={contacts}
        definitions={definitions}
        companies={companies}
        organizationId={organizationId}
      />
    </div>
  );
};

export default ContactsPage;
