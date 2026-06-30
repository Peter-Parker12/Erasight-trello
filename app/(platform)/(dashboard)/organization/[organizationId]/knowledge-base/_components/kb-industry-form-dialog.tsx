"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { KbIndustry } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { createKbIndustry } from "@/actions/create-kb-industry";

type KbIndustryFormDialogProps = {
  onCreated?: (industry: KbIndustry) => void;
  trigger?: React.ReactNode;
};

export const KbIndustryFormDialog = ({ onCreated, trigger }: KbIndustryFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const { execute, isLoading } = useAction(createKbIndustry, {
    skipRefresh: true,
    onSuccess: (industry) => {
      toast.success(`Industry "${industry.name}" created.`);
      onCreated?.(industry);
      setOpen(false);
    },
    onError: (error) => toast.error(error),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    const description = descRef.current?.value.trim() || undefined;
    if (!name) return;
    execute({ name, description });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Industry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Industry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="kb-industry-name">Name</Label>
            <Input
              id="kb-industry-name"
              ref={nameRef}
              placeholder="e.g. Healthcare, Finance, Technology"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kb-industry-desc">Description (optional)</Label>
            <Textarea
              id="kb-industry-desc"
              ref={descRef}
              placeholder="Brief description of this industry category"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
