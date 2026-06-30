import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { KbIndustryDetailClient } from "./_components/kb-industry-detail-client";

type KbIndustryPageProps = {
  params: Promise<{ organizationId: string; industryId: string }>;
};

const KbIndustryPage = async ({ params }: KbIndustryPageProps) => {
  const { organizationId, industryId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const industry = await db.kbIndustry.findUnique({ where: { id: industryId } });
  if (!industry || industry.orgId !== orgId) notFound();

  const folders = await db.kbFolder.findMany({
    where: { industryId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { documents: true } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="w-full h-full flex flex-col">
      <KbIndustryDetailClient
        industry={industry}
        initialFolders={folders}
        organizationId={organizationId}
      />
    </div>
  );
};

export default KbIndustryPage;
