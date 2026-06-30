"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Building2, Mail } from "lucide-react";
import type { Contact } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/crm/kpi-card";
import { ContactFormDialog } from "./contact-form-dialog";
import { ContactsTable } from "./contacts-table";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type ContactWithCompany = Contact & { company: { id: string; name: string } | null };

type Props = {
  initialContacts: ContactWithCompany[];
  definitions: CustomFieldDefinitionDTO[];
  companies: { id: string; name: string }[];
  organizationId: string;
};

export const ContactsClientSection = ({
  initialContacts,
  definitions,
  companies,
  organizationId,
}: Props) => {
  const [contacts, setContacts] = useState<ContactWithCompany[]>(initialContacts);

  useEffect(() => { setContacts(initialContacts); }, [initialContacts]);

  const handleCreated = (contact: ContactWithCompany) =>
    setContacts((prev) => [contact, ...prev]);

  const handleUpdated = (contact: ContactWithCompany) =>
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));

  const handleDeleted = (id: string) =>
    setContacts((prev) => prev.filter((c) => c.id !== id));

  const linkedToCompany = contacts.filter((c) => c.company).length;
  const withEmail       = contacts.filter((c) => c.email).length;

  return (
    <>
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
          onCreated={handleCreated}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New contact
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Total contacts"    value={contacts.length} icon={Users} />
        <KpiCard label="Linked to company" value={linkedToCompany} icon={Building2} iconColor="text-emerald-400" />
        <KpiCard label="With email"        value={withEmail}       icon={Mail}     iconColor="text-amber-400" />
      </div>

      <ContactsTable
        contacts={contacts}
        definitions={definitions}
        companies={companies}
        organizationId={organizationId}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
};
