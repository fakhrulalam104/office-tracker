"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { canAssignRole } from "@/lib/roles";
import type { OrganizationItem, UserRole } from "@/types";

type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  active: boolean;
  createdAt?: string | null;
};

const roleOptions: UserRole[] = ["member", "admin", "owner"];

export function AdminUserFormClient({
  mode,
  userId,
  currentRole,
  currentUserId
}: {
  mode: "create" | "edit";
  userId?: string;
  currentRole: UserRole;
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [user, setUser] = useState<AdminUserDetail | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [organizationId, setOrganizationId] = useState("");
  const [active, setActive] = useState(true);

  const assignableRoles = useMemo(() => roleOptions.filter((item) => canAssignRole(currentRole, item)), [currentRole]);
  const isSelf = user?.id === currentUserId;

  useEffect(() => {
    async function loadFormData() {
      try {
        const orgRequest = fetch("/api/admin/organizations");
        const userRequest = mode === "edit" && userId ? fetch(`/api/admin/users/${userId}`) : null;
        const [orgResponse, userResponse] = await Promise.all([orgRequest, userRequest]);

        if (!orgResponse.ok) {
          throw new Error("Failed to load organizations.");
        }

        const orgData = (await orgResponse.json()) as { organizations: OrganizationItem[] };
        setOrganizations(orgData.organizations);

        if (userResponse) {
          if (!userResponse.ok) {
            throw new Error("Failed to load user details.");
          }

          const userData = (await userResponse.json()) as { user: AdminUserDetail };
          setUser(userData.user);
          setName(userData.user.name);
          setEmail(userData.user.email);
          setRole(userData.user.role === "super_admin" ? "owner" : userData.user.role);
          setOrganizationId(userData.user.organizationId ?? "");
          setActive(userData.user.active);
        } else if (orgData.organizations.length > 0) {
          setOrganizationId(orgData.organizations[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load form.");
      } finally {
        setLoading(false);
      }
    }

    void loadFormData();
  }, [mode, userId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        role,
        organizationId,
        active
      };

      if (mode === "create") {
        payload.email = email.trim();
        payload.password = password.trim();
      } else if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await fetch(mode === "create" ? "/api/admin/users" : `/api/admin/users/${userId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? `Failed to ${mode} user.`);
      }

      router.push("/admin/users");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm("Delete this user account?");
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Failed to delete user.");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading user details...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Enter full name"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={mode === "edit"}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="name@company.com"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">{mode === "create" ? "Initial password" : "Reset password"}</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder={mode === "create" ? "At least 8 characters" : "Leave blank to keep current password"}
                required={mode === "create"}
              />
            </label>

            {mode === "edit" && (isSelf || user?.role === "super_admin") ? (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Role</span>
                <input
                  value={(user?.role ?? role).replace("_", " ")}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm capitalize text-slate-500 outline-none"
                />
              </label>
            ) : (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Role</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {assignableRoles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Organization</span>
              <select
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                disabled={user?.role === "super_admin"}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {mode === "edit" ? (
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                disabled={isSelf || user?.role === "super_admin"}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Account is active
            </label>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : mode === "create" ? "Create user" : "Save changes"}
            </button>
            {mode === "edit" ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving || isSelf || user?.role === "super_admin"}
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete user
              </button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
