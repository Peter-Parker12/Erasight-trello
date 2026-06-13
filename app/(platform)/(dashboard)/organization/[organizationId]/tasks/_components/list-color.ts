import { ListType } from "@prisma/client";

const LIST_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#06b6d4"];

export const getListColor = (title: string): string => {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  return LIST_COLORS[Math.abs(h) % LIST_COLORS.length];
};

export const statusColor = (list: { type: ListType; title: string }): string => {
  if (list.type === "DONE") return "#22c55e";
  if (list.type === "FAILED") return "#ef4444";
  if (list.type === "CANCELLED") return "#6b7280";
  return getListColor(list.title);
};
