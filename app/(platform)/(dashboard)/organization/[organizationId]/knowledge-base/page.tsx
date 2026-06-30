import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { KbIndustriesClientSection } from "./_components/kb-industries-client-section";

type KbPageProps = {
  params: Promise<{ organizationId: string }>;
};

const KnowledgeBasePage = async ({ params }: KbPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const rawIndustries = await db.kbIndustry.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { folders: true } },
      folders: { include: { _count: { select: { documents: true } } } },
    },
  });

  const industries = rawIndustries.map((ind) => ({
    ...ind,
    folders: undefined,
    folderDocCount: ind.folders.reduce((acc, f) => acc + f._count.documents, 0),
  }));

  return (
    <div className="w-full p-4 md:p-6">
      <KbIndustriesClientSection
        initialIndustries={industries}
        organizationId={organizationId}
      />
    </div>
  );
};

export default KnowledgeBasePage;
