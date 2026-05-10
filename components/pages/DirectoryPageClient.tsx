"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  phone: string;
  jobTitle: string;
  department: string;
  employeeCode: string;
  location: string;
  bio: string;
  socialLinks: Record<string, string>;
};

const socialLabels: Record<string, string> = {
  facebook: "Facebook",
  teams: "Teams",
  whatsapp: "WhatsApp",
  email: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
  website: "Website",
  skype: "Skype",
  telegram: "Telegram",
  discord: "Discord"
};

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

function formatRole(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DirectoryPageClient() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDirectory() {
      setLoading(true);
      try {
        const response = await fetch("/api/directory", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Could not load directory.");
        }
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Could not load directory.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDirectory();
    return () => {
      cancelled = true;
    };
  }, []);

  const departments = useMemo(() => Array.from(new Set(users.map((user) => user.department).filter(Boolean))).sort(), [users]);
  const filteredUsers = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email} ${user.role} ${user.designation} ${user.department} ${user.location}`.toLowerCase();
      return (department === "all" || user.department === department) && (!needle || haystack.includes(needle));
    });
  }, [department, query, users]);

  function getVisibleSocials(user: DirectoryUser) {
    return Object.entries(user.socialLinks ?? {}).filter(([, value]) => value.trim());
  }

  function getLinkHref(key: string, value: string) {
    if (key === "email") {
      return value.startsWith("mailto:") ? value : `mailto:${value}`;
    }

    if (key === "whatsapp" && /^\+?\d[\d\s-]+$/.test(value)) {
      return `https://wa.me/${value.replace(/\D/g, "")}`;
    }

    if (/^(mailto:|tel:|skype:|tg:|https?:\/\/)/i.test(value)) {
      return value;
    }

    return `https://${value}`;
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader eyebrow="People" title="Employee Directory" description="Search the team by role, department, contact information, location, and profile details." />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people..." className={inputClass} />
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass}>
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      {message ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message}</p> : null}
      {loading ? <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">Loading directory...</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredUsers.map((user) => (
          <button key={user.id} type="button" onClick={() => setSelectedUser(user)} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-950">{user.name}</h2>
                <p className="text-sm font-semibold text-slate-500">{user.jobTitle || user.designation}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>{user.email}</p>
              {user.phone ? <p>{user.phone}</p> : null}
              <p>{formatRole(user.role)}</p>
              {user.department ? <p>{user.department}</p> : null}
              {user.location ? <p>{user.location}</p> : null}
              {user.employeeCode ? <p>Code: {user.employeeCode}</p> : null}
            </div>
            {user.bio ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{user.bio}</p> : null}
            {getVisibleSocials(user).length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {getVisibleSocials(user).slice(0, 4).map(([key]) => (
                  <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {socialLabels[key] ?? key}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </section>

      {selectedUser ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 px-4 py-6">
          <section className="mx-auto max-w-[760px] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  {selectedUser.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold text-slate-950">{selectedUser.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selectedUser.jobTitle || selectedUser.designation}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p>Email: {selectedUser.email}</p>
              {selectedUser.phone ? <p>Phone: {selectedUser.phone}</p> : null}
              <p>Role: {formatRole(selectedUser.role)}</p>
              {selectedUser.department ? <p>Department: {selectedUser.department}</p> : null}
              {selectedUser.location ? <p>Location: {selectedUser.location}</p> : null}
              {selectedUser.employeeCode ? <p>Code: {selectedUser.employeeCode}</p> : null}
            </div>

            {selectedUser.bio ? <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{selectedUser.bio}</p> : null}

            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Social & contact</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {getVisibleSocials(selectedUser).map(([key, value]) => (
                  <a
                    key={key}
                    href={getLinkHref(key, value)}
                    target={key === "email" ? undefined : "_blank"}
                    rel={key === "email" ? undefined : "noreferrer"}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-[10px] font-black text-white">
                      {(socialLabels[key] ?? key).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 truncate">{socialLabels[key] ?? key}</span>
                  </a>
                ))}
                {getVisibleSocials(selectedUser).length === 0 ? <p className="text-sm font-semibold text-slate-500">No social links added yet.</p> : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
