"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { Comment } from "@prisma/client";

import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { createComment } from "@/actions/create-comment";
import { deleteComment } from "@/actions/delete-comment";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CommentsProps = { cardId: string };

export const Comments = ({ cardId }: CommentsProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["card-comments", cardId],
    queryFn: () => fetcher(`/api/cards/${cardId}/comments`),
    refetchInterval: 5000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] });

  const { execute: execCreate, isLoading: isPosting } = useAction(createComment, {
    onSuccess: () => { invalidate(); setContent(""); },
    onError: (e) => toast.error(e),
  });

  const { execute: execDelete } = useAction(deleteComment, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (content.trim()) execCreate({ cardId, boardId, content: content.trim() });
    }
  };

  return (
    <div className="flex items-start gap-x-3 w-full">
      <MessageSquare className="h-5 w-5 mt-0.5 text-neutral-700 shrink-0" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-3">Comments</p>

        {/* Comment input */}
        <div className="mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment... (Ctrl+Enter to submit)"
            className="w-full text-sm border rounded-md p-3 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 min-h-[60px]"
            rows={2}
          />
          {content.trim() && (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={isPosting}
                onClick={() => execCreate({ cardId, boardId, content: content.trim() })}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setContent("")}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Comment list */}
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
                    <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d 'at' h:mm a")}</span>
                  </div>
                  <div className="mt-0.5 text-sm bg-gray-100 rounded-md px-3 py-2 whitespace-pre-wrap">
                    {comment.content}
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
  );
};
