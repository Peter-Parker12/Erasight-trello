"use client";

import { useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Folder, FileText, Trash2, ChevronRight } from "lucide-react";
import type { KbIndustry } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteKbIndustry } from "@/actions/delete-kb-industry";

type IndustryWithCounts = KbIndustry & {
  _count: { folders: number };
  folderDocCount: number;
};

type KbIndustryGridProps = {
  industries: IndustryWithCounts[];
  organizationId: string;
  onDeleted?: (id: string) => void;
};

export const KbIndustryGrid = ({ industries, organizationId, onDeleted }: KbIndustryGridProps) => {
  const deletingIdRef = useRef<string | null>(null);

  const { execute, isLoading } = useAction(deleteKbIndustry, {
    skipRefresh: true,
    onSuccess: () => {
      if (deletingIdRef.current) {
        toast.success("Industry deleted.");
        onDeleted?.(deletingIdRef.current);
        deletingIdRef.current = null;
      }
    },
    onError: (error) => toast.error(error),
  });

  const onDelete = (industry: IndustryWithCounts) => {
    if (
      !confirm(
        `Delete "${industry.name}" and all its folders and documents? This cannot be undone.`
      )
    )
      return;
    deletingIdRef.current = industry.id;
    execute({ id: industry.id });
  };

  if (industries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#333] p-12 text-center text-sm text-muted-foreground">
        No industries yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {industries.map((industry) => (
        <div
          key={industry.id}
          className="relative group rounded-lg border border-[#333] bg-[#1f1f1f] p-4 hover:border-violet-500/50 transition-colors flex flex-col gap-3"
        >
          <Link
            href={`/organization/${organizationId}/knowledge-base/${industry.id}`}
            className="flex-1"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-violet-500/15 p-2 shrink-0">
                <Folder className="h-5 w-5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#e5e5e5] truncate">{industry.name}</h3>
                {industry.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {industry.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {industry._count.folders} folder{industry._count.folders !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {industry.folderDocCount} doc{industry.folderDocCount !== 1 ? "s" : ""}
              </span>
            </div>
          </Link>

          <div className="flex items-center justify-between">
            <Link
              href={`/organization/${organizationId}/knowledge-base/${industry.id}`}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
            >
              Open <ChevronRight className="h-3 w-3" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isLoading}
              onClick={() => onDelete(industry)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
