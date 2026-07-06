import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { Separator } from "@/components/ui/separator";
import { Info } from "../../_components/info";
import { DailyReportPanel } from "./_components/daily-report-panel";

const DailyReportPage = async ({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  return (
    <div className="w-full mb-20">
      <Info />
      <Separator className="my-4" />
      <div className="px-2 md:px-4">
        <DailyReportPanel organizationId={organizationId} />
      </div>
    </div>
  );
};

export default DailyReportPage;
