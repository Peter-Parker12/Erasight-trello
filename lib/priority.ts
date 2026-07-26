import { Priority } from "@prisma/client";

// Single source of truth for priority ordering/labels/colors — previously
// redeclared with drift in card-meta.tsx, card-item.tsx, and list-view.tsx.
export const PRIORITY_ORDER: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  NONE: "None",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

// Full badge styling (bg/20 + text/400 scale). NONE uses neutral theme tokens
// since it isn't a semantic accent color; LOW/MEDIUM/HIGH/URGENT intentionally
// stay on the Tailwind palette scale rather than theme tokens.
export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  NONE: "bg-muted text-muted-foreground",
  LOW: "bg-blue-500/20 text-blue-400",
  MEDIUM: "bg-yellow-500/20 text-yellow-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  URGENT: "bg-red-500/20 text-red-400",
};

// Solid dot color for compact renderings (e.g. board card corner dot).
export const PRIORITY_DOT_CLASS: Record<Priority, string> = {
  NONE: "",
  LOW: "bg-blue-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

// Text-only color, no background (e.g. inline icon/label tinting).
export const PRIORITY_TEXT_CLASS: Record<Priority, string> = {
  NONE: "",
  LOW: "text-blue-500",
  MEDIUM: "text-yellow-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};
