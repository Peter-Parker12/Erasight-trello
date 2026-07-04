"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { deleteRole } from "@/actions/delete-role";
import { assignRoleToUser, unassignRoleFromUser } from "@/actions/manage-role-assignment";
import { RoleFormDialog } from "./role-form-dialog";

type RoleMember = {
  userId: string;
  userName: string;
  userImage: string;
  orgRole: string;
  hasRole: boolean;
};

type RoleMembersData = {
  role: { id: string; name: string; actions: string[] };
  orgMembers: RoleMember[];
};

type RoleCardProps = {
  role: Role;
};

export const RoleCard = ({ role }: RoleCardProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<RoleMembersData>({
    queryKey: ["role-members", role.id],
    queryFn: () => fetcher(`/api/orgs/role-members?roleId=${role.id}`),
    enabled: open,
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["role-members", role.id] });
  };

  const { execute: execAdd, isLoading: isAdding } = useAction(assignRoleToUser, {
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error),
    skipRefresh: true,
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(unassignRoleFromUser, {
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error),
    skipRefresh: true,
  });

  const { execute: execDelete } = useAction(deleteRole, {
    onSuccess: () => toast.success("Role deleted."),
    onError: (error) => toast.error(error),
  });

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete the role "${role.name}"? Members assigned to it will lose its permissions.`)) return;
    execDelete({ id: role.id });
  };

  const isMutating = isAdding || isRemoving;

  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="font-medium text-sm">{role.name}</p>
          {role.description && (
            <p className="text-xs text-muted-foreground">{role.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {role.actions.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No actions granted yet.</span>
            ) : (
              role.actions.map((action) => (
                <span
                  key={action}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-violet-500/20 text-violet-300"
                >
                  {action}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span onClick={(e) => e.stopPropagation()}>
            <RoleFormDialog
              role={role}
              trigger={
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </div>
      </button>

      {open && (
        <div className="border-t p-4 space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
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
                  variant={member.hasRole ? "outline" : "default"}
                  className="h-7 text-xs"
                  disabled={isMutating}
                  onClick={() =>
                    member.hasRole
                      ? execRemove({ roleId: role.id, userId: member.userId })
                      : execAdd({ roleId: role.id, userId: member.userId })
                  }
                >
                  {member.hasRole ? "Remove role" : "Assign role"}
                </Button>
              </div>
            ))
          )}

          {data?.orgMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No org members found.</p>
          )}
        </div>
      )}
    </div>
  );
};
