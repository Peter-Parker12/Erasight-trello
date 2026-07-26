"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import type { Lead, PipelineStage } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  onDeleted?: (id: string) => void;
  onUpdated?: (lead: Lead) => void;
};

export const LeadCard = ({ lead, stages, definitions, companies, contacts, products = [], onDeleted, onUpdated }: LeadCardProps) => {
  const deletingIdRef = useRef<string | null>(null);

  const { execute, isLoading } = useAction(deleteLead, {
    skipRefresh: true,
    onSuccess: () => {
      if (deletingIdRef.current) {
        onDeleted?.(deletingIdRef.current);
        deletingIdRef.current = null;
      }
      toast.success("Lead deleted.");
    },
    onError: (error) => toast.error(error),
  });

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm(`Delete "${lead.title}"? This cannot be undone.`)) return;
    deletingIdRef.current = lead.id;
    execute({ id: lead.id });
  };

  return (
    <Card className="hover:border-primary/40 p-3 mb-2 space-y-1.5 text-sm transition">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{lead.title}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <LeadFormDialog
            lead={lead}
            stages={stages}
            definitions={definitions}
            companies={companies}
            contacts={contacts}
            products={products}
            onUpdated={onUpdated}
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
        <p className="text-xs text-primary font-medium">${Number(lead.value).toLocaleString()}</p>
      )}

      {lead.company && <p className="text-xs text-muted-foreground">{lead.company.name}</p>}

      {lead.contact && (
        <p className="text-xs text-muted-foreground">
          {lead.contact.firstName} {lead.contact.lastName ?? ""}
        </p>
      )}
    </Card>
  );
};
