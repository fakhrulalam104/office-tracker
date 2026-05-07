"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/types";

type AdminMetrics = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsers30d: number;
  totalOrganizations: number;
  pendingApprovals: number;
  unreadNotifications: number;
  roleDistribution: Array<{
    role: UserRole;
    count: number;
  }>;
  planDistribution: Array<{
    plan: "trial" | "starter" | "team" | "enterprise";
    count: number;
  }>;
};

export function AdminOverviewClient() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await fetch("/api/admin/overview");
        if (!response.ok) {
          throw new Error("Failed to load admin overview.");
        }

        const data = (await response.json()) as { metrics: AdminMetrics };
        setMetrics(data.metrics);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load admin dashboard.");
      }
    }

    void loadOverview();
  }, []);

  const activeRate = metrics?.totalUsers ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0;

  return (
    <div className="space-y-8">
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Users", value: metrics?.totalUsers ?? 0, hint: "All accounts in your current scope" },
          { label: "Active Users", value: metrics?.activeUsers ?? 0, hint: `${activeRate}% of users are active` },
          { label: "Inactive Users", value: metrics?.inactiveUsers ?? 0, hint: "Disabled or paused accounts" },
          { label: "New Users (30d)", value: metrics?.newUsers30d ?? 0, hint: "Recent growth in the last month" },
          { label: "Organizations", value: metrics?.totalOrganizations ?? 0, hint: "Managed workspaces" },
          { label: "Pending Approvals", value: metrics?.pendingApprovals ?? 0, hint: "Requests awaiting review" },
          { label: "Unread Notifications", value: metrics?.unreadNotifications ?? 0, hint: "Notices not read yet" },
          { label: "Health Score", value: `${activeRate}%`, hint: "Current active account rate" }
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-slate-950">Role Distribution</p>
            <span className="text-sm text-slate-400">By account type</span>
          </div>

          <div className="mt-6 space-y-4">
            {metrics?.roleDistribution.map((item) => {
              const total = Math.max(metrics.totalUsers, 1);
              const width = `${Math.max((item.count / total) * 100, item.count > 0 ? 8 : 0)}%`;

              return (
                <div key={item.role} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold capitalize text-slate-700">{item.role.replace("_", " ")}</span>
                    <span className="text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-sky-500" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-slate-950">Plan Distribution</p>
            <span className="text-sm text-slate-400">By organization plan</span>
          </div>

          <div className="mt-6 space-y-4">
            {metrics?.planDistribution.map((item) => (
              <div key={item.plan} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="text-sm font-semibold capitalize text-slate-700">{item.plan}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
