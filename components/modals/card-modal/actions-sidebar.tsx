"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash, Tag, CalendarDays, Flag, CheckSquare, Paperclip, Users, Palette, Bell, BellOff, BookTemplate } from "lucide-react";
import { toast } from "sonner";
import { Priority } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";

import { CardWithFullDetail } from "@/types";
import { useAction } from "@/hooks/use-action";
import { useCardModal } from "@/hooks/use-card-modal";
import { copyCard } from "@/actions/copy-card";
import { deleteCard } from "@/actions/delete-card";
import { updateCardDates } from "@/actions/update-card-dates";
import { updateCardPriority } from "@/actions/update-card-priority";
import { createChecklist } from "@/actions/create-checklist";
import { createAttachment } from "@/actions/create-attachment";
import { toggleCardLabel } from "@/actions/toggle-card-label";
import { createLabel } from "@/actions/create-label";
import { addCardMember, removeCardMember } from "@/actions/manage-card-members";
import { saveCardTemplate } from "@/actions/save-card-template";
import { toggleCardWatch } from "@/actions/toggle-card-watch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/fetcher";
import { Label } from "@prisma/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PRESET_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#6b7280"];
const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "NONE", label: "None", color: "text-gray-500" },
  { value: "LOW", label: "Low", color: "text-blue-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HIGH", label: "High", color: "text-orange-600" },
  { value: "URGENT", label: "Urgent", color: "text-red-600" },
];

type ActionsSidebarProps = { data: CardWithFullDetail };

type ActivePopover = "labels" | "dates" | "priority" | "checklist" | "attachment" | "members" | "cover" | null;

type SidebarButtonProps = {
  icon: any;
  label: string;
  popover: ActivePopover;
  active: ActivePopover;
  onToggle: (popover: ActivePopover) => void;
};

const SidebarButton = ({ icon: Icon, label, popover, active, onToggle }: SidebarButtonProps) => (
  <div className="relative">
    <Button
      variant="gray"
      className={cn("w-full justify-start", active === popover && "bg-gray-300")}
      size="inline"
      onClick={() => onToggle(popover)}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </Button>
  </div>
);

export const ActionsSidebar = ({ data }: ActionsSidebarProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const cardModal = useCardModal();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const [active, setActive] = useState<ActivePopover>(null);
  const toggle = (p: ActivePopover) => setActive((prev) => (prev === p ? null : p));

  // Watch state
  const [watching, setWatching] = useState(false);
  const { data: watchData } = useQuery<{ watching: boolean; count: number }>({
    queryKey: ["card-watchers", data.id],
    queryFn: () => fetcher(`/api/cards/${data.id}/watchers`),
  });
  const isWatching = watchData?.watching ?? watching;

  // Form states
  const [startDate, setStartDate] = useState(data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "");
  const [dueDate, setDueDate] = useState(data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : "");
  const [checklistTitle, setChecklistTitle] = useState("");
  const [attName, setAttName] = useState("");
  const [attUrl, setAttUrl] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [coverColor, setCoverColor] = useState(data.coverColor ?? "");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["card", data.id] });
    queryClient.invalidateQueries({ queryKey: ["card-logs", data.id] });
  };

  const { data: boardLabels } = useQuery<Label[]>({
    queryKey: ["board-labels", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/labels`),
    enabled: active === "labels",
  });

  type AssignableMember = { userId: string; userName: string; userImage: string; role: string; isBoardMember: boolean };
  const { data: memberData } = useQuery<{ boardMembers: { userId: string }[]; orgMembers: AssignableMember[] }>({
    queryKey: ["board-members", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/members`),
    enabled: active === "members",
  });

  const assignableMembers: AssignableMember[] = memberData
    ? memberData.boardMembers.length === 0
      ? memberData.orgMembers
      : memberData.orgMembers.filter((m) => m.isBoardMember || m.role === "org:admin")
    : [];

  const { execute: execCopy } = useAction(copyCard, {
    onSuccess: (d) => { toast.success(`Card "${d.title}" copied.`); cardModal.onClose(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execDelete } = useAction(deleteCard, {
    onSuccess: (d) => { toast.success(`Card "${d.title}" deleted.`); cardModal.onClose(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execDates } = useAction(updateCardDates, {
    onSuccess: () => { invalidate(); setActive(null); },
    onError: (e) => toast.error(e),
  });

  const { execute: execPriority } = useAction(updateCardPriority, {
    onSuccess: () => { invalidate(); setActive(null); },
    onError: (e) => toast.error(e),
  });

  const { execute: execChecklist } = useAction(createChecklist, {
    onSuccess: () => { invalidate(); setChecklistTitle(""); setActive(null); },
    onError: (e) => toast.error(e),
  });

  const { execute: execAttachment } = useAction(createAttachment, {
    onSuccess: () => { invalidate(); setAttName(""); setAttUrl(""); setActive(null); },
    onError: (e) => toast.error(e),
  });

  const { execute: execToggleLabel } = useAction(toggleCardLabel, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const { execute: execCreateLabel } = useAction(createLabel, {
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] }); setNewLabelName(""); },
    onError: (e) => toast.error(e),
  });

  const { execute: execAddMember } = useAction(addCardMember as any, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const { execute: execRemoveMember } = useAction(removeCardMember as any, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const { execute: execSaveTemplate } = useAction(saveCardTemplate, {
    onSuccess: () => toast.success("Template saved!"),
    onError: (e) => toast.error(e),
  });

  const { execute: execToggleWatch } = useAction(toggleCardWatch, {
    onSuccess: (d) => {
      setWatching(d.watching);
      queryClient.invalidateQueries({ queryKey: ["card-watchers", data.id] });
      toast.success(d.watching ? "Watching this card" : "Stopped watching");
    },
    onError: (e) => toast.error(e),
  });

  const assignedLabelIds = new Set(data.labels.map((l) => l.labelId));
  const assignedMemberIds = new Set(data.members.map((m) => m.userId));

  const saveCoverColor = async () => {
    // Direct DB update via updateCard action (reuse existing)
    const { updateCard } = await import("@/actions/update-card");
    await updateCard({ id: data.id, boardId, coverColor: coverColor || null } as any);
    invalidate();
    setActive(null);
  };

  return (
    <div className="space-y-2 mt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add to card</p>

      <SidebarButton icon={Users} label="Members" popover="members" active={active} onToggle={toggle} />
      {active === "members" && (
        <div className="p-2 border rounded bg-white text-sm space-y-1 max-h-72 overflow-y-auto">
          {data.members.length > 0 && (
            <div className="space-y-1 mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Assigned</p>
              {data.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6"><AvatarImage src={m.userImage} /><AvatarFallback>{m.userName[0]}</AvatarFallback></Avatar>
                  <span className="flex-1 text-xs truncate">{m.userName}</span>
                  <button className="text-xs text-red-500 hover:underline shrink-0" onClick={() => execRemoveMember({ cardId: data.id, boardId, userId: m.userId } as any)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Board members</p>
          {!memberData && <Skeleton className="h-6 w-full" />}
          {memberData && assignableMembers.filter((m) => m.userId && !assignedMemberIds.has(m.userId)).length === 0 && (
            <p className="text-xs text-muted-foreground">Everyone is already assigned.</p>
          )}
          {assignableMembers
            .filter((m) => m.userId && !assignedMemberIds.has(m.userId))
            .map((m) => (
              <button
                key={m.userId}
                className="flex items-center gap-2 w-full p-1 rounded hover:bg-gray-50 text-left"
                onClick={() => execAddMember({ cardId: data.id, boardId, userId: m.userId, userName: m.userName, userImage: m.userImage } as any)}
              >
                <Avatar className="h-6 w-6"><AvatarImage src={m.userImage} /><AvatarFallback>{m.userName[0]}</AvatarFallback></Avatar>
                <span className="flex-1 text-xs truncate">{m.userName}</span>
                {m.userId === userId && <span className="text-[10px] text-muted-foreground shrink-0">(you)</span>}
              </button>
            ))}
        </div>
      )}

      <SidebarButton icon={Tag} label="Labels" popover="labels" active={active} onToggle={toggle} />
      {active === "labels" && (
        <div className="p-2 border rounded bg-white text-sm space-y-1">
          {(boardLabels ?? []).map((label) => (
            <div
              key={label.id}
              className={cn("flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50", assignedLabelIds.has(label.id) && "bg-gray-100")}
              onClick={() => execToggleLabel({ cardId: data.id, labelId: label.id, boardId })}
            >
              <div className="w-8 h-4 rounded" style={{ backgroundColor: label.color }} />
              <span className="flex-1 text-xs">{label.name}</span>
              {assignedLabelIds.has(label.id) && <span className="text-xs text-green-600">✓</span>}
            </div>
          ))}
          <div className="border-t pt-2 mt-1 space-y-1">
            <p className="text-xs font-medium">Create label</p>
            <input className="w-full border rounded p-1 text-xs" placeholder="Name" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} />
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setNewLabelColor(c)} className={cn("w-5 h-5 rounded-full border-2", newLabelColor === c ? "border-gray-800" : "border-transparent")} style={{ backgroundColor: c }} />
              ))}
            </div>
            <Button size="sm" className="h-6 text-xs w-full" onClick={() => { if (newLabelName.trim()) execCreateLabel({ boardId, name: newLabelName.trim(), color: newLabelColor }); }}>Create</Button>
          </div>
        </div>
      )}

      <SidebarButton icon={CalendarDays} label="Dates" popover="dates" active={active} onToggle={toggle} />
      {active === "dates" && (
        <div className="p-2 border rounded bg-white text-sm space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded p-1 text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border rounded p-1 text-xs mt-0.5" />
          </div>
          <Button size="sm" className="h-7 text-xs w-full" onClick={() => execDates({ id: data.id, boardId, startDate: startDate || null, dueDate: dueDate || null })}>Save</Button>
        </div>
      )}

      <SidebarButton icon={Flag} label="Priority" popover="priority" active={active} onToggle={toggle} />
      {active === "priority" && (
        <div className="p-2 border rounded bg-white text-sm space-y-1">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={cn("w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-50 flex items-center gap-2", opt.color, data.priority === opt.value && "bg-gray-100 font-semibold")}
              onClick={() => execPriority({ id: data.id, boardId, priority: opt.value })}
            >
              <Flag className="h-3 w-3" /> {opt.label}
              {data.priority === opt.value && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}

      <SidebarButton icon={CheckSquare} label="Checklist" popover="checklist" active={active} onToggle={toggle} />
      {active === "checklist" && (
        <div className="p-2 border rounded bg-white text-sm space-y-2">
          <input autoFocus className="w-full border rounded p-1 text-xs" placeholder="Checklist title..." value={checklistTitle} onChange={(e) => setChecklistTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && checklistTitle.trim()) execChecklist({ cardId: data.id, boardId, title: checklistTitle.trim() }); }} />
          <Button size="sm" className="h-7 text-xs w-full" onClick={() => { if (checklistTitle.trim()) execChecklist({ cardId: data.id, boardId, title: checklistTitle.trim() }); }}>Add</Button>
        </div>
      )}

      <SidebarButton icon={Paperclip} label="Attachment" popover="attachment" active={active} onToggle={toggle} />
      {active === "attachment" && (
        <div className="p-2 border rounded bg-white text-sm space-y-2">
          <input className="w-full border rounded p-1 text-xs" placeholder="Display name" value={attName} onChange={(e) => setAttName(e.target.value)} />
          <input className="w-full border rounded p-1 text-xs" placeholder="https://..." value={attUrl} onChange={(e) => setAttUrl(e.target.value)} />
          <Button size="sm" className="h-7 text-xs w-full" onClick={() => { if (attName.trim() && attUrl.trim()) execAttachment({ cardId: data.id, boardId, name: attName.trim(), url: attUrl.trim() }); }}>Attach</Button>
        </div>
      )}

      <SidebarButton icon={Palette} label="Cover" popover="cover" active={active} onToggle={toggle} />
      {active === "cover" && (
        <div className="p-2 border rounded bg-white text-sm space-y-2">
          <p className="text-xs text-muted-foreground">Choose a color</p>
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setCoverColor(c)} className={cn("w-7 h-7 rounded border-2", coverColor === c ? "border-gray-800" : "border-transparent")} style={{ backgroundColor: c }} />
            ))}
            <button onClick={() => setCoverColor("")} className={cn("w-7 h-7 rounded border-2 bg-gray-100 text-xs", !coverColor ? "border-gray-800" : "border-transparent")}>✕</button>
          </div>
          <Button size="sm" className="h-7 text-xs w-full" onClick={saveCoverColor}>Save</Button>
        </div>
      )}

      <div className="pt-2 border-t space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>
        <Button
          onClick={() => execToggleWatch({ cardId: data.id, boardId })}
          variant="gray"
          className={cn("w-full justify-start", isWatching && "bg-sky-100 text-sky-700")}
          size="inline"
        >
          {isWatching ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
          {isWatching ? "Unwatch" : "Watch"}
          {(watchData?.count ?? 0) > 0 && (
            <span className="ml-auto text-xs bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded-full">
              {watchData?.count}
            </span>
          )}
        </Button>
        <Button
          onClick={() => execSaveTemplate({ cardId: data.id, boardId })}
          variant="gray"
          className="w-full justify-start"
          size="inline"
        >
          <BookTemplate className="h-4 w-4 mr-2" /> Save as Template
        </Button>
        <Button onClick={() => execCopy({ id: data.id, boardId })} variant="gray" className="w-full justify-start" size="inline">
          <Copy className="h-4 w-4 mr-2" /> Copy
        </Button>
        <Button onClick={() => execDelete({ id: data.id, boardId })} variant="destructive" className="w-full justify-start" size="inline">
          <Trash className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>
    </div>
  );
};

ActionsSidebar.Skeleton = function ActionsSidebarSkeleton() {
  return (
    <div className="space-y-2 mt-2">
      <Skeleton className="w-20 h-4 bg-neutral-200" />
      {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="w-full h-8 bg-neutral-200" />)}
    </div>
  );
};
