"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2, AtSign, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import type { Comment } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { createComment } from "@/actions/create-comment";
import { deleteComment } from "@/actions/delete-comment";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CommentsProps = { cardId: string };
type MemberOption = { userId: string; userName: string; userImage: string };

const renderWithMentions = (text: string) =>
  text.replace(/@(\S+)/g, "**@$1**");

export const Comments = ({ cardId }: CommentsProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["card-comments", cardId],
    queryFn: () => fetcher(`/api/cards/${cardId}/comments`),
    refetchInterval: 5000,
  });

  const { data: boardMembers } = useQuery<MemberOption[]>({
    queryKey: ["board-members-mentions", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/members`).then((res: { orgMembers: MemberOption[] }) => res.orgMembers),
    enabled: !!boardId,
  });

  const mentionSuggestions = (boardMembers ?? []).filter(
    (m) =>
      mentionQuery !== null &&
      (m.userName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        m.userId.toLowerCase().includes(mentionQuery.toLowerCase()))
  ).slice(0, 6);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] });

  const { execute: execCreate, isLoading: isPosting } = useAction(createComment, {
    onSuccess: () => { invalidate(); setContent(""); setImagePreview(null); },
    onError: (e) => toast.error(e),
  });

  const { execute: execDelete } = useAction(deleteComment, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member: MemberOption) => {
    const before = content.slice(0, mentionStart);
    const after = content.slice(
      textareaRef.current?.selectionStart ?? mentionStart + (mentionQuery?.length ?? 0) + 1
    );
    const inserted = `@${member.userName.replace(/\s+/g, "")} `;
    setContent(before + inserted + after);
    setMentionQuery(null);
    setTimeout(() => {
      textareaRef.current?.focus();
      const pos = before.length + inserted.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionSuggestions[mentionIndex]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (content.trim() || imagePreview) {
        execCreate({ cardId, boardId, content: content.trim(), imageUrl: imagePreview ?? undefined });
      }
    }
  };

  const canSubmit = content.trim().length > 0 || !!imagePreview;

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full p-1"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Comment image"
            className="max-w-[80vw] max-h-[80vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex items-start gap-x-3 w-full">
        <MessageSquare className="h-5 w-5 mt-0.5 text-[#e5e5e5] shrink-0" />
        <div className="w-full">
          <p className="font-semibold text-[#e5e5e5] mb-3">Comments</p>

          <div className="mb-4 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment… (@name to mention, Ctrl+Enter to submit)"
              maxLength={10000}
              className="w-full text-sm border border-[#333] bg-[#2a2a2a] text-[#e5e5e5] rounded-md p-3 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 transition-[min-height] duration-150 min-h-[42px] focus:min-h-[120px]"
              rows={2}
            />
            <div className="flex justify-end mt-0.5">
              <span className={cn(
                "text-[11px] tabular-nums",
                content.length > 9000 ? "text-red-400" : content.length > 8000 ? "text-amber-400" : "text-muted-foreground"
              )}>
                {content.length.toLocaleString()} / 10,000
              </span>
            </div>

            {/* Image preview in form */}
            {imagePreview && (
              <div className="relative mt-1 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" className="max-h-32 rounded-md border object-cover" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute -top-1.5 -right-1.5 bg-[#1f1f1f] border border-[#333] rounded-full p-0.5 hover:bg-red-900/30"
                >
                  <X className="h-3 w-3 text-[#888]" />
                </button>
              </div>
            )}

            {mentionQuery !== null && mentionSuggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 bg-[#1f1f1f] border border-[#333] rounded-lg w-56 overflow-hidden bottom-full mb-1"
              >
                {mentionSuggestions.map((m, i) => (
                  <button
                    key={m.userId}
                    onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition",
                      i === mentionIndex && "bg-violet-600/20"
                    )}
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={m.userImage} />
                      <AvatarFallback className="text-[9px]">{m.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{m.userName}</span>
                  </button>
                ))}
                <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground flex items-center gap-1">
                  <AtSign className="h-3 w-3" /> press Enter to select
                </div>
              </div>
            )}

            {canSubmit && (
              <div className="flex gap-2 mt-1 items-center">
                <Button size="sm" className="h-7 text-xs" disabled={isPosting}
                  onClick={() => execCreate({ cardId, boardId, content: content.trim(), imageUrl: imagePreview ?? undefined })}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setContent(""); setImagePreview(null); }}>
                  Cancel
                </Button>
              </div>
            )}

            {!canSubmit && (
              <div className="flex items-center gap-1 mt-1">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-400 transition px-1 py-0.5 rounded hover:bg-[#2a2a2a]"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Attach image
                </button>
              </div>
            )}

            {canSubmit && (
              <div className="flex items-center gap-1 mt-1">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-400 transition px-1 py-0.5 rounded hover:bg-[#2a2a2a]"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {imagePreview ? "Change image" : "Attach image"}
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ol className="space-y-3">
              {(comments ?? []).map((comment) => (
                <li key={comment.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.userImage} alt={comment.userName} />
                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM d 'at' h:mm a")}
                      </span>
                    </div>
                    <div className="mt-0.5 text-sm bg-[#2a2a2a] rounded-md px-3 py-2">
                      {comment.content && (
                        <div className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-li:my-0 prose-code:bg-[#333] prose-code:px-1 prose-code:rounded [&_strong]:text-violet-400 prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {renderWithMentions(comment.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                      {(comment as any).imageUrl && (
                        <div className={cn(comment.content && "mt-2")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={(comment as any).imageUrl}
                            alt="Comment image"
                            className="max-h-48 rounded-md object-cover cursor-zoom-in hover:opacity-90 transition"
                            onClick={() => setLightboxSrc((comment as any).imageUrl)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {comment.userId === userId && (
                    <button
                      onClick={() => execDelete({ id: comment.id, boardId })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition self-start mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
};
