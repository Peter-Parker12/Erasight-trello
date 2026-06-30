"use client";

import { useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Contact } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteContact } from "@/actions/delete-contact";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { ContactFormDialog } from "./contact-form-dialog";

type ContactWithCompany = Contact & { company: { id: string; name: string } | null };

type ContactsTableProps = {
  contacts: ContactWithCompany[];
  definitions: CustomFieldDefinitionDTO[];
  companies: { id: string; name: string }[];
  organizationId: string;
  onUpdated?: (contact: ContactWithCompany) => void;
  onDeleted?: (id: string) => void;
};

export const ContactsTable = ({
  contacts,
  definitions,
  companies,
  organizationId,
  onUpdated,
  onDeleted,
}: ContactsTableProps) => {
  const deletingIdRef = useRef<string | null>(null);

  const { execute, isLoading } = useAction(deleteContact, {
    skipRefresh: true,
    onSuccess: () => {
      if (deletingIdRef.current) {
        onDeleted?.(deletingIdRef.current);
        deletingIdRef.current = null;
      }
      toast.success("Contact deleted.");
    },
    onError: (error) => toast.error(error),
  });

  const onDelete = (contact: ContactWithCompany) => {
    if (!confirm(`Delete "${contact.firstName} ${contact.lastName ?? ""}"? This cannot be undone.`)) return;
    deletingIdRef.current = contact.id;
    execute({ id: contact.id });
  };

  if (contacts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#333] p-8 text-center text-sm text-muted-foreground">
        No contacts yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-[#2a2a2a] text-left text-xs font-semibold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Company</th>
            <th className="px-4 py-2 w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-[#2a2a2a]">
              <td className="px-4 py-2 font-medium">
                <Link
                  href={`/organization/${organizationId}/crm/contacts/${contact.id}`}
                  className="hover:underline"
                >
                  {contact.firstName} {contact.lastName ?? ""}
                </Link>
              </td>
              <td className="px-4 py-2 text-muted-foreground">{contact.email || "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{contact.phone || "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {contact.company ? (
                  <Link
                    href={`/organization/${organizationId}/crm/companies/${contact.company.id}`}
                    className="hover:underline"
                  >
                    {contact.company.name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <ContactFormDialog
                    contact={contact}
                    definitions={definitions}
                    companies={companies}
                    onUpdated={onUpdated}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    disabled={isLoading}
                    onClick={() => onDelete(contact)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
