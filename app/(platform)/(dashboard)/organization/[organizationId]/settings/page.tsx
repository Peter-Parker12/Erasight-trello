import Link from "next/link";
import { OrganizationProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Settings2 } from "lucide-react";

import { isOrgAdmin } from "@/lib/board-access";

const SettingsPage = async () => {
  const { orgId } = await auth();
  const isAdmin = orgId ? await isOrgAdmin(orgId) : false;

  return (
    <div className="w-full space-y-4">
      {isAdmin && orgId && (
        <Link
          href={`/organization/${orgId}/settings/app`}
          className="flex items-center gap-x-2 rounded-md border p-4 text-sm hover:bg-neutral-50 transition w-full"
        >
          <Settings2 className="h-4 w-4" />
          <div>
            <p className="font-medium">App settings</p>
            <p className="text-neutral-500">
              Manage module access, CRM custom fields and API keys for this organization.
            </p>
          </div>
        </Link>
      )}
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: {
              boxShadow: "none",
              width: "100%",
            },
            card: {
              border: "1px solid #e5e5e5",
              boxShadow: "none",
              width: "100%",
            },
          },
        }}
      />
    </div>
  );
};

export default SettingsPage;
