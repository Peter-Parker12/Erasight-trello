"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { addBoardMember, removeBoardMember } from "@/actions/manage-board-members";
import { cn } from "@/lib/utils";

type OrgMember = {
  userId: string;
  userName: string;
  userImage: string;
  role: string;
  isBoardMember: boolean;
};

type BoardMembersData = {
  orgMembers: OrgMember[];
};

type BoardMembersProps = {
  boardId: string;
  compact?: boolean;
};

export const BoardMembers = ({ boardId, compact = false }: BoardMembersProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<BoardMembersData>({
    queryKey: ["board-members", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/members`),
    enabled: open,
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
  };

  const { execute: execAdd, isLoading: isAdding } = useAction(addBoardMember as any, {
    onSuccess: () => { toast.success("Member added"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeBoardMember as any, {
    onSuccess: () => { toast.success("Member removed"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const boardMembers = data?.orgMembers.filter((m) => m.isBoardMember) ?? [];
  const availableMembers = data?.orgMembers.filter((m) => !m.isBoardMember) ?? [];
  const isRestricted = boardMembers.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={compact ? "ghost" : "transparent"}
          className={cn(
            "h-auto w-auto p-1",
            compact ? "bg-black/40 hover:bg-black/60 text-white rounded" : "p-2 text-white",
          )}
        >
          <Users className="h-4 w-4" />
          {!compact && <span className="text-sm ml-1">Members</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 pt-3 pb-3 px-0" side="bottom" align="start">
        <div className="text-sm font-medium text-center text-neutral-600 pb-2 px-3">
          Board Members
        </div>
        <PopoverClose asChild>
          <Button
            className="h-auto w-auto p-2 absolute top-2 right-2 text-neutral-600"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : isError ? (
          <div className="px-3 py-4 text-sm text-red-500 text-center">
            Failed to load members. Make sure the database schema is up to date (<code>prisma db push</code>).
          </div>
        ) : (
          <div className="space-y-3 px-3">
            {/* Access mode indicator */}
            <p className="text-xs text-muted-foreground">
              {isRestricted
                ? "This board is restricted — only assigned members can access it."
                : "This board is open to all org members. Add a member below to restrict access."}
            </p>

            {/* Current board members */}
            {boardMembers.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned</p>
                {boardMembers.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2 py-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.userImage} />
                      <AvatarFallback>{m.userName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm truncate">{m.userName}</span>
                    <button
                      disabled={isRemoving}
                      className="text-xs text-red-500 hover:underline shrink-0"
                      onClick={() => execRemove({ boardId, userId: m.userId } as any)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Org members to add */}
            {availableMembers.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add members</p>
                {availableMembers.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2 py-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.userImage} />
                      <AvatarFallback>{m.userName[0]}</AvatarFallback>
                    </Avatar>
                    <span className={cn("flex-1 text-sm truncate", m.role === "org:admin" && "text-muted-foreground italic")}>
                      {m.userName}
                      {m.role === "org:admin" && " (admin)"}
                    </span>
                    <button
                      disabled={isAdding}
                      className="text-xs text-sky-600 hover:underline shrink-0"
                      onClick={() => execAdd({ boardId, userId: m.userId, userName: m.userName, userImage: m.userImage } as any)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {data?.orgMembers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No other org members found.</p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
