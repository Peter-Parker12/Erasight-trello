"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Settings } from "lucide-react";
import type { PipelineStage } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createPipelineStage } from "@/actions/create-pipeline-stage";
import { updatePipelineStage } from "@/actions/update-pipeline-stage";
import { deletePipelineStage } from "@/actions/delete-pipeline-stage";

type ManageStagesDialogProps = {
  stages: PipelineStage[];
};

export const ManageStagesDialog = ({ stages }: ManageStagesDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Settings className="h-4 w-4 mr-2" />
        Manage stages
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pipeline stages</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {stages.map((stage) => (
            <StageRow key={stage.id} stage={stage} canDelete={stages.length > 1} />
          ))}
        </div>

        <AddStageRow />
      </DialogContent>
    </Dialog>
  );
};

const StageRow = ({ stage, canDelete }: { stage: PipelineStage; canDelete: boolean }) => {
  const { execute: executeUpdate } = useAction(updatePipelineStage, {
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deletePipelineStage, {
    onSuccess: () => toast.success("Stage deleted."),
    onError: (error) => toast.error(error),
  });

  const onDelete = () => {
    if (
      !confirm(
        `Delete the "${stage.name}" stage? Any leads in this stage will be moved to another stage.`
      )
    )
      return;
    executeDelete({ id: stage.id });
  };

  return (
    <div className="flex items-center gap-2 border rounded-md p-2">
      <Input
        defaultValue={stage.name}
        className="h-8 text-sm flex-1"
        onBlur={(e) => {
          const name = e.target.value.trim();
          if (name && name !== stage.name) {
            executeUpdate({ id: stage.id, name });
          }
        }}
      />
      <label className="flex items-center gap-1 text-xs text-neutral-600 whitespace-nowrap">
        <input
          type="checkbox"
          defaultChecked={stage.isWon}
          onChange={(e) => executeUpdate({ id: stage.id, isWon: e.target.checked })}
        />
        Won
      </label>
      <label className="flex items-center gap-1 text-xs text-neutral-600 whitespace-nowrap">
        <input
          type="checkbox"
          defaultChecked={stage.isLost}
          onChange={(e) => executeUpdate({ id: stage.id, isLost: e.target.checked })}
        />
        Lost
      </label>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 disabled:opacity-30"
        disabled={!canDelete || isDeleting}
        onClick={onDelete}
        title={canDelete ? "Delete stage" : "You can't delete the only stage"}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const AddStageRow = () => {
  const [name, setName] = useState("");

  const { execute, isLoading } = useAction(createPipelineStage, {
    onSuccess: () => setName(""),
    onError: (error) => toast.error(error),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    execute({ name: name.trim() });
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 pt-2 border-t">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New stage name"
        className="h-8 text-sm flex-1"
      />
      <Button type="submit" size="sm" disabled={isLoading || !name.trim()}>
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </form>
  );
};
