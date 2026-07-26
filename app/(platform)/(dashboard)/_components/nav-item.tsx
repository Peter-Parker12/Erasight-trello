"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Activity,
  Building2,
  CalendarClock,
  ChevronRight,
  FileText,
  Handshake,
  Layout,
  LayoutDashboard,
  Library,
  ListTodo,
  Package,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import { useModuleAccess } from "@/hooks/use-module-access";
import type { ModuleKey } from "@/lib/modules";

export type Organization = {
  id: string;
  slug: string;
  imageUrl: string;
  name: string;
};

type NavItemProps = {
  isExpanded: boolean;
  isActive: boolean;
  organization: Organization;
  onExpand: (id: string) => void;
};

export const NavItem = ({
  isExpanded,
  isActive,
  organization,
  onExpand,
}: NavItemProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const modules = useModuleAccess(organization.id);

  const isCRMActive = pathname.startsWith(`/organization/${organization.id}/crm`);
  const isKBActive = pathname.startsWith(`/organization/${organization.id}/knowledge-base`);
  const isDashboardActive = pathname.startsWith(`/organization/${organization.id}/dashboard`);
  const [crmExpanded, setCrmExpanded] = useState(() => isCRMActive);
  const [dashboardExpanded, setDashboardExpanded] = useState(() => isDashboardActive);

  const mainRoutes: { label: string; icon: React.ReactNode; href: string; module?: ModuleKey }[] = [
    {
      label: "Boards",
      icon: <Layout className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}`,
      module: "TASKS",
    },
    {
      label: "My Tasks",
      icon: <ListTodo className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/tasks`,
      module: "TASKS",
    },
  ];

  const crmRoutes = [
    {
      label: "Companies",
      icon: <Building2 className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/crm/companies`,
    },
    {
      label: "Contacts",
      icon: <Users className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/crm/contacts`,
    },
    {
      label: "Leads",
      icon: <Handshake className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/crm/leads`,
    },
    {
      label: "Products",
      icon: <Package className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/crm/products`,
    },
  ];

  const dashboardRoutes = [
    {
      label: "Due & Overdue",
      icon: <CalendarClock className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/dashboard`,
      exact: true,
    },
    {
      label: "Daily Report",
      icon: <FileText className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/dashboard/daily-report`,
      exact: false,
    },
    {
      label: "OKRs & KPIs",
      icon: <Target className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/dashboard/okrs`,
      exact: false,
    },
  ];

  const bottomRoutes = [
    {
      label: "Activity",
      icon: <Activity className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/activity`,
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/settings`,
    },
  ];

  const visibleMainRoutes = mainRoutes.filter((r) => !r.module || modules[r.module]);
  const showDashboard = modules["DASHBOARD"];
  const showCRM = modules["CRM"];
  const showKB = modules["KNOWLEDGE_BASE"];

  const onClick = (href: string) => {
    router.push(href);
  };

  return (
    <AccordionItem value={organization.id} className="border-none">
      <AccordionTrigger
        onClick={() => onExpand(organization.id)}
        className={cn(
          "flex items-center gap-x-2 p-1.5 text-foreground rounded-md hover:bg-secondary transition text-start no-underline hover:no-underline",
          isActive && !isExpanded && "bg-primary/20 text-primary"
        )}
      >
        <div className="flex items-center gap-x-2">
          <div className="w-7 h-7 relative">
            <Image
              src={organization.imageUrl}
              height={28}
              width={28}
              alt={`organization ${organization.name}'s image`}
              className="rounded-sm object-cover"
            />
          </div>
          <span className="font-medium text-sm">{organization.name}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pt-1">
        {/* Boards, My Tasks */}
        {visibleMainRoutes.map((route) => (
          <Button
            key={route.label}
            size="sm"
            onClick={() => onClick(route.href)}
            className={cn(
              "w-full font-normal justify-start pl-10 mb-1 text-muted-foreground hover:text-foreground hover:bg-secondary",
              pathname === route.href && "bg-primary/20 text-primary hover:text-primary"
            )}
            variant="ghost"
          >
            {route.icon}
            {route.label}
          </Button>
        ))}

        {/* Dashboard collapsible group */}
        {showDashboard && (
          <>
            <div className="my-1.5 h-px bg-border" />
            <button
              onClick={() => setDashboardExpanded((v) => !v)}
              className={cn(
                "w-full flex items-center pl-10 pr-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition",
                isDashboardActive ? "text-primary" : "text-muted-foreground",
                "hover:bg-secondary hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5 mr-2 shrink-0" />
              <span className="flex-1 text-left">Dashboard</span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  dashboardExpanded && "rotate-90"
                )}
              />
            </button>
            {dashboardExpanded &&
              dashboardRoutes.map((route) => (
                <Button
                  key={route.label}
                  size="sm"
                  onClick={() => onClick(route.href)}
                  className={cn(
                    "w-full font-normal justify-start pl-14 mb-1 text-muted-foreground hover:text-foreground hover:bg-secondary",
                    (route.exact ? pathname === route.href : pathname?.startsWith(route.href)) &&
                      "bg-primary/20 text-primary hover:text-primary"
                  )}
                  variant="ghost"
                >
                  {route.icon}
                  {route.label}
                </Button>
              ))}
            <div className="my-1.5 h-px bg-border" />
          </>
        )}

        {/* CRM collapsible group */}
        {showCRM && (
          <>
            <div className="my-1.5 h-px bg-border" />
            <button
              onClick={() => setCrmExpanded((v) => !v)}
              className={cn(
                "w-full flex items-center pl-10 pr-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition",
                isCRMActive ? "text-primary" : "text-muted-foreground",
                "hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="flex-1 text-left">CRM</span>
              <span className="mr-1.5 text-[8px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                NEW
              </span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  crmExpanded && "rotate-90"
                )}
              />
            </button>
            {crmExpanded &&
              crmRoutes.map((route) => (
                <Button
                  key={route.label}
                  size="sm"
                  onClick={() => onClick(route.href)}
                  className={cn(
                    "w-full font-normal justify-start pl-14 mb-1 text-muted-foreground hover:text-foreground hover:bg-secondary",
                    pathname === route.href && "bg-primary/20 text-primary hover:text-primary"
                  )}
                  variant="ghost"
                >
                  {route.icon}
                  {route.label}
                </Button>
              ))}
            <div className="my-1.5 h-px bg-border" />
          </>
        )}

        {/* Knowledge Base */}
        {showKB && (
          <>
            <div className="my-1.5 h-px bg-border" />
            <Button
              size="sm"
              onClick={() => onClick(`/organization/${organization.id}/knowledge-base`)}
              className={cn(
                "w-full font-normal justify-start pl-10 mb-1 text-muted-foreground hover:text-foreground hover:bg-secondary",
                isKBActive && "bg-primary/20 text-primary hover:text-primary"
              )}
              variant="ghost"
            >
              <Library className="h-4 w-4 mr-2" />
              Knowledge Base
            </Button>
            <div className="my-1.5 h-px bg-border" />
          </>
        )}

        {/* Activity, Settings */}
        {bottomRoutes.map((route) => (
          <Button
            key={route.label}
            size="sm"
            onClick={() => onClick(route.href)}
            className={cn(
              "w-full font-normal justify-start pl-10 mb-1 text-muted-foreground hover:text-foreground hover:bg-secondary",
              ("matchPrefix" in route && route.matchPrefix
                ? pathname?.startsWith(route.href)
                : pathname === route.href) && "bg-primary/20 text-primary hover:text-primary"
            )}
            variant="ghost"
          >
            {route.icon}
            {route.label}
          </Button>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};

NavItem.Skeleton = function SkeletonNavItem() {
  return (
    <div className="flex items-center gap-x-2">
      <div className="w-10 h-10 relative shrink-0">
        <Skeleton className="h-full w-full absolute" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
};
