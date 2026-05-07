"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { useState } from "react";

function LineIcon({ name }: { name: "dashboard" | "expenses" | "insights" | "reports" | "settings" | "team" | "chevron" | "logout" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      {name === "dashboard" ? (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1.5" {...common} />
          <rect x="13" y="4" width="7" height="5" rx="1.5" {...common} />
          <rect x="13" y="11" width="7" height="9" rx="1.5" {...common} />
          <rect x="4" y="13" width="7" height="7" rx="1.5" {...common} />
        </>
      ) : null}
      {name === "expenses" ? (
        <>
          <path d="M12 3v18" {...common} />
          <path d="M17 7.5c-.8-1.2-2.4-2-4.4-2-2.5 0-4.1 1.1-4.1 2.8 0 4.1 8.5 1.9 8.5 6.4 0 1.9-1.8 3.1-4.5 3.1-2.2 0-4-.8-5-2.2" {...common} />
        </>
      ) : null}
      {name === "insights" ? (
        <>
          <path d="M4 19V5" {...common} />
          <path d="M4 19h16" {...common} />
          <path d="m7 15 3-4 3 2 5-7" {...common} />
          <path d="M18 6h-3" {...common} />
          <path d="M18 6v3" {...common} />
        </>
      ) : null}
      {name === "reports" ? (
        <>
          <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" {...common} />
          <path d="M14 3v5h5" {...common} />
          <path d="M8 13h8" {...common} />
          <path d="M8 17h5" {...common} />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" {...common} />
          <path d="M19 12a7.7 7.7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.7a8 8 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7.7 7.7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a8 8 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" {...common} />
        </>
      ) : null}
      {name === "team" ? (
        <>
          <path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" {...common} />
          <path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" {...common} />
          <path d="M20 19c0-1.8-1.1-3.3-2.7-3.8" {...common} />
          <path d="M17 4.2a3 3 0 0 1 0 5.6" {...common} />
        </>
      ) : null}
      {name === "chevron" ? <path d="m9 6 6 6-6 6" {...common} /> : null}
      {name === "logout" ? (
        <>
          <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" {...common} />
          <path d="M15 8l4 4-4 4" {...common} />
          <path d="M19 12H9" {...common} />
        </>
      ) : null}
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/expenses", label: "Expenses", icon: "expenses" as const },
  { href: "/insights", label: "Insights", icon: "insights" as const },
  { href: "/reports", label: "Reports", icon: "reports" as const },
  { href: "/settings", label: "Settings", icon: "settings" as const },
  { href: "/admin", label: "Team Mode", icon: "team" as const }
];

export function AppShell({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside
        className={`sticky top-0 z-40 flex border-b border-slate-200 bg-slate-950 text-white lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-slate-800 ${
          collapsed ? "lg:w-[88px]" : "lg:w-[264px]"
        } transition-[width] duration-200`}
      >
        <div className="flex w-full items-center justify-between gap-3 px-4 py-4 lg:flex-col lg:items-stretch lg:gap-5 lg:p-5">
          <div className={`flex items-center gap-3 ${collapsed ? "lg:flex-col lg:justify-center" : "lg:justify-between"}`}>
            <Link href="/dashboard" className={`flex min-w-0 items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-slate-950">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-950" />
              </span>
              {!collapsed ? (
                <span className="hidden min-w-0 lg:block">
                  <span className="block truncate text-sm font-semibold">Office Tracker</span>
                  <span className="block truncate text-xs text-slate-400">{userName}</span>
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className={`hidden h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white lg:grid ${
                collapsed ? "" : "rotate-180"
              }`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <LineIcon name="chevron" />
            </button>
          </div>

          <nav className="flex flex-1 items-center gap-2 overflow-x-auto lg:block lg:space-y-2 lg:overflow-visible">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition lg:w-full ${
                    active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${active ? "bg-slate-100" : "bg-white/10"}`}>
                    <LineIcon name={item.icon} />
                  </span>
                  {!collapsed ? <span className="hidden lg:inline">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden rounded-2xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white lg:block"
          >
            <span className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
              <LineIcon name="logout" />
              {!collapsed ? <span>Sign out</span> : null}
            </span>
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            Out
          </button>
        </div>
      </aside>

      <section className="min-w-0">{children}</section>
    </main>
  );
}
