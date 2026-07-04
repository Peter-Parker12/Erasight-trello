"use client";

import { Plus } from "lucide-react";
import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { RoleCard } from "./role-card";
import { RoleFormDialog } from "./role-form-dialog";

type RolesPanelProps = {
  initialRoles: Role[];
};

export const RolesPanel = ({ initialRoles }: RolesPanelProps) => {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create roles to delegate specific actions to members without making them full admins.
        </p>
        <RoleFormDialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create role
            </Button>
          }
        />
      </div>

      {initialRoles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No roles yet. Create one to delegate specific actions to members.
        </p>
      ) : (
        <div className="space-y-2">
          {initialRoles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
};
