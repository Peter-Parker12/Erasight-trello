"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Folder, FolderOpen, Plus, Trash2, Loader2 } from "lucide-react";
import type { KbFolder } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createKbFolder } from "@/actions/create-kb-folder";
import { deleteKbFolder } from "@/actions/delete-kb-folder";
import { cn } from "@/lib/utils";

type FolderWithCount = KbFolder & { _count: { documents: number } };

type KbFolderPanelProps = {
  industryId: string;
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
  onFolderCreated: (folder: FolderWithCount) => void;
  onFolderDeleted: (id: string) => void;
};

export const KbFolderPanel = ({
  industryId,
  folders,
  selectedFolderId,
  onSelect,
  onFolderCreated,
  onFolderDeleted,
}: KbFolderPanelProps) => {
  const [adding, setAdding] = useState(false);
  const newNameRef = useRef<HTMLInputElement>(null);
  const deletingIdRef = useRef<string | null>(null);

  const { execute: executeCreate, isLoading: creating } = useAction(createKbFolder, {
    skipRefresh: true,
    onSuccess: (folder) => {
      onFolderCreated({ ...folder, _count: { documents: 0 } });
      setAdding(false);
      toast.success(`Folder "${folder.name}" created.`);
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete, isLoading: deleting } = useAction(deleteKbFolder, {
    skipRefresh: true,
    onSuccess: () => {
      if (deletingIdRef.current) {
        onFolderDeleted(deletingIdRef.current);
        deletingIdRef.current = null;
        toast.success("Folder deleted.");
      }
    },
    onError: (error) => toast.error(error),
  });

  const onAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newNameRef.current?.value.trim() ?? "";
    if (!name) return;
    executeCreate({ industryId, name });
  };

  const onDelete = (folder: FolderWithCount) => {
    if (
      !confirm(
        `Delete "${folder.name}" and its ${folder._count.documents} document(s)?`
      )
    )
      return;
    deletingIdRef.current = folder.id;
    executeDelete({ id: folder.id });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {adding && (
          <form onSubmit={onAddSubmit} className="px-2 py-1">
            <Input
              ref={newNameRef}
              placeholder="Folder name"
              autoFocus
              className="h-7 text-sm"
              onBlur={() => setAdding(false)}
            />
          </form>
        )}

        {folders.length === 0 && !adding && (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">
            No folders yet.
            <br />
            Click + to add one.
          </p>
        )}

        {folders.map((folder) => (
          <div
            key={folder.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-md mx-1 cursor-pointer transition-colors",
              selectedFolderId === folder.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            onClick={() => onSelect(folder.id)}
          >
            {selectedFolderId === folder.id ? (
              <FolderOpen className="h-4 w-4 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1 text-sm truncate">{folder.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {folder._count.documents}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {creating && (
        <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border">
          <Loader2 className="h-3 w-3 animate-spin" />
          Creating…
        </div>
      )}
    </div>
  );
};
