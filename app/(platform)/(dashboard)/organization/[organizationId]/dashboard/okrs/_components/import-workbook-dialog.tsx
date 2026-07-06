"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { OrgMember } from "@/lib/org-members";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImportCounts, ImportPreview } from "@/lib/okr-import/types";

type Props = {
  organizationId: string;
  members: OrgMember[];
};

type Step = "pick" | "preview" | "done";

const selectClass =
  "w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export const ImportWorkbookDialog = ({ organizationId, members }: Props) => {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [nameMapping, setNameMapping] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<ImportCounts | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setStep("pick");
    setFile(null);
    setPreview(null);
    setNameMapping({});
    setCounts(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const onParse = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", String(year));

      const res = await fetch(`/api/okrs/import`, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to parse workbook.");

      const importPreview = json as ImportPreview;
      setPreview(importPreview);
      setNameMapping(
        Object.fromEntries(
          Object.entries(importPreview.ownerNameGuesses)
            .filter(([, userId]) => !!userId)
            .map(([name, userId]) => [name, userId as string])
        )
      );
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse workbook.");
    } finally {
      setIsLoading(false);
    }
  };

  const onCommit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", String(year));
      formData.append("nameMapping", JSON.stringify(nameMapping));

      const res = await fetch(`/api/okrs/import?commit=1`, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed.");

      setCounts(json.counts as ImportCounts);
      setStep("done");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const unresolved = preview?.unresolvedOwnerNames ?? [];
  const allResolved = unresolved.every((name) => !!nameMapping[name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          Nhập từ Excel | Import from Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nhập OKRs & KPIs từ Excel | Import OKRs & KPIs from Excel</DialogTitle>
        </DialogHeader>

        {step === "pick" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-file">File Excel (.xlsx)</Label>
              <Input
                id="import-file"
                ref={fileRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="import-year">Năm | Year</Label>
              <select
                id="import-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className={selectClass}
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-x-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Hủy | Cancel
              </Button>
              <Button type="button" disabled={!file || isLoading} onClick={onParse}>
                {isLoading ? "Đang đọc file... | Parsing..." : "Tiếp theo | Next"}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border p-2">
                Phòng ban | Departments: <b>{preview.counts.departments}</b>
              </div>
              <div className="rounded-md border p-2">
                Mục tiêu | Objectives: <b>{preview.counts.objectives}</b>
              </div>
              <div className="rounded-md border p-2">
                Key Results: <b>{preview.counts.keyResults}</b>
              </div>
              <div className="rounded-md border p-2">
                KPIs: <b>{preview.counts.kpis}</b>
              </div>
              <div className="rounded-md border p-2 col-span-2">
                KPI entries (theo tháng | monthly): <b>{preview.counts.kpiEntries}</b>
              </div>
            </div>

            {preview.rowErrors.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 max-h-32 overflow-y-auto space-y-1">
                {preview.rowErrors.map((err, i) => (
                  <div key={i}>
                    [{err.sheet}] {err.message}
                  </div>
                ))}
              </div>
            )}

            {unresolved.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Chưa khớp người phụ trách | Unresolved owner names
                </Label>
                {unresolved.map((name) => (
                  <div key={name} className="flex items-center gap-x-2">
                    <span className="w-28 truncate text-sm">{name}</span>
                    <select
                      className={selectClass}
                      value={nameMapping[name] ?? ""}
                      onChange={(e) =>
                        setNameMapping((prev) => ({ ...prev, [name]: e.target.value }))
                      }
                    >
                      <option value="">— Chọn người | Select member —</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.userName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-x-2">
              <Button type="button" variant="ghost" onClick={() => setStep("pick")}>
                Quay lại | Back
              </Button>
              <Button type="button" disabled={!allResolved || isLoading} onClick={onCommit}>
                {isLoading ? "Đang nhập... | Importing..." : "Xác nhận nhập | Confirm import"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && counts && (
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
              Đã nhập thành công | Import complete: {counts.departments} phòng ban,{" "}
              {counts.objectives} mục tiêu, {counts.keyResults} key results, {counts.kpis} KPI,{" "}
              {counts.kpiEntries} KPI entries.
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => onOpenChange(false)}>
                Đóng | Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
