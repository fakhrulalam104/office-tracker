"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types";
import { PageHeader } from "@/components/pages/PageHeader";

const emptyProfile: UserProfile = {
  id: "",
  name: "",
  email: "",
  role: "member",
  organizationId: null,
  phone: "",
  jobTitle: "",
  department: "",
  employeeCode: "",
  location: "",
  bio: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  createdAt: null
};

export function ProfilePageClient() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Failed to load profile.");
        }

        const data = (await response.json()) as { profile: UserProfile };
        setProfile(data.profile ?? emptyProfile);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((current) => ({
      ...current,
      [key]: value
    }));
    setSaved(false);
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Could not save profile.");
      }

      const data = (await response.json()) as { profile: UserProfile };
      setProfile(data.profile ?? profile);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Profile"
        title="My Account"
        description="Update your personal details, work information, and emergency contact details. Everything on this page is stored in your account record."
      />

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-3xl bg-slate-100" />
          <div className="h-72 rounded-3xl bg-slate-100" />
          <div className="h-64 rounded-3xl bg-slate-100 lg:col-span-2" />
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-950">Personal Details</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{profile.role.replace("_", " ")}</span>
              </div>
              <div className="mt-6 grid gap-5">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Full name</span>
                  <input
                    value={profile.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Your full name"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="name@company.com"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Phone</span>
                  <input
                    value={profile.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Phone number"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Location</span>
                  <input
                    value={profile.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="City or office location"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-slate-950">Work Information</p>
              <div className="mt-6 grid gap-5">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Job title</span>
                  <input
                    value={profile.jobTitle}
                    onChange={(event) => updateField("jobTitle", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Product Designer"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Department</span>
                  <input
                    value={profile.department}
                    onChange={(event) => updateField("department", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Operations"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Employee code</span>
                  <input
                    value={profile.employeeCode}
                    onChange={(event) => updateField("employeeCode", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="EMP-104"
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">Account created</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-slate-950">About You</p>
              <label className="mt-6 block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Short bio</span>
                <textarea
                  value={profile.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  placeholder="Add a short note about your role, work preference, or anything your team should know."
                />
              </label>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-slate-950">Emergency Contact</p>
              <div className="mt-6 grid gap-5">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Contact name</span>
                  <input
                    value={profile.emergencyContactName}
                    onChange={(event) => updateField("emergencyContactName", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Person to contact"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Contact phone</span>
                  <input
                    value={profile.emergencyContactPhone}
                    onChange={(event) => updateField("emergencyContactPhone", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Emergency phone number"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
            {saved ? <span className="text-sm font-semibold text-emerald-700">Profile saved</span> : null}
          </div>
        </>
      )}
    </div>
  );
}
