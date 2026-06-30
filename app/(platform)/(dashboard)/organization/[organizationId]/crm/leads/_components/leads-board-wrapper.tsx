"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Trophy, XCircle, DollarSign } from "lucide-react";
import type { Lead, PipelineStage } from "@prisma/client";

import { KpiCard } from "@/components/crm/kpi-card";
import { LeadsBoard } from "./leads-board";
import { LeadWithRelations } from "./lead-card";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";

type StageWithLeads = PipelineStage & { leads: LeadWithRelations[] };

type Props = {
  initialStages: StageWithLeads[];
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
  products: { id: string; name: string; unitPrice: unknown; unit: string }[];
  definitions: CustomFieldDefinitionDTO[];
  organizationId: string;
};

export const LeadsBoardWrapper = ({
  initialStages,
  companies,
  contacts,
  products,
  definitions,
  organizationId,
}: Props) => {
  const [stages, setStages] = useState<StageWithLeads[]>(initialStages);

  useEffect(() => { setStages(initialStages); }, [initialStages]);

  const handleLeadCreated = (lead: Lead) => {
    const company = companies.find((c) => c.id === lead.companyId) ?? null;
    const contact = contacts.find((c) => c.id === lead.contactId) ?? null;
    const withRelations: LeadWithRelations = { ...lead, company, contact, products: [] };
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === lead.stageId
          ? { ...stage, leads: [...stage.leads, withRelations] }
          : stage
      )
    );
  };

  const handleLeadUpdated = (lead: Lead) => {
    const company = companies.find((c) => c.id === lead.companyId) ?? null;
    const contact = contacts.find((c) => c.id === lead.contactId) ?? null;
    setStages((prev) => {
      const withoutLead = prev.map((stage) => ({
        ...stage,
        leads: stage.leads.filter((l) => l.id !== lead.id),
      }));
      return withoutLead.map((stage) =>
        stage.id === lead.stageId
          ? { ...stage, leads: [...stage.leads, { ...lead, company, contact, products: [] }] }
          : stage
      );
    });
  };

  const handleLeadDeleted = (id: string) => {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        leads: stage.leads.filter((l) => l.id !== id),
      }))
    );
  };

  const allLeads   = stages.flatMap((s) => s.leads);
  const wonLeads   = stages.filter((s) => s.isWon).flatMap((s) => s.leads);
  const lostLeads  = stages.filter((s) => s.isLost).flatMap((s) => s.leads);
  const totalValue = allLeads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total leads"    value={allLeads.length}               icon={TrendingUp} />
        <KpiCard label="Won"            value={wonLeads.length}               icon={Trophy}     iconColor="text-emerald-400" />
        <KpiCard label="Lost"           value={lostLeads.length}              icon={XCircle}    iconColor="text-red-400" />
        <KpiCard label="Pipeline value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} iconColor="text-amber-400" />
      </div>

      <LeadsBoard
        stages={stages}
        companies={companies}
        contacts={contacts}
        products={products}
        definitions={definitions}
        organizationId={organizationId}
        onLeadCreated={handleLeadCreated}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
      />
    </>
  );
};
