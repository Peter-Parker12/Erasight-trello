import type { Card, List, Label, CardLabel, CardMember, Checklist, ChecklistItem, Comment, Attachment, ListType } from "@prisma/client";

export type ListWithCards = List & { cards: CardPreview[] };
export type CardWithList = Card & { list: List };

export type SubtaskPreview = Card & { members: CardMember[]; list: { id: string; title: string; type: ListType } };

export type CardPreview = Card & {
  labels: (CardLabel & { label: Label })[];
  members: CardMember[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
  _count: { comments: number; attachments: number };
  subtasks: SubtaskPreview[];
};

export type CardWithFullDetail = Card & {
  list: List;
  reviewListId: string | null;
  labels: (CardLabel & { label: Label })[];
  members: CardMember[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
  comments: Comment[];
  attachments: Attachment[];
  subtasks: (Card & { members: CardMember[] })[];
};

export type BoardListOption = { id: string; title: string; type: ListType; order: number };

export type SubtaskWithList = Card & { members: CardMember[]; list: { id: string; title: string; type: ListType } };

export type TaskCard = Omit<CardPreview, "subtasks"> & {
  subtasks: SubtaskWithList[];
  list: { id: string; title: string; type: ListType; board: { id: string; title: string; lists: BoardListOption[] } };
};
