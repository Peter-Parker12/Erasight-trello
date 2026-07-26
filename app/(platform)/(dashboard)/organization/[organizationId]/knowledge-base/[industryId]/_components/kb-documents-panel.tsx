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
  Link as LinkIcon,
  Monitor,
} from "lucide-react";
import type { KbDocument } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { deleteKbDocument } from "@/actions/delete-kb-document";
import { KbDocumentFormDialog } from "./kb-document-form-dialog";

const MIME_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "text/csv": "CSV",
  "text/plain": "TXT",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "image/svg+xml": "SVG",
};

function fileTypeLabel(fileType: string | null): string {
  if (!fileType) return "";
  return MIME_LABEL[fileType] ?? fileType.split("/").pop()?.toUpperCase() ?? "";
}

function fileIcon(fileType: string | null, isLink: boolean) {
  if (isLink) return <LinkIcon className="h-4 w-4 text-primary" />;
  if (!fileType) return <File className="h-4 w-4 text-muted-foreground" />;
  if (fileType.includes("pdf") || fileType.includes("word") || fileType.includes("document"))
    return <FileText className="h-4 w-4 text-blue-400" />;
  if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv"))
    return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Monitor className="h-4 w-4 text-orange-400" />;
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

type Props = {
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
}: Props) => {
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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-sm font-medium text-foreground">{folderName}</span>
        <KbDocumentFormDialog folderId={folderId} onCreated={onDocumentCreated} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">No documents in this folder yet.</p>
            <KbDocumentFormDialog
              folderId={folderId}
              onCreated={onDocumentCreated}
              trigger={
                <Button variant="link" size="inline" className="text-sm">
                  Add the first document
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {documents.map((doc) => {
              const isLink = !doc.url.startsWith("/api/kb/files/");
              const label = isLink ? "Link" : fileTypeLabel(doc.fileType);
              return (
                <div
                  key={doc.id}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors"
                >
                  <div className="mt-0.5 shrink-0">{fileIcon(doc.fileType, isLink)}</div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary truncate block"
                    >
                      {doc.name}
                    </a>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {label && (
                        <span className="font-medium text-muted-foreground/80">{label}</span>
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
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Open"
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
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
