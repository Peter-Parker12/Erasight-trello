"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
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

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const GOOGLE_RE = /(?:docs|drive)\.google\.com\//;

type UrlCheckState = "idle" | "checking" | "ok" | "failed";

type Props = {
  folderId: string;
  onCreated?: (doc: KbDocument) => void;
  trigger?: React.ReactNode;
};

export const KbDocumentFormDialog = ({ folderId, onCreated, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "link">("upload");

  // Upload tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Link tab state
  const [linkUrl, setLinkUrl] = useState("");
  const [urlCheckState, setUrlCheckState] = useState<UrlCheckState>("idle");
  const [urlCheckHint, setUrlCheckHint] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { execute, isLoading } = useAction(createKbDocument, {
    skipRefresh: true,
    onSuccess: (doc) => {
      toast.success(`"${doc.name}" added.`);
      onCreated?.(doc);
      handleClose();
    },
    onError: (err) => toast.error(err),
  });

  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploading(false);
    setLinkUrl("");
    setUrlCheckState("idle");
    setUrlCheckHint("");
    if (fileRef.current) fileRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
    if (descRef.current) descRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setOpen(false);
    resetForm();
  }, [resetForm]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error("File exceeds the 50 MB limit.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    if (file && nameRef.current && !nameRef.current.value.trim()) {
      nameRef.current.value = file.name.replace(/\.[^.]+$/, "");
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File exceeds the 50 MB limit.");
      return;
    }
    setSelectedFile(file);
    if (nameRef.current && !nameRef.current.value.trim()) {
      nameRef.current.value = file.name.replace(/\.[^.]+$/, "");
    }
  };

  const checkGoogleUrl = async (url: string) => {
    if (!GOOGLE_RE.test(url)) {
      setUrlCheckState("idle");
      return;
    }
    setUrlCheckState("checking");
    setUrlCheckHint("");
    try {
      const res = await fetch("/api/kb/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json() as { accessible: boolean; hint?: string };
      if (json.accessible) {
        setUrlCheckState("ok");
        setUrlCheckHint("");
      } else {
        setUrlCheckState("failed");
        setUrlCheckHint(json.hint ?? "This file is not publicly accessible.");
      }
    } catch {
      setUrlCheckState("failed");
      setUrlCheckHint("Could not verify this URL. Check your connection.");
    }
  };

  const onLinkUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLinkUrl(val);
    setUrlCheckState("idle");
    setUrlCheckHint("");
  };

  const onLinkUrlBlur = () => {
    if (linkUrl.trim()) checkGoogleUrl(linkUrl.trim());
  };

  const uploadFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText) as { url?: string; error?: string };
            if (json.url) return resolve(json.url);
            reject(new Error(json.error ?? "Upload failed."));
          } catch {
            reject(new Error("Invalid server response."));
          }
        } else {
          try {
            const json = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(json.error ?? `Upload failed (${xhr.status}).`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status}).`));
          }
        }
      };

      xhr.onerror = () => {
        xhrRef.current = null;
        reject(new Error("Network error during upload."));
      };
      xhr.onabort = () => {
        xhrRef.current = null;
        reject(new Error("Upload cancelled."));
      };

      xhr.open("PUT", `/api/kb/upload?filename=${encodeURIComponent(file.name)}`);
      xhr.send(file);
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    const description = descRef.current?.value.trim() || undefined;
    if (!name) return;

    if (tab === "upload") {
      if (!selectedFile) return;
      setUploading(true);
      setUploadProgress(0);
      try {
        const url = await uploadFile(selectedFile);
        execute({
          folderId,
          name,
          description,
          url,
          fileType: selectedFile.type || undefined,
          fileSize: selectedFile.size,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed.";
        if (msg !== "Upload cancelled.") toast.error(msg);
        setUploading(false);
        setUploadProgress(0);
      }
    } else {
      const url = linkUrl.trim();
      if (!url) return;
      execute({ folderId, name, description, url });
    }
  };

  const isGoogleUrl = GOOGLE_RE.test(linkUrl.trim());
  const linkSaveBlocked =
    isGoogleUrl && (urlCheckState === "idle" || urlCheckState === "checking" || urlCheckState === "failed");
  const busy = isLoading || uploading;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
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
              onClick={() => { setTab(t); resetForm(); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm transition ${
                tab === t
                  ? "bg-violet-600 text-white"
                  : "bg-[#1f1f1f] text-muted-foreground hover:text-[#e5e5e5]"
              }`}
            >
              {t === "upload" ? <Upload className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
              {t === "upload" ? "Upload file" : "Add link"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {tab === "upload" ? (
            <div className="space-y-1.5">
              <Label>
                File{" "}
                <span className="text-muted-foreground font-normal text-xs">(max 50 MB)</span>
              </Label>
              <label
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#333] px-4 py-6 cursor-pointer hover:border-violet-500/50 transition-colors"
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {uploading ? (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[220px]">{selectedFile?.name}</span>
                      <span className="text-violet-400 tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : selectedFile ? (
                  <>
                    <Upload className="h-5 w-5 text-violet-400" />
                    <span className="text-sm text-[#e5e5e5] text-center break-all">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB — click to change
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click or drag file here</span>
                    <span className="text-xs text-muted-foreground">PDF, PPTX, DOCX, XLSX, images…</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  onChange={onFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="kb-link-url">URL</Label>
              <div className="relative">
                <Input
                  id="kb-link-url"
                  value={linkUrl}
                  onChange={onLinkUrlChange}
                  onBlur={onLinkUrlBlur}
                  placeholder="https://docs.google.com/... or any URL"
                  autoFocus
                  className={
                    urlCheckState === "failed"
                      ? "border-red-500/70 focus-visible:ring-red-500/50 pr-8"
                      : urlCheckState === "ok"
                      ? "border-green-500/70 focus-visible:ring-green-500/50 pr-8"
                      : "pr-8"
                  }
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {urlCheckState === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {urlCheckState === "ok" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {urlCheckState === "failed" && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Google URL buttons */}
              {isGoogleUrl && urlCheckState !== "checking" && (
                <button
                  type="button"
                  onClick={() => checkGoogleUrl(linkUrl.trim())}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {urlCheckState === "idle" ? "Check if publicly accessible" : "Re-check accessibility"}
                </button>
              )}

              {/* Error box */}
              {urlCheckState === "failed" && urlCheckHint && (
                <div className="flex gap-2.5 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-red-300">{urlCheckHint}</span>
                </div>
              )}

              {/* Success */}
              {urlCheckState === "ok" && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Publicly accessible
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="kb-doc-name">Name</Label>
            <Input id="kb-doc-name" ref={nameRef} placeholder="Document name" disabled={uploading} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kb-doc-desc">Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Textarea
              id="kb-doc-desc"
              ref={descRef}
              placeholder="Brief description"
              rows={2}
              disabled={uploading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                busy ||
                (tab === "upload" && !selectedFile) ||
                (tab === "link" && (!linkUrl.trim() || linkSaveBlocked))
              }
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploading
                ? `Uploading… ${uploadProgress}%`
                : isLoading
                ? "Saving…"
                : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
