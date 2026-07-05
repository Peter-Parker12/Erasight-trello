"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Gauge, Target, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  organizationId: string;
  isAdmin: boolean;
};

export const OkrTabs = ({ organizationId, isAdmin }: Props) => {
  const pathname = usePathname();
  const base = `/organization/${organizationId}/okrs`;

  const tabs = [
    {
      href: base,
      icon: Target,
      label: "Mục tiêu quý | OKRs",
      exact: true,
      show: true,
    },
    {
      href: `${base}/kpis`,
      icon: Gauge,
      label: "KPI hàng tháng | KPIs",
      exact: false,
      show: true,
    },
    {
      href: `${base}/responsibility`,
      icon: Users,
      label: "Trách nhiệm | Responsibility",
      exact: false,
      show: true,
    },
    {
      href: `${base}/departments`,
      icon: Building2,
      label: "Phòng ban | Departments",
      exact: false,
      show: isAdmin,
    },
  ];

  return (
    <div className="flex items-center gap-x-1 overflow-x-auto border-b pb-px">
      {tabs
        .filter((tab) => tab.show)
        .map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-x-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 border-transparent text-neutral-400 hover:text-[#e5e5e5] transition",
                active && "border-primary text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
    </div>
  );
};
