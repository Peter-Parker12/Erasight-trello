"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Plus, Trash2, ExternalLink, Upload, Link2, Image as ImageIcon, FileText, Film, Download, Copy, X, Info, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Attachment } from "@prisma/client";

import { CardWithFullDetail } from "@/types";
import { useAction } from "@/hooks/use-action";
import { createAttachment } from "@/actions/create-attachment";
import { deleteAttachment } from "@/actions/delete-attachment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AttachmentsProps = { data: CardWithFullDetail };

type AddTab = "url" | "file";

const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

function getAttachmentType(url: string, name?: string): "image" | "video" | "file" {
  if (url.startsWith("data:image/")) return "image";
  if (url.startsWith("data:video/")) return "video";
  const src = (name ?? url).split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(src)) return "image";
  if (["mp4", "mov", "avi", "mkv", "webm", "m4v"].includes(src)) return "video";
  return "file";
}

function AttachmentPreview({ url, name }: { url: string; name: string }) {
  const type = getAttachmentType(url, name);
  if (type === "image") {
    return (
      <div className="w-14 h-10 rounded overflow-hidden border border-[#333] bg-[#2a2a2a] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (type === "video") {
    return (
      <div className="w-14 h-10 bg-[#171717] rounded flex items-center justify-center shrink-0 border border-[#333]">
        <Film className="h-5 w-5 text-[#888]" />
      </div>
    );
  }
  return (
    <div className="w-14 h-10 bg-[#2a2a2a] rounded flex items-center justify-center shrink-0 border border-[#333]">
      <FileText className="h-5 w-5 text-[#555]" />
    </div>
  );
}

export const Attachments = ({ data }: AttachmentsProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<AddTab>("url");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedAttId, setSelectedAttId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewPanelId, setReviewPanelId] = useState<string | null>(null);
  const [partnerSlug, setPartnerSlug] = useState("");

  const downloadAttachment = (att: Attachment) => {
    const a = document.createElement("a");
    a.href = att.url;
    a.download = att.name;
    if (!att.url.startsWith("data:")) a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success("Đã sao chép liên kết"));
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["card", data.id] });

  const handleReview = async (att: Attachment) => {
    setReviewingId(att.id);
    try {
      const res = await fetch("/api/actions/review-attachment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachmentId: att.id,
          cardId: data.id,
          boardId,
          partnerSlug: partnerSlug.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Review failed");
      } else {
        invalidate();
        setReviewPanelId(att.id);
        toast.success("Review completed");
      }
    } catch {
      toast.error("Could not connect to review service");
    } finally {
      setReviewingId(null);
    }
  };

  const { execute: execCreate, isLoading: isCreating } = useAction(createAttachment, {
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setName("");
      setUrl("");
    },
    onError: (e) => toast.error(e),
    timeoutMs: 30000,
    timeoutMessage: "Quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.",
  });

  const { execute: execDelete } = useAction(deleteAttachment, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast.error(`File quá lớn. Tối đa ${MAX_FILE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setFileLoading(true);
    setName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUrl(ev.target?.result as string);
      setFileLoading(false);
    };
    reader.onerror = () => {
      toast.error("Không thể đọc file.");
      setFileLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAttach = () => {
    if (!name.trim() || !url.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    execCreate({ cardId: data.id, boardId, name: name.trim(), url: url.trim() });
  };

  const resetForm = () => {
    setShowForm(false);
    setName("");
    setUrl("");
    setTab("url");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-start gap-x-3 w-full">
      <Paperclip className="h-5 w-5 mt-0.5 text-[#e5e5e5] shrink-0" />
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-[#e5e5e5]">Tệp đính kèm</p>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />
            <input
              value={partnerSlug}
              onChange={(e) => setPartnerSlug(e.target.value)}
              placeholder="Partner slug (optional)"
              className="text-[11px] bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-[#ccc] placeholder:text-[#555] focus:outline-none focus:border-emerald-600/50 w-40"
            />
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          {data.attachments.map((att) => {
            const attType = getAttachmentType(att.url, att.name);
            const isBase64 = att.url.startsWith("data:");
            const isSelected = selectedAttId === att.id;
            const ext = att.name.split(".").pop()?.toUpperCase() ?? "FILE";

            // Estimate file size from base64
            let sizeLabel = "";
            if (isBase64) {
              const base64Data = att.url.split(",")[1] ?? "";
              const bytes = Math.round((base64Data.length * 3) / 4);
              sizeLabel = bytes > 1024 * 1024
                ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
                : bytes > 1024
                ? `${(bytes / 1024).toFixed(0)} KB`
                : `${bytes} B`;
            }

            return (
              <div key={att.id} className="rounded-lg border border-transparent hover:border-[#333] overflow-hidden transition">
                {/* Row */}
                <div
                  className={cn(
                    "flex items-center gap-3 group p-2 rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition",
                    isSelected && "bg-violet-600/10 border-violet-600/30"
                  )}
                  onClick={() => setSelectedAttId(isSelected ? null : att.id)}
                >
                  <AttachmentPreview url={att.url} name={att.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e5e5e5] truncate flex items-center gap-1">
                      {attType === "image" ? <ImageIcon className="h-3 w-3 shrink-0 text-[#555]" /> : attType === "video" ? <Film className="h-3 w-3 shrink-0 text-[#555]" /> : <FileText className="h-3 w-3 shrink-0 text-[#555]" />}
                      {att.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(att.createdAt), "dd/MM/yyyy")}
                      {isBase64 && sizeLabel && <span className="ml-2 text-[10px] bg-[#333] px-1 py-0.5 rounded text-[#888]">{sizeLabel}</span>}
                      {isBase64 && <span className="ml-1 text-[10px] bg-[#333] px-1 py-0.5 rounded text-[#888]">File nội bộ</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn("text-[10px] text-muted-foreground transition", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      <Info className="h-3.5 w-3.5" />
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); execDelete({ id: att.id, boardId }); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Detail panel */}
                {isSelected && (
                  <div className="border-t border-[#333] bg-[#1f1f1f] px-3 py-3 space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Large preview */}
                      <div className="shrink-0">
                        {attType === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={att.url} alt={att.name} className="max-h-36 max-w-[180px] rounded-md border border-[#333] object-contain bg-[#2a2a2a] shadow-sm" />
                        ) : attType === "video" ? (
                          <video src={att.url} className="max-h-36 max-w-[180px] rounded-md border border-[#333] shadow-sm" controls />
                        ) : (
                          <div className="w-16 h-16 bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center border border-[#333] shadow-sm gap-1">
                            <FileText className="h-7 w-7 text-[#555]" />
                            <span className="text-[9px] font-bold text-[#888] uppercase">{ext}</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold text-[#e5e5e5] truncate">{att.name}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Loại</p>
                            <p className="text-xs font-medium capitalize text-[#e5e5e5]">
                              {attType === "image" ? "Hình ảnh" : attType === "video" ? "Video" : "Tài liệu"} {!isBase64 && "(URL)"}
                            </p>
                          </div>
                          {sizeLabel && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Kích thước</p>
                              <p className="text-xs font-medium text-[#e5e5e5]">{sizeLabel}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Thêm lúc</p>
                            <p className="text-xs font-medium text-[#e5e5e5]">{format(new Date(att.createdAt), "HH:mm dd/MM/yyyy")}</p>
                          </div>
                          {!isBase64 && (
                            <div className="col-span-2">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">URL</p>
                              <p className="text-xs text-violet-400 truncate">{att.url}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => downloadAttachment(att)}
                            className="inline-flex items-center gap-1 text-xs bg-[#e5e5e5] text-[#171717] px-2.5 py-1 rounded-md hover:bg-[#ccc] transition font-medium"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Tải xuống
                          </button>
                          {!isBase64 && (
                            <>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-violet-600/10 text-violet-400 border border-violet-600/30 px-2.5 py-1 rounded-md hover:bg-violet-600/20 transition font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Mở liên kết
                              </a>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyUrl(att.url); }}
                                className="inline-flex items-center gap-1 text-xs bg-[#2a2a2a] text-[#e5e5e5] border border-[#333] px-2.5 py-1 rounded-md hover:bg-[#333] transition font-medium"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Sao chép
                              </button>
                            </>
                          )}
                          <button
                            disabled={reviewingId === att.id}
                            onClick={(e) => { e.stopPropagation(); handleReview(att); }}
                            className="inline-flex items-center gap-1 text-xs bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 px-2.5 py-1 rounded-md hover:bg-emerald-600/20 transition font-medium disabled:opacity-50 disabled:cursor-wait"
                          >
                            {reviewingId === att.id ? (
                              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {reviewingId === att.id ? "Đang xem xét..." : att.review ? "Xem xét lại" : "AI Review"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedAttId(null); }}
                            className="ml-auto text-muted-foreground hover:text-[#e5e5e5]"
                            title="Đóng"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* AI Review panel */}
                        {att.review && (
                          <div className="mt-3 border-t border-[#333] pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400">AI Review</span>
                                {att.reviewedAt && (
                                  <span className="text-[10px] text-muted-foreground">
                                    · {format(new Date(att.reviewedAt), "HH:mm dd/MM/yyyy")}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setReviewPanelId(reviewPanelId === att.id ? null : att.id); }}
                                className="text-[10px] text-muted-foreground hover:text-[#e5e5e5] transition"
                              >
                                {reviewPanelId === att.id ? "Thu gọn" : "Xem"}
                              </button>
                            </div>
                            {(reviewPanelId === att.id) && (
                              <div className="bg-[#171717] rounded-md p-3 text-xs text-[#ccc] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border border-[#333]">
                                {att.review}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showForm ? (
          <div className="border border-[#333] rounded-lg bg-[#1f1f1f] overflow-hidden">
            <div className="flex border-b border-[#333] bg-[#171717]">
              <button
                onClick={() => { setTab("url"); setName(""); setUrl(""); }}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors", tab === "url" ? "text-violet-400 border-b-2 border-violet-500 bg-violet-600/10" : "text-muted-foreground hover:text-[#e5e5e5]")}
              >
                <Link2 className="h-3.5 w-3.5" />
                Nhập URL
              </button>
              <button
                onClick={() => { setTab("file"); setName(""); setUrl(""); }}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors", tab === "file" ? "text-violet-400 border-b-2 border-violet-500 bg-violet-600/10" : "text-muted-foreground hover:text-[#e5e5e5]")}
              >
                <Upload className="h-3.5 w-3.5" />
                Tải file lên
              </button>
            </div>

            <div className="p-3 space-y-2">
              {tab === "url" ? (
                <>
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên hiển thị..." className="w-full text-sm border border-[#333] rounded-md p-2 bg-[#2a2a2a] text-[#e5e5e5] focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full text-sm border border-[#333] rounded-md p-2 bg-[#2a2a2a] text-[#e5e5e5] focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </>
              ) : (
                <>
                  <div className="border-2 border-dashed border-[#333] rounded-lg p-4 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-600/10 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    {url ? (
                      <div className="flex flex-col items-center gap-1">
                        {url.startsWith("data:image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="preview" className="max-h-24 rounded shadow-sm" />
                        ) : url.startsWith("data:video/") ? (
                          <div className="flex flex-col items-center gap-1">
                            <Film className="h-8 w-8 text-violet-400" />
                            <span className="text-[10px] bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded">Video</span>
                          </div>
                        ) : (
                          <FileText className="h-8 w-8 text-violet-400" />
                        )}
                        <p className="text-xs font-medium text-[#e5e5e5] truncate max-w-full">{name}</p>
                        <p className="text-[10px] text-muted-foreground">Nhấn để đổi file</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <p className="text-xs font-medium">Nhấn để chọn file</p>
                        <p className="text-[10px]">Ảnh (JPEG, PNG, GIF...), PDF, Word, Excel, Video (MP4, MOV...) — tối đa {MAX_FILE_MB}MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,video/mp4,video/quicktime,video/x-msvideo,video/webm,.mov" onChange={handleFileChange} />
                  </div>
                  {name && (
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên file..." className="w-full text-sm border border-[#333] rounded-md p-2 bg-[#2a2a2a] text-[#e5e5e5] focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  )}
                </>
              )}
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" disabled={isCreating || fileLoading || !name.trim() || !url.trim()} onClick={handleAttach}>
                  {fileLoading ? "Đang đọc..." : "Đính kèm"}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetForm}>Hủy</Button>
              </div>
            </div>
          </div>
        ) : (
          <Button variant="gray" size="inline" className="text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm đính kèm
          </Button>
        )}
      </div>
    </div>
  );
};
