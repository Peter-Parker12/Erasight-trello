"use client";

import { ActivityIcon } from "lucide-react";
import { AuditLog } from "@prisma/client";

import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "@/components/activity-item";

type ActivityProps = {
  data: AuditLog[];
};

export const Activity = ({ data }: ActivityProps) => {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <ActivityIcon className="h-5 w-5 mt-0.5 text-foreground" />
      <div className="w-full">
        <p className="font-semibold text-foreground mb-2">Activity</p>
        <ol className="mt-2 space-y-4">
          {data.map((item) => (
            <ActivityItem key={item.id} data={item} />
          ))}
        </ol>
      </div>
    </div>
  );
};

Activity.Skeleton = function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-x-3 w-full">
      <Skeleton className="h-6 w-6 bg-muted" />
      <div className="w-full">
        <Skeleton className="h-6 w-24 mb-2 bg-muted" />
        <Skeleton className="h-10 w-full bg-muted" />
      </div>
    </div>
  );
};
