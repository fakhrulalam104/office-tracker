"use client";

import { useEffect, useState } from "react";
import type { NotificationItem, UserRole } from "@/types";

type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export function AdminNotificationsClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      const [notificationsResponse, usersResponse] = await Promise.all([fetch("/api/notifications"), fetch("/api/admin/users")]);

      if (!notificationsResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to load notifications workspace.");
      }

      const notificationsData = (await notificationsResponse.json()) as { notifications: NotificationItem[] };
      const usersData = (await usersResponse.json()) as { users: AdminUserItem[] };

      setNotifications(notificationsData.notifications);
      setUsers(usersData.users);
      setSelectedUserIds((current) => (current.length > 0 ? current : usersData.users.slice(0, 1).map((user) => user.id)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function toggleUser(userId: string) {
    setSelectedUserIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  }

  async function sendNotification() {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), message: message.trim(), userIds: selectedUserIds })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Failed to send notification.");
      return;
    }

    setTitle("");
    setMessage("");
    await loadData();
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-slate-950">Send Notification</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Compose a message here instead of mixing broadcasts into the main dashboard.</p>
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Notification title"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Write a clear team update"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => void sendNotification()}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Send notification
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-slate-950">Recipients</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Choose exactly who should receive the message.</p>
            </div>
            <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">{user.name}</span>
                    <span className="block truncate text-slate-500">{user.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-950">{notification.title}</p>
                <p className="text-sm text-slate-500">{notification.userName ?? notification.userEmail}</p>
                <p className="text-sm leading-6 text-slate-600">{notification.message}</p>
                <p className="text-sm text-slate-400">
                  Sent {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "recently"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">No notifications sent yet.</div>
        )}
      </div>
    </div>
  );
}
