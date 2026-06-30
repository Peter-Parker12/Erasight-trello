import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { ContactsClientSection } from "./_components/contacts-client-section";

type ContactsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ContactsPage = async ({ params }: ContactsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const [isAdmin, contacts, companies, definitionRows] = await Promise.all([
    isOrgAdmin(orgId),
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
      <ContactsClientSection
        initialContacts={contacts}
        definitions={definitions}
        companies={companies}
        organizationId={organizationId}
      />

      {isAdmin && (
        <CustomFieldsManager entityType="CONTACT" label="Custom fields" fields={definitions} />
      )}
    </div>
  );
};

export default ContactsPage;
