"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, AlertCircle, X, CheckCircle2, Download } from "lucide-react";
import * as XLSX from "xlsx";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIORITY_BADGE_CLASS } from "@/lib/priority";

type List = { id: string; title: string };

type ParsedRow = {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
};

type ImportCardsDialogProps = {
  open: boolean;
  onClose: () => void;
  boardId: string;
  lists: List[];
};

const PRIORITY_VALUES = ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"];

function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const rows: ParsedRow[] = json
          .map((row) => {
            const normalised: Record<string, string> = {};
            for (const [k, v] of Object.entries(row)) {
              normalised[k.trim().toLowerCase()] = String(v ?? "").trim();
            }
            return {
              title: normalised["title"] || "",
              description: normalised["description"] || undefined,
              priority: normalised["priority"]?.toUpperCase() || undefined,
              dueDate: normalised["due date"] || normalised["duedate"] || normalised["due_date"] || undefined,
            };
          })
          .filter((r) => r.title.length > 0);

        resolve(rows);
      } catch {
        reject(new Error("Could not parse file. Make sure it has a 'title' column."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

const TEMPLATE_CSV = [
  "title,description,priority,due date",
  "Fix login bug,Users can't log in on mobile,HIGH,2025-12-31",
  "Write docs,Update the API documentation,LOW,",
  "Design homepage,,MEDIUM,2025-11-15",
].join("\n");

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import-cards-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const ImportCardsDialog = ({ open, onClose, boardId, lists }: ImportCardsDialogProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id ?? "");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      setParseError("Only .csv, .xlsx, and .xls files are supported.");
      return;
    }

    setParseError("");
    setRows([]);
    setFileName(file.name);

    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        setParseError("No valid rows found. Make sure your file has a 'title' column.");
        return;
      }
      setRows(parsed);
    } catch (err) {
      setParseError((err as Error).message);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onImport = async () => {
    if (!rows.length || !selectedListId) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/actions/import-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, listId: selectedListId, rows }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Import failed.");
        return;
      }

      toast.success(`${data.created} card${data.created === 1 ? "" : "s"} imported.`);
      router.refresh();
      handleClose();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    setFileName("");
    setParseError("");
    setIsDragging(false);
    onClose();
  };

  const previewRows = rows.slice(0, 8);
  const hiddenCount = rows.length - previewRows.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import cards</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />
            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              {fileName ? fileName : "Drop a file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .csv, .xlsx, .xls — columns: <code className="bg-muted px-1 rounded">title</code>{" "}
              (required), <code className="bg-muted px-1 rounded">description</code>,{" "}
              <code className="bg-muted px-1 rounded">priority</code>,{" "}
              <code className="bg-muted px-1 rounded">due date</code>
            </p>
            {fileName && !parseError && rows.length > 0 && (
              <p className="text-xs text-green-400 mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {rows.length} row{rows.length === 1 ? "" : "s"} ready to import
              </p>
            )}
          </div>

          {/* Download template */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download template (.csv)
            </button>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</p>
                <button
                  onClick={() => { setRows([]); setFileName(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium w-[40%]">Title</th>
                      <th className="text-left px-3 py-2 font-medium w-[30%]">Description</th>
                      <th className="text-left px-3 py-2 font-medium w-[15%]">Priority</th>
                      <th className="text-left px-3 py-2 font-medium w-[15%]">Due date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-secondary">
                        <td className="px-3 py-1.5 text-foreground truncate max-w-[200px]">{row.title}</td>
                        <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[150px]">{row.description || "—"}</td>
                        <td className="px-3 py-1.5">
                          {row.priority && PRIORITY_VALUES.includes(row.priority) ? (
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", PRIORITY_BADGE_CLASS[row.priority as keyof typeof PRIORITY_BADGE_CLASS] ?? PRIORITY_BADGE_CLASS.NONE)}>
                              {row.priority}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.dueDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hiddenCount > 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2 border-t border-border">
                    + {hiddenCount} more row{hiddenCount === 1 ? "" : "s"} not shown
                  </p>
                )}
              </div>
            </div>
          )}

          {/* List selector + actions */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Import into list</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onImport}
                disabled={!rows.length || !selectedListId || isImporting}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {isImporting ? "Importing…" : `Import ${rows.length > 0 ? rows.length : ""} card${rows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
