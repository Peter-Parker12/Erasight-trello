"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, CalendarDays, MessageSquareWarning } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/fetcher";

type OrgMember = {
  userId: string;
  userName: string;
  userImage: string;
  role: string;
  isBoardMember: boolean;
};

type TransitionActionModalProps = {
  open: boolean;
  boardId: string;
  destinationListName: string;
  actions: string[];
  onConfirm: (assignee: OrgMember | null, dueDate: string | null, reason: string | null) => void;
  onCancel: () => void;
};

export const TransitionActionModal = ({
  open,
  boardId,
  destinationListName,
  actions,
  onConfirm,
  onCancel,
}: TransitionActionModalProps) => {
  const [selectedAssignee, setSelectedAssignee] = useState<OrgMember | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");

  const needsAssignee = actions.includes("ADD_ASSIGNEE");
  const needsDueDate = actions.includes("ADD_DUE_DATE");
  const needsReason = actions.includes("ADD_REASON");

  const { data: memberData } = useQuery<{ boardMembers: { userId: string }[]; orgMembers: OrgMember[] }>({
    queryKey: ["board-members", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/members`),
    enabled: open && needsAssignee,
  });

  const assignableMembers = memberData
    ? memberData.boardMembers.length === 0
      ? memberData.orgMembers
      : memberData.orgMembers.filter((m) => m.isBoardMember)
    : [];

  const isValid =
    (!needsAssignee || selectedAssignee !== null) &&
    (!needsDueDate || dueDate !== "") &&
    (!needsReason || reason.trim() !== "");

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(
      needsAssignee ? selectedAssignee : null,
      needsDueDate && dueDate ? dueDate : null,
      needsReason && reason.trim() ? reason.trim() : null,
    );
    setSelectedAssignee(null);
    setDueDate("");
    setReason("");
  };

  const handleCancel = () => {
    setSelectedAssignee(null);
    setDueDate("");
    setReason("");
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            Moving to &ldquo;{destinationListName}&rdquo;
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            This list requires additional info before the card can be moved.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {needsAssignee && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" />
                Assign a member
              </p>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-md border p-1">
                {assignableMembers.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => setSelectedAssignee(selectedAssignee?.userId === m.userId ? null : m)}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm text-left transition ${
                      selectedAssignee?.userId === m.userId
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.userImage} />
                      <AvatarFallback className="text-[10px]">{m.userName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{m.userName}</span>
                  </button>
                ))}
                {assignableMembers.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-1">No members found.</p>
                )}
              </div>
            </div>
          )}

          {needsDueDate && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Set a due date
              </p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-input bg-input text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {needsReason && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquareWarning className="h-4 w-4" />
                Reason
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this card being moved here?"
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!isValid}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
