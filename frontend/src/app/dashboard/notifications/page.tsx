"use client";

import React, { useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import EmptyState from "@/components/dashboard/EmptyState";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
  const apiBase = getApiBase();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${apiBase}/notifications?page=1&page_size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else {
        setError("Failed to load notifications");
      }
    } catch {
      setError("Network connection issue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchNotifications(); }, [token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${apiBase}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  return (
    <PageShell maxWidth="md">
      <SectionHeader
        title="Notifications"
        subtitle="Review security updates, transfers alerts, and bank notifications."
        action={
          notifications.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-primary-light hover:underline bg-transparent border-0"
            >
              Mark all as read
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 text-error border border-error/20 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-16 rounded-2xl bg-white border border-zinc-200"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="All caught up!"
          description="You don't have any unread notifications at the moment."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const date = new Date(n.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) handleMarkAsRead(n.id); }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  n.is_read
                    ? "bg-white border-zinc-200/80 shadow-sm"
                    : "bg-primary/[0.03] border-primary/20 shadow-md shadow-primary/5"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${n.is_read ? "text-zinc-500 font-medium" : "text-zinc-900 font-bold"}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-light flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-zinc-400 mt-2">{date}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
