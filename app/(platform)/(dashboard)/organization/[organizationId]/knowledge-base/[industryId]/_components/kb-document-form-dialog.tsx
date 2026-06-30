"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import type { KbDocument } from "@prisma/client";

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
import { createKbDocument } from "@/actions/create-kb-document";

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

type KbDocumentFormDialogProps = {
  folderId: string;
  onCreated?: (doc: KbDocument) => void;
  trigger?: React.ReactNode;
};

export const KbDocumentFormDialog = ({ folderId, onCreated, trigger }: KbDocumentFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "link">("upload");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { execute, isLoading } = useAction(createKbDocument, {
    skipRefresh: true,
    onSuccess: (doc) => {
      toast.success(`"${doc.name}" added.`);
      onCreated?.(doc);
      resetForm();
      setOpen(false);
    },
    onError: (error) => toast.error(error),
  });

  const resetForm = () => {
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
    if (urlRef.current) urlRef.current.value = "";
    if (descRef.current) descRef.current.value = "";
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error(`File exceeds the ${MAX_FILE_MB} MB limit.`);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    if (file && nameRef.current && !nameRef.current.value.trim()) {
      nameRef.current.value = file.name.replace(/\.[^.]+$/, "");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    const description = descRef.current?.value.trim() || undefined;
    if (!name) return;

    if (tab === "upload") {
      if (!selectedFile) return;
      setUploading(true);
      try {
        const res = await fetch(
          `/api/kb/upload?filename=${encodeURIComponent(selectedFile.name)}`,
          { method: "PUT", body: selectedFile }
        );
        const json = await res.json() as { url?: string; error?: string };
        if (!res.ok || !json.url) {
          toast.error(json.error ?? "Upload failed.");
          return;
        }
        execute({
          folderId,
          name,
          description,
          url: json.url,
          fileType: selectedFile.type || selectedFile.name.split(".").pop(),
          fileSize: selectedFile.size,
        });
      } catch {
        toast.error("Upload failed. Check your connection and try again.");
      } finally {
        setUploading(false);
      }
    } else {
      const url = urlRef.current?.value.trim() ?? "";
      if (!url) return;
      execute({ folderId, name, description, url });
    }
  };

  const busy = isLoading || uploading;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex rounded-md overflow-hidden border border-[#333] w-fit">
          {(["upload", "link"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm transition ${
                tab === t
                  ? "bg-violet-600 text-white"
                  : "bg-[#1f1f1f] text-muted-foreground hover:text-[#e5e5e5]"
              }`}
            >
              {t === "upload" ? <Upload className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
              {t === "upload" ? "Upload file" : "Link (URL)"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {tab === "upload" ? (
            <div className="space-y-1.5">
              <Label>
                File{" "}
                <span className="text-muted-foreground font-normal">
                  (max {MAX_FILE_MB} MB)
                </span>
              </Label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#333] px-4 py-6 cursor-pointer hover:border-violet-500/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                {selectedFile ? (
                  <span className="text-sm text-[#e5e5e5] text-center break-all">
                    {selectedFile.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Click to browse
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  onChange={onFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="kb-doc-url">URL</Label>
              <Input
                id="kb-doc-url"
                ref={urlRef}
                placeholder="https://drive.google.com/..."
                autoFocus
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="kb-doc-name">Name</Label>
            <Input id="kb-doc-name" ref={nameRef} placeholder="Document name" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kb-doc-desc">Description (optional)</Label>
            <Textarea
              id="kb-doc-desc"
              ref={descRef}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || (tab === "upload" && !selectedFile)}
            >
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploading ? "Uploading…" : isLoading ? "Saving…" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
