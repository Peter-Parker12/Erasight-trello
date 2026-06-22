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
  products?: { product: { id: string; name: string } }[];
};

type LeadCardProps = {
  lead: LeadWithRelations;
  stages: PipelineStage[];
  definitions: CustomFieldDefinitionDTO[];
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
  products?: { id: string; name: string; unitPrice: unknown; unit: string }[];
};

export const LeadCard = ({ lead, stages, definitions, companies, contacts, products = [] }: LeadCardProps) => {
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
    <div className="bg-[#2a2a2a] rounded-md border border-[#333] hover:border-violet-600/40 p-3 mb-2 space-y-1.5 text-sm transition">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug text-[#e5e5e5]">{lead.title}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <LeadFormDialog
            lead={lead}
            stages={stages}
            definitions={definitions}
            companies={companies}
            contacts={contacts}
            products={products}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-400"
            disabled={isLoading}
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {lead.value != null && (
        <p className="text-xs text-violet-400 font-medium">${Number(lead.value).toLocaleString()}</p>
      )}

      {lead.company && <p className="text-xs text-muted-foreground">{lead.company.name}</p>}

      {lead.contact && (
        <p className="text-xs text-muted-foreground">
          {lead.contact.firstName} {lead.contact.lastName ?? ""}
        </p>
      )}
    </div>
  );
};
