"use client";

import { useEffect, useState } from "react";
import type { NotificationItem } from "@/types";
import { PageHeader } from "@/components/pages/PageHeader";

export function NotificationsPageClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to load notifications.");
      }

      const data = (await response.json()) as { notifications: NotificationItem[] };
      setNotifications(data.notifications ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function handleMarkNotificationRead(notificationId: string) {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH"
    });

    if (response.ok) {
      await loadNotifications();
      window.dispatchEvent(new Event("office-tracker:notifications-updated"));
    }
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Notifications"
        title="Team Notices"
        description="Keep all announcements and unread updates on a dedicated page so the dashboard stays clean and easy to scan."
      />

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">Inbox</p>
          {loading ? <span className="text-sm text-slate-400">Loading...</span> : null}
        </div>

        <div className="mt-6 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleMarkNotificationRead(notification.id)}
                className={`block w-full rounded-2xl border px-5 py-4 text-left transition ${
                  notification.readAt ? "border-slate-200 bg-slate-50" : "border-sky-200 bg-sky-50 hover:border-sky-300"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                    <p className="text-sm leading-6 text-slate-600">{notification.message}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
