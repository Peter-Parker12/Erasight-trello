"use client";

import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import type { Lead, PipelineStage } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteLead } from "@/actions/delete-lead";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { LeadFormDialog } from "./lead-form-dialog";

export type LeadWithRelations = Lead & {
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
};

type LeadCardProps = {
  lead: LeadWithRelations;
  stages: PipelineStage[];
  definitions: CustomFieldDefinitionDTO[];
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
};

export const LeadCard = ({ lead, stages, definitions, companies, contacts }: LeadCardProps) => {
  const { execute, isLoading } = useAction(deleteLead, {
    onSuccess: () => toast.success("Lead deleted."),
    onError: (error) => toast.error(error),
  });

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm(`Delete "${lead.title}"? This cannot be undone.`)) return;
    execute({ id: lead.id });
  };

  return (
    <div className="bg-white rounded-md shadow-sm border p-3 mb-2 space-y-1.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{lead.title}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <LeadFormDialog
            lead={lead}
            stages={stages}
            definitions={definitions}
            companies={companies}
            contacts={contacts}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
            disabled={isLoading}
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {lead.value != null && (
        <p className="text-xs text-neutral-600">${Number(lead.value).toLocaleString()}</p>
      )}

      {lead.company && <p className="text-xs text-neutral-500">{lead.company.name}</p>}

      {lead.contact && (
        <p className="text-xs text-neutral-500">
          {lead.contact.firstName} {lead.contact.lastName ?? ""}
        </p>
      )}
    </div>
  );
};
