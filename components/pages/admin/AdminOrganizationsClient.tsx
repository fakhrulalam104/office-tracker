"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrganizationItem } from "@/types";

const planOptions = ["trial", "starter", "team", "enterprise"] as const;

export function AdminOrganizationsClient({ canCreate }: { canCreate: boolean }) {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadOrganizations() {
    try {
      const response = await fetch("/api/admin/organizations");
      if (!response.ok) {
        throw new Error("Failed to load organizations.");
      }

      const data = (await response.json()) as { organizations: OrganizationItem[] };
      setOrganizations(data.organizations);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load organizations.");
    }
  }

  useEffect(() => {
    void loadOrganizations();
  }, []);

  async function updateOrganization(organizationId: string, payload: Record<string, unknown>) {
    const response = await fetch(`/api/admin/organizations/${organizationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Failed to update organization.");
      return;
    }

    await loadOrganizations();
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {organizations.length > 0 ? (
          organizations.map((organization) => (
            <div key={organization.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-950">{organization.name}</p>
                  <p className="text-sm text-slate-500">
                    {organization.ownerName ? `${organization.ownerName} | ${organization.ownerEmail}` : "No owner assigned"}
                  </p>
                  <p className="text-sm text-slate-400">
                    Created {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : "recently"}
                  </p>
                </div>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan</span>
                  <select
                    value={organization.plan}
                    onChange={(event) => void updateOrganization(organization.id, { plan: event.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 xl:col-span-2">
            No organizations available yet.
          </div>
        )}
      </div>

      {canCreate ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-950">Need a new workspace?</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Create a dedicated organization when you onboard a new company or business unit.</p>
            </div>
            <Link
              href="/admin/organizations/new"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add organization
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
