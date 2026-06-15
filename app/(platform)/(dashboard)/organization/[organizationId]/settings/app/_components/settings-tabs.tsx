"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "modules", label: "Modules" },
  { href: "custom-fields", label: "Custom fields" },
  { href: "api-keys", label: "API keys" },
];

export const SettingsTabs = ({ organizationId }: { organizationId: string }) => {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b">
      {TABS.map((tab) => {
        const href = `/organization/${organizationId}/settings/app/${tab.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent -mb-px",
              isActive && "text-sky-700 border-sky-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
