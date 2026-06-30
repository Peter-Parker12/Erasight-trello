"use client";

import { useEffect, useState } from "react";
import { Folder, FileText, Library } from "lucide-react";
import type { KbIndustry } from "@prisma/client";

import { KbIndustryFormDialog } from "./kb-industry-form-dialog";
import { KbIndustryGrid } from "./kb-industry-grid";

type IndustryWithCounts = KbIndustry & {
  _count: { folders: number };
  folderDocCount: number;
};

type KbIndustriesClientSectionProps = {
  initialIndustries: IndustryWithCounts[];
  organizationId: string;
};

export const KbIndustriesClientSection = ({
  initialIndustries,
  organizationId,
}: KbIndustriesClientSectionProps) => {
  const [industries, setIndustries] = useState(initialIndustries);

  useEffect(() => {
    setIndustries(initialIndustries);
  }, [initialIndustries]);

  const totalFolders = industries.reduce((acc, i) => acc + i._count.folders, 0);
  const totalDocs = industries.reduce((acc, i) => acc + i.folderDocCount, 0);

  const handleCreated = (industry: KbIndustry) => {
    setIndustries((prev) => [
      { ...industry, _count: { folders: 0 }, folderDocCount: 0 },
      ...prev,
    ]);
  };

  const handleDeleted = (id: string) => {
    setIndustries((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Library className="h-5 w-5 text-violet-400" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize documents by industry and folder.
          </p>
        </div>
        <KbIndustryFormDialog onCreated={handleCreated} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Industries", value: industries.length, icon: Library },
          { label: "Folders", value: totalFolders, icon: Folder },
          { label: "Documents", value: totalDocs, icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-[#333] bg-[#1f1f1f] p-4 flex items-center gap-3"
          >
            <div className="rounded-md bg-violet-500/15 p-2">
              <Icon className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <KbIndustryGrid
        industries={industries}
        organizationId={organizationId}
        onDeleted={handleDeleted}
      />
    </div>
  );
};
