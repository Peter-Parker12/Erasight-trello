"use client";

import { useState } from "react";
import { Languages, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

import { CardWithFullDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TranslatePanelProps = {
  data: CardWithFullDetail;
};

const PRIORITY_VI: Record<string, string> = {
  NONE: "Không có",
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

async function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return "";
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|vi`
    );
    const json = await res.json();
    return json?.responseData?.translatedText ?? text;
  } catch {
    return text;
  }
}

type TranslatedData = {
  title: string;
  description: string;
  checklists: { title: string; items: { content: string; completed: boolean }[] }[];
  comments: { userName: string; content: string; createdAt: Date }[];
};

export const TranslatePanel = ({ data }: TranslatePanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translated, setTranslated] = useState<TranslatedData | null>(null);

  const handleTranslate = async () => {
    if (translated) {
      setIsOpen((v) => !v);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      // Build all texts to translate in parallel
      const [
        titleVi,
        descVi,
        ...rest
      ] = await Promise.all([
        translateText(data.title),
        translateText(data.description ?? ""),
        ...data.checklists.flatMap((cl) => [
          translateText(cl.title),
          ...cl.items.map((it) => translateText(it.content)),
        ]),
        ...data.comments.map((c) => translateText(c.content)),
      ]);

      // Reconstruct checklists
      let idx = 0;
      const checklistsVi: TranslatedData["checklists"] = [];
      for (const cl of data.checklists) {
        const clTitle = rest[idx++] as string;
        const items = cl.items.map((it) => ({
          content: rest[idx++] as string,
          completed: it.completed,
        }));
        checklistsVi.push({ title: clTitle, items });
      }

      // Comments
      const commentsVi: TranslatedData["comments"] = data.comments.map((c, i) => ({
        userName: c.userName,
        content: rest[idx + i] as string,
        createdAt: c.createdAt,
      }));

      setTranslated({
        title: titleVi,
        description: descVi,
        checklists: checklistsVi,
        comments: commentsVi,
      });
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const due = data.dueDate ? new Date(data.dueDate) : null;
  const start = data.startDate ? new Date(data.startDate) : null;

  return (
    <div className="w-full">
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2 text-xs gap-1.5 border",
          isOpen ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground hover:text-primary hover:border-primary/50"
        )}
        onClick={handleTranslate}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Languages className="h-3.5 w-3.5" />
        )}
        {isLoading ? "Đang dịch..." : "Dịch sang tiếng Việt"}
        {!isLoading && translated && (isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </Button>

      {/* Translation panel */}
      {isOpen && translated && (
        <div className="mt-2 border border-border rounded-lg bg-card text-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 bg-secondary border-b border-border">
            <div className="flex items-center gap-1.5 text-primary font-medium text-xs">
              <Languages className="h-3.5 w-3.5" />
              Bản dịch tiếng Việt
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Tiêu đề</p>
              <p className="text-sm font-medium text-foreground">{translated.title}</p>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold text-primary">Độ ưu tiên: </span>
                <span className="text-foreground">{PRIORITY_VI[data.priority]}</span>
              </div>
              {data.labels.length > 0 && (
                <div>
                  <span className="font-semibold text-primary">Nhãn: </span>
                  <span className="text-foreground">{data.labels.map((l) => l.label.name).join(", ")}</span>
                </div>
              )}
              {data.members.length > 0 && (
                <div>
                  <span className="font-semibold text-primary">Thành viên: </span>
                  <span className="text-foreground">{data.members.map((m) => m.userName).join(", ")}</span>
                </div>
              )}
              {start && (
                <div>
                  <span className="font-semibold text-primary">Ngày bắt đầu: </span>
                  <span className="text-foreground">{format(start, "dd/MM/yyyy")}</span>
                </div>
              )}
              {due && (
                <div>
                  <span className="font-semibold text-primary">Ngày hết hạn: </span>
                  <span className={cn("font-medium", data.completed ? "text-green-400" : due < new Date() ? "text-red-400" : "text-foreground")}>
                    {format(due, "dd/MM/yyyy")}
                    {data.completed && " ✓ Hoàn thành"}
                    {!data.completed && due < new Date() && " ⚠ Quá hạn"}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {translated.description && (
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Mô tả</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{translated.description}</p>
              </div>
            )}

            {/* Checklists */}
            {translated.checklists.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Danh sách công việc</p>
                <div className="space-y-2">
                  {translated.checklists.map((cl, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-foreground mb-0.5">☑ {cl.title}</p>
                      <ul className="space-y-0.5 pl-3">
                        {cl.items.map((it, j) => (
                          <li key={j} className={cn("text-xs flex items-center gap-1.5", it.completed ? "text-green-400" : "text-muted-foreground")}>
                            <span className="shrink-0">{it.completed ? "✓" : "○"}</span>
                            {it.content}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {translated.comments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Bình luận</p>
                <div className="space-y-2">
                  {translated.comments.map((c, i) => (
                    <div key={i} className="bg-secondary rounded border border-border px-2.5 py-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs font-medium text-foreground">{c.userName}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                      <p className="text-xs text-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">Dịch bởi MyMemory API — Có thể không chính xác hoàn toàn.</p>
          </div>
        </div>
      )}
    </div>
  );
};
