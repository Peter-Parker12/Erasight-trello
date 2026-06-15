"use client";

import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { PipelineStage } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { moveLead } from "@/actions/move-lead";
import { KanbanBoard, type KanbanColumn } from "@/components/kanban/kanban-board";
import type { CustomFieldDefinitionDTO } from "@/lib/custom-fields";
import { LeadCard, type LeadWithRelations } from "./lead-card";
import { LeadFormDialog } from "./lead-form-dialog";
import { ManageStagesDialog } from "./manage-stages-dialog";

type StageColumn = KanbanColumn<LeadWithRelations> & PipelineStage;

type LeadsBoardProps = {
  stages: (PipelineStage & { leads: LeadWithRelations[] })[];
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
  definitions: CustomFieldDefinitionDTO[];
  organizationId: string;
};

export const LeadsBoard = ({
  stages,
  companies,
  contacts,
  definitions,
}: LeadsBoardProps) => {
  const { execute: executeMove } = useAction(moveLead, {
    onError: (error) => toast.error(error),
  });

  const columns: StageColumn[] = stages.map(({ leads, ...stage }) => ({
    ...stage,
    items: leads,
  }));

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <div className="flex items-center justify-end gap-2">
        <ManageStagesDialog stages={stages} />
        <LeadFormDialog
          stages={stages}
          definitions={definitions}
          companies={companies}
          contacts={contacts}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New lead
            </Button>
          }
        />
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard<StageColumn, LeadWithRelations>
          columns={columns}
          onItemMove={({ destinationColumnId, destinationItems }) => {
            executeMove({
              items: destinationItems.map((item, index) => ({
                id: item.id,
                order: index,
                stageId: destinationColumnId,
              })),
            });
          }}
          renderColumn={(column, itemsNode) => (
            <div className="bg-neutral-100 rounded-md w-[272px] shrink-0 flex flex-col max-h-full">
              <div className="px-3 py-2 flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {column.name}
                  {(column.isWon || column.isLost) && (
                    <span
                      className={
                        column.isWon
                          ? "ml-2 text-xs text-emerald-600"
                          : "ml-2 text-xs text-red-500"
                      }
                    >
                      {column.isWon ? "Won" : "Lost"}
                    </span>
                  )}
                </h3>
                <span className="text-xs text-neutral-500">{column.items.length}</span>
              </div>

              <div className="px-2 overflow-y-auto flex-1">{itemsNode}</div>

              <div className="p-2">
                <LeadFormDialog
                  stages={stages}
                  defaultStageId={column.id}
                  definitions={definitions}
                  companies={companies}
                  contacts={contacts}
                  trigger={
                    <Button variant="ghost" size="sm" className="w-full justify-start text-neutral-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Add lead
                    </Button>
                  }
                />
              </div>
            </div>
          )}
          renderItem={(item) => (
            <LeadCard
              lead={item}
              stages={stages}
              definitions={definitions}
              companies={companies}
              contacts={contacts}
            />
          )}
        />
      </div>
    </div>
  );
};
