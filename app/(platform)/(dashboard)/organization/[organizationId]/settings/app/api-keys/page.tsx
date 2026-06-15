import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { ApiKeysManager } from "./_components/api-keys-manager";

const ApiKeysSettingsPage = async () => {
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  const apiKeys = await db.apiKey.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4 py-4">
      <div className="rounded-md border p-4 space-y-1">
        <p className="text-sm text-neutral-600">
          API keys grant third-party apps access to the public CRM API for this organization. Treat
          them like passwords — anyone with a key can read and write Companies, Contacts and Leads.
        </p>
      </div>

      <ApiKeysManager apiKeys={apiKeys} />
    </div>
  );
};

export default ApiKeysSettingsPage;
