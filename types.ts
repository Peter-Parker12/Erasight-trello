import type { Card, List, Label, CardLabel, CardMember, Checklist, ChecklistItem, Comment, Attachment } from "@prisma/client";

export type ListWithCards = List & { cards: CardPreview[] };
export type CardWithList = Card & { list: List };

export type CardPreview = Card & {
  labels: (CardLabel & { label: Label })[];
  members: CardMember[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
  _count: { comments: number; attachments: number };
};

export type CardWithFullDetail = Card & {
  list: List;
  labels: (CardLabel & { label: Label })[];
  members: CardMember[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
  comments: Comment[];
  attachments: Attachment[];
};
