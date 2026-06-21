"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { Company } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteCompany } from "@/actions/delete-company";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { CompanyFormDialog } from "./company-form-dialog";

type CompaniesTableProps = {
  companies: Company[];
  definitions: CustomFieldDefinitionDTO[];
  organizationId: string;
};

export const CompaniesTable = ({ companies, definitions, organizationId }: CompaniesTableProps) => {
  const { execute, isLoading } = useAction(deleteCompany, {
    onSuccess: () => toast.success("Company deleted."),
    onError: (error) => toast.error(error),
  });

  const onDelete = (company: Company) => {
    if (!confirm(`Delete "${company.name}"? This cannot be undone.`)) return;
    execute({ id: company.id });
  };

  if (companies.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#333] p-8 text-center text-sm text-muted-foreground">
        No companies yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-[#2a2a2a] text-left text-xs font-semibold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Domain</th>
            <th className="px-4 py-2">Industry</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2 w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-[#2a2a2a]">
              <td className="px-4 py-2 font-medium">
                <Link
                  href={`/organization/${organizationId}/crm/companies/${company.id}`}
                  className="hover:underline"
                >
                  {company.name}
                </Link>
              </td>
              <td className="px-4 py-2 text-muted-foreground">{company.domain || "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{company.industry || "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{company.phone || "—"}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <CompanyFormDialog
                    company={company}
                    definitions={definitions}
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
                    onClick={() => onDelete(company)}
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
