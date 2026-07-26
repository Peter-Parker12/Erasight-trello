"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ADMIN_TABS = [
  { href: "modules", label: "Modules" },
  { href: "roles", label: "Roles" },
  { href: "api-keys", label: "API keys" },
  { href: "ai-settings", label: "AI Review" },
];

const MEMBERS_TAB = { href: "members", label: "Members" };

type SettingsTabsProps = {
  organizationId: string;
  isAdmin: boolean;
};

export const SettingsTabs = ({ organizationId, isAdmin }: SettingsTabsProps) => {
  const pathname = usePathname();
  const tabs = isAdmin ? [...ADMIN_TABS, MEMBERS_TAB] : [MEMBERS_TAB];

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const href = `/organization/${organizationId}/settings/app/${tab.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent -mb-px",
              isActive && "text-primary border-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
