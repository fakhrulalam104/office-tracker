"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { canManageTargetRole } from "@/lib/roles";
import type { UserRole } from "@/types";

type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  organizationName?: string | null;
  active: boolean;
  createdAt?: string | null;
};

export function AdminUsersClient({ currentRole, currentUserId }: { currentRole: UserRole; currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Failed to load users.");
        }

        const data = (await response.json()) as { users: AdminUserItem[] };
        setUsers(data.users);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
      }
    }

    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email, user.organizationName ?? "", user.role].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, users]);

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-950">All Users</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Browse every account, review status, and open the edit screen for role or access changes.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, role, or organization"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 lg:max-w-md"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_120px_120px_96px] gap-4 border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 lg:grid">
          <span>User</span>
          <span>Organization</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const canEdit = user.id === currentUserId || canManageTargetRole(currentRole, user.role);

              return (
                <div key={user.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_120px_120px_96px] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-sm text-slate-600">{user.organizationName ?? "No organization"}</div>
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{user.role.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-right">
                    {canEdit ? (
                      <Link href={`/admin/users/${user.id}`} className="text-sm font-semibold text-sky-600 transition hover:text-sky-500">
                        Edit
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">Locked</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-sm text-slate-500">No users matched your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
