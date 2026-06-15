"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { addModuleAccess, removeModuleAccess } from "@/actions/manage-module-access";
import type { ModuleKey } from "@/lib/modules";

type OrgMember = {
  userId: string;
  userName: string;
  userImage: string;
  role: string;
  hasAccess: boolean;
};

type ModuleMembersData = {
  isRestricted: boolean;
  orgMembers: OrgMember[];
};

type ModuleAccessPanelProps = {
  moduleKey: ModuleKey;
  label: string;
  description: string;
  defaultAccess: "open" | "closed";
};

export const ModuleAccessPanel = ({
  moduleKey,
  label,
  description,
  defaultAccess,
}: ModuleAccessPanelProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ModuleMembersData>({
    queryKey: ["module-access-members", moduleKey],
    queryFn: () => fetcher(`/api/orgs/module-access-members?module=${moduleKey}`),
    enabled: open,
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["module-access-members", moduleKey] });
  };

  const { execute: execAdd, isLoading: isAdding } = useAction(addModuleAccess, {
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error),
    skipRefresh: true,
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeModuleAccess, {
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error),
    skipRefresh: true,
  });

  const isRestricted = data?.isRestricted ?? false;
  const isMutating = isAdding || isRemoving;

  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-neutral-500">{description}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {open && data
              ? isRestricted
                ? "Restricted — only assigned members can access this module."
                : `Open to all org members by default${defaultAccess === "open" ? "" : " (override)"}.`
              : defaultAccess === "open"
                ? "Open to all org members by default."
                : "Restricted by default — admins can grant access below."}
          </p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-1">
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading members...</p>
          ) : isError ? (
            <p className="text-sm text-red-500">
              Failed to load members. Make sure the database schema is up to date (
              <code>prisma db push</code>).
            </p>
          ) : (
            data?.orgMembers.map((member) => (
              <div key={member.userId} className="flex items-center gap-2 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.userImage} />
                  <AvatarFallback>{member.userName[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm truncate">{member.userName}</span>
                <Button
                  size="sm"
                  variant={member.hasAccess ? "outline" : "default"}
                  className="h-7 text-xs"
                  disabled={isMutating}
                  onClick={() =>
                    member.hasAccess
                      ? execRemove({ module: moduleKey, userId: member.userId })
                      : execAdd({ module: moduleKey, userId: member.userId })
                  }
                >
                  {member.hasAccess ? "Remove access" : "Grant access"}
                </Button>
              </div>
            ))
          )}

          {data?.orgMembers.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-2">No org members found.</p>
          )}
        </div>
      )}
    </div>
  );
};
