"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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

// Individual dismissable popup card
const NotifPopup = ({
  n,
  onDismiss,
}: {
  n: Notification;
  onDismiss: (id: string) => void;
}) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(n.id), 6000);
    return () => clearTimeout(t);
  }, [n.id, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200",
        "px-4 py-3 animate-in slide-in-from-right-8 fade-in duration-300"
      )}
    >
      <div className="shrink-0">
        {n.actorImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.actorImage} alt={n.actorName} className="h-9 w-9 rounded-full" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-base">
            {TYPE_ICON[n.type] ?? "🔔"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 leading-snug">{n.message}</p>
        {n.cardTitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">📋 {n.cardTitle}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={() => onDismiss(n.id)}
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {n.boardId && (
          <Link href={`/board/${n.boardId}`} className="text-gray-300 hover:text-sky-500 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const seenIds = useRef<Set<string>>(new Set());
  const [popups, setPopups] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => fetcher("/api/notifications"),
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  // Show new unread notifications as popups
  useEffect(() => {
    if (!notifications) return;
    const newOnes = notifications.filter((n) => !n.read && !seenIds.current.has(n.id));
    if (newOnes.length === 0) return;
    newOnes.forEach((n) => seenIds.current.add(n.id));
    setPopups((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      return [...prev, ...newOnes.filter((n) => !existingIds.has(n.id))];
    });
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setPopups((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    setPopups([]);
  };

  return (
    <>
      {/* Bell icon button */}
      <button
        onClick={markAllRead}
        className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Mark all notifications read"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating popup stack — rendered in portal outside navbar */}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
            {popups.map((n) => (
              <div key={n.id} className="pointer-events-auto">
                <NotifPopup n={n} onDismiss={dismiss} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
