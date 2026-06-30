"use client";

import { useRef } from "react";
import { toast } from "sonner";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  File,
  ExternalLink,
  Trash2,
} from "lucide-react";
import type { KbDocument } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteKbDocument } from "@/actions/delete-kb-document";
import { KbDocumentFormDialog } from "./kb-document-form-dialog";

function fileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-4 w-4 text-muted-foreground" />;
  if (fileType.includes("pdf") || fileType.includes("word") || fileType.includes("document"))
    return <FileText className="h-4 w-4 text-blue-400" />;
  if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv"))
    return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
  if (fileType.includes("image"))
    return <FileImage className="h-4 w-4 text-pink-400" />;
  if (fileType.includes("video"))
    return <FileVideo className="h-4 w-4 text-orange-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type KbDocumentsPanelProps = {
  folderId: string;
  folderName: string;
  documents: KbDocument[];
  onDocumentCreated: (doc: KbDocument) => void;
  onDocumentDeleted: (id: string) => void;
};

export const KbDocumentsPanel = ({
  folderId,
  folderName,
  documents,
  onDocumentCreated,
  onDocumentDeleted,
}: KbDocumentsPanelProps) => {
  const deletingIdRef = useRef<string | null>(null);

  const { execute, isLoading } = useAction(deleteKbDocument, {
    skipRefresh: true,
    onSuccess: () => {
      if (deletingIdRef.current) {
        onDocumentDeleted(deletingIdRef.current);
        deletingIdRef.current = null;
        toast.success("Document deleted.");
      }
    },
    onError: (error) => toast.error(error),
  });

  const onDelete = (doc: KbDocument) => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    deletingIdRef.current = doc.id;
    execute({ id: doc.id });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333]">
        <span className="text-sm font-medium text-[#e5e5e5]">{folderName}</span>
        <KbDocumentFormDialog folderId={folderId} onCreated={onDocumentCreated} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">No documents in this folder.</p>
            <KbDocumentFormDialog
              folderId={folderId}
              onCreated={onDocumentCreated}
              trigger={
                <button className="text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2">
                  Add the first document
                </button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="mt-0.5 shrink-0">{fileIcon(doc.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#e5e5e5] hover:text-violet-400 truncate block"
                  >
                    {doc.name}
                  </a>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {doc.fileType && (
                      <span className="uppercase font-medium">
                        {doc.fileType.split("/").pop()}
                      </span>
                    )}
                    {doc.fileSize != null && <span>{formatSize(doc.fileSize)}</span>}
                    <span>
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-[#e5e5e5]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isLoading}
                    onClick={() => onDelete(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
