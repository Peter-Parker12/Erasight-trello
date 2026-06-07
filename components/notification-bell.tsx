"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  message: string;
  cardId: string | null;
  cardTitle: string | null;
  boardId: string | null;
  actorName: string;
  actorImage: string;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  CARD_ASSIGNED: "👤",
  COMMENT_ADDED: "💬",
  DUE_DATE_SOON: "⏰",
  CARD_UPDATED: "✏️",
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => fetcher("/api/notifications"),
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-0.5"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                    !n.read && "bg-sky-50/50"
                  )}
                >
                  {/* Actor avatar / type emoji */}
                  <div className="shrink-0">
                    {n.actorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.actorImage} alt={n.actorName} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-base">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                    {n.cardTitle && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">📋 {n.cardTitle}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {!n.read && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-sky-500 mt-1" />
                  )}

                  {n.boardId && (
                    <Link
                      href={`/board/${n.boardId}`}
                      onClick={() => setOpen(false)}
                      className="shrink-0 text-gray-300 hover:text-sky-500 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
