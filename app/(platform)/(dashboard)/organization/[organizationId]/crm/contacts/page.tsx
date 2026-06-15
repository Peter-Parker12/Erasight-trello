import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { ContactsTable } from "./_components/contacts-table";
import { ContactFormDialog } from "./_components/contact-form-dialog";

type ContactsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ContactsPage = async ({ params }: ContactsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

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

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-neutral-500">
            People you're in touch with, optionally linked to a company.
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
