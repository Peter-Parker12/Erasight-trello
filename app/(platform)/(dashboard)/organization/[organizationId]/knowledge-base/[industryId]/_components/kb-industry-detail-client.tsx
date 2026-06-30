"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Folder, Library } from "lucide-react";
import type { KbFolder, KbDocument, KbIndustry } from "@prisma/client";

import { KbFolderPanel } from "./kb-folder-panel";
import { KbDocumentsPanel } from "./kb-documents-panel";

type FolderWithDocs = KbFolder & {
  _count: { documents: number };
  documents: KbDocument[];
};

type KbIndustryDetailClientProps = {
  industry: KbIndustry;
  initialFolders: FolderWithDocs[];
  organizationId: string;
};

export const KbIndustryDetailClient = ({
  industry,
  initialFolders,
  organizationId,
}: KbIndustryDetailClientProps) => {
  const [folders, setFolders] = useState(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    initialFolders[0]?.id ?? null
  );

  useEffect(() => {
    setFolders(initialFolders);
    setSelectedFolderId((prev) => {
      if (prev && initialFolders.find((f) => f.id === prev)) return prev;
      return initialFolders[0]?.id ?? null;
    });
  }, [initialFolders]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  const handleFolderCreated = (folder: KbFolder & { _count: { documents: number } }) => {
    const full: FolderWithDocs = { ...folder, documents: [] };
    setFolders((prev) => [...prev, full]);
    setSelectedFolderId(folder.id);
  };

  const handleFolderDeleted = (id: string) => {
    setFolders((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (selectedFolderId === id) {
        setSelectedFolderId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleDocumentCreated = (doc: KbDocument) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === doc.folderId
          ? { ...f, documents: [...f.documents, doc], _count: { documents: f._count.documents + 1 } }
          : f
      )
    );
  };

  const handleDocumentDeleted = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        const hadDoc = f.documents.some((d) => d.id === id);
        if (!hadDoc) return f;
        return {
          ...f,
          documents: f.documents.filter((d) => d.id !== id),
          _count: { documents: f._count.documents - 1 },
        };
      })
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/organization/${organizationId}/knowledge-base`}
          className="flex items-center gap-1 hover:text-[#e5e5e5] transition-colors"
        >
          <Library className="h-3.5 w-3.5" />
          Knowledge Base
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
        <span className="text-[#e5e5e5] font-medium flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5 text-violet-400" />
          {industry.name}
        </span>
      </div>

      {industry.description && (
        <p className="text-sm text-muted-foreground -mt-2">{industry.description}</p>
      )}

      {/* Two-panel layout */}
      <div className="flex gap-0 flex-1 min-h-0 rounded-lg border border-[#333] overflow-hidden">
        {/* Left: folder list */}
        <div className="w-56 shrink-0 border-r border-[#333] bg-[#1a1a1a]">
          <KbFolderPanel
            industryId={industry.id}
            folders={folders.map(({ documents: _docs, ...f }) => f)}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onFolderCreated={handleFolderCreated}
            onFolderDeleted={handleFolderDeleted}
          />
        </div>

        {/* Right: document list */}
        <div className="flex-1 min-w-0 bg-[#1f1f1f]">
          {selectedFolder ? (
            <KbDocumentsPanel
              folderId={selectedFolder.id}
              folderName={selectedFolder.name}
              documents={selectedFolder.documents}
              onDocumentCreated={handleDocumentCreated}
              onDocumentDeleted={handleDocumentDeleted}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Folder className="h-10 w-10 opacity-30" />
              <p className="text-sm">Create a folder to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
