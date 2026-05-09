"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { UserRole } from "@/types";
import { canManageTeam, getDefaultHomePath } from "@/lib/roles";

function LineIcon({
  name
}: {
  name:
    | "dashboard"
    | "tasks"
    | "expenses"
    | "features"
    | "insights"
    | "approvals"
    | "notifications"
    | "reports"
    | "profile"
    | "settings"
    | "team"
    | "users"
    | "building"
    | "bell"
    | "shield"
    | "chevron"
    | "logout";
}) {
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
      {name === "tasks" ? (
        <>
          <path d="M8 6h12" {...common} />
          <path d="M8 12h12" {...common} />
          <path d="M8 18h12" {...common} />
          <path d="m4 6 .8.8L6.5 5" {...common} />
          <path d="m4 12 .8.8 1.7-1.8" {...common} />
          <path d="m4 18 .8.8 1.7-1.8" {...common} />
        </>
      ) : null}
      {name === "expenses" ? (
        <>
          <path d="M12 3v18" {...common} />
          <path d="M17 7.5c-.8-1.2-2.4-2-4.4-2-2.5 0-4.1 1.1-4.1 2.8 0 4.1 8.5 1.9 8.5 6.4 0 1.9-1.8 3.1-4.5 3.1-2.2 0-4-.8-5-2.2" {...common} />
        </>
      ) : null}
      {name === "features" ? (
        <>
          <rect x="4" y="4" width="6" height="6" rx="1.4" {...common} />
          <rect x="14" y="4" width="6" height="6" rx="1.4" {...common} />
          <rect x="4" y="14" width="6" height="6" rx="1.4" {...common} />
          <path d="M17 14v6" {...common} />
          <path d="M14 17h6" {...common} />
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
      {name === "approvals" ? (
        <>
          <path d="M8 4h8" {...common} />
          <path d="M9 2.5h6v3H9z" {...common} />
          <path d="M7 5.5h10A1.5 1.5 0 0 1 18.5 7v12A1.5 1.5 0 0 1 17 20.5H7A1.5 1.5 0 0 1 5.5 19V7A1.5 1.5 0 0 1 7 5.5Z" {...common} />
          <path d="m9 12 2 2 4-4" {...common} />
        </>
      ) : null}
      {name === "notifications" ? (
        <>
          <path d="M15 17H9a2 2 0 0 1-2-2v-3.2c0-1.7.7-3.3 2-4.4l.4-.4A3.7 3.7 0 0 1 12 6c1 0 1.9.4 2.6 1.1l.4.4c1.3 1.1 2 2.7 2 4.4V15a2 2 0 0 1-2 2Z" {...common} />
          <path d="M10 19a2 2 0 0 0 4 0" {...common} />
        </>
      ) : null}
      {name === "profile" ? (
        <>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" {...common} />
          <path d="M5 20c0-3 3.1-5 7-5s7 2 7 5" {...common} />
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
      {name === "users" ? (
        <>
          <path d="M17 20c0-2.1-1.7-3.8-3.8-3.8H8.8C6.7 16.2 5 17.9 5 20" {...common} />
          <path d="M11 12a3.8 3.8 0 1 0 0-7.6A3.8 3.8 0 0 0 11 12Z" {...common} />
          <path d="M20 19.5c0-1.7-1-3.1-2.5-3.7" {...common} />
          <path d="M16.8 4.7a2.9 2.9 0 0 1 0 5.4" {...common} />
        </>
      ) : null}
      {name === "building" ? (
        <>
          <path d="M4 20h16" {...common} />
          <path d="M6 20V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V20" {...common} />
          <path d="M9 9h1" {...common} />
          <path d="M14 9h1" {...common} />
          <path d="M9 13h1" {...common} />
          <path d="M14 13h1" {...common} />
          <path d="M11.5 20v-3h1v3" {...common} />
        </>
      ) : null}
      {name === "bell" ? (
        <>
          <path d="M15 17H9a2 2 0 0 1-2-2v-3.2c0-1.7.7-3.3 2-4.4l.4-.4A3.7 3.7 0 0 1 12 6c1 0 1.9.4 2.6 1.1l.4.4c1.3 1.1 2 2.7 2 4.4V15a2 2 0 0 1-2 2Z" {...common} />
          <path d="M10 19a2 2 0 0 0 4 0" {...common} />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path d="M12 3 5.5 5.5V11c0 4.3 2.7 8.2 6.5 10 3.8-1.8 6.5-5.7 6.5-10V5.5L12 3Z" {...common} />
          <path d="m9.5 12 1.7 1.7 3.3-3.7" {...common} />
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

type NavLinkItem = {
  kind: "link";
  href: string;
  label: string;
  icon: Parameters<typeof LineIcon>[0]["name"];
};

type NavGroupItem = {
  kind: "group";
  label: string;
  icon: Parameters<typeof LineIcon>[0]["name"];
  items: NavLinkItem[];
};

type NavItem = NavLinkItem | NavGroupItem;

function linkItem(item: Omit<NavLinkItem, "kind">): NavLinkItem {
  return { kind: "link", ...item };
}

function groupItem(item: Omit<NavGroupItem, "kind">): NavGroupItem {
  return { kind: "group", ...item };
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActiveNavItem(pathname: string, item: NavItem) {
  return item.kind === "link" ? isActivePath(pathname, item.href) : item.items.some((child) => isActivePath(pathname, child.href));
}

function getNavItemsForRole(role: UserRole): NavItem[] {
  if (role === "super_admin") {
    return [
      linkItem({ href: "/admin", label: "Admin", icon: "dashboard" }),
      linkItem({ href: "/admin/users", label: "Users", icon: "users" }),
      linkItem({ href: "/admin/organizations", label: "Organizations", icon: "building" }),
      groupItem({
        label: "Operations",
        icon: "shield",
        items: [
          linkItem({ href: "/admin/approvals", label: "Approvals", icon: "team" }),
          linkItem({ href: "/admin/notifications", label: "Notifications", icon: "bell" }),
          linkItem({ href: "/admin/audit", label: "Audit Log", icon: "shield" })
        ]
      }),
      linkItem({ href: "/profile", label: "Profile", icon: "profile" })
    ];
  }

  if (canManageTeam(role)) {
    return [
      linkItem({ href: "/dashboard", label: "Dashboard", icon: "dashboard" }),
      groupItem({
        label: "Team",
        icon: "users",
        items: [
          linkItem({ href: "/admin", label: "Team Dashboard", icon: "dashboard" }),
          linkItem({ href: "/admin/users", label: "Users", icon: "users" }),
          linkItem({ href: "/admin/organizations", label: "Organizations", icon: "building" })
        ]
      }),
      groupItem({
        label: "Reviews",
        icon: "approvals",
        items: [
          linkItem({ href: "/admin/approvals", label: "Approvals", icon: "team" }),
          linkItem({ href: "/admin/notifications", label: "Notifications", icon: "bell" }),
          linkItem({ href: "/admin/audit", label: "Audit Log", icon: "shield" })
        ]
      }),
      linkItem({ href: "/features", label: "Tools", icon: "features" }),
      groupItem({
        label: "Work",
        icon: "reports",
        items: [
          linkItem({ href: "/insights", label: "Insights", icon: "insights" }),
          linkItem({ href: "/reports", label: "Reports", icon: "reports" })
        ]
      }),
      groupItem({
        label: "Account",
        icon: "profile",
        items: [
          linkItem({ href: "/profile", label: "Profile", icon: "profile" }),
          linkItem({ href: "/expenses", label: "Expenses", icon: "expenses" }),
          linkItem({ href: "/settings", label: "Settings", icon: "settings" })
        ]
      })
    ];
  }

  return [
    linkItem({ href: "/dashboard", label: "Dashboard", icon: "dashboard" }),
    linkItem({ href: "/tasks", label: "Tasks", icon: "tasks" }),
    linkItem({ href: "/features", label: "Tools", icon: "features" }),
    groupItem({
      label: "Updates",
      icon: "notifications",
      items: [
        linkItem({ href: "/approvals", label: "Approvals", icon: "approvals" }),
        linkItem({ href: "/notifications", label: "Notifications", icon: "notifications" }),
        linkItem({ href: "/insights", label: "Insights", icon: "insights" }),
        linkItem({ href: "/reports", label: "Reports", icon: "reports" })
      ]
    }),
    groupItem({
      label: "Account",
      icon: "profile",
      items: [
        linkItem({ href: "/profile", label: "Profile", icon: "profile" }),
        linkItem({ href: "/expenses", label: "Expenses", icon: "expenses" }),
        linkItem({ href: "/settings", label: "Settings", icon: "settings" })
      ]
    })
  ];
}

export function AppShell({
  userName,
  designation = "User",
  role = "member",
  children
}: {
  userName: string;
  designation?: string;
  role?: UserRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const visibleNavItems = getNavItemsForRole(role);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
    setOpenGroup(null);
  }, [pathname, role]);

  function startNavigationFeedback(href: string) {
    if (href === pathname || pathname.startsWith(`${href}/`)) {
      return;
    }

    setPendingHref(href);
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside
        className={`sticky top-0 z-40 flex border-b border-slate-200 bg-slate-950 text-white lg:h-screen lg:overflow-hidden lg:flex-col lg:border-b-0 lg:border-r lg:border-slate-800 ${
          collapsed ? "lg:w-[88px]" : "lg:w-[264px]"
        } transition-[width] duration-200`}
      >
        <div className="flex w-full items-center justify-between gap-3 px-4 py-4 lg:h-full lg:min-h-0 lg:flex-col lg:items-stretch lg:gap-5 lg:p-5">
          <div className={`flex items-center gap-3 ${collapsed ? "lg:flex-col lg:justify-center" : "lg:justify-between"}`}>
            <Link
              href={getDefaultHomePath(role)}
              onClick={() => startNavigationFeedback(getDefaultHomePath(role))}
              className={`flex min-w-0 items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-slate-950">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-950" />
              </span>
              {!collapsed ? (
                <span className="hidden min-w-0 lg:block">
                  <span className="block truncate text-sm font-semibold">{userName}</span>
                  <span className="block truncate text-xs text-slate-400">{designation.trim() || "User"}</span>
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

          <nav className="flex flex-1 items-center gap-2 overflow-x-auto lg:block lg:min-h-0 lg:space-y-2 lg:overflow-visible">
            {visibleNavItems.map((item) => {
              const active = isActiveNavItem(pathname, item);

              if (item.kind === "group") {
                const expanded = openGroup === item.label && !collapsed;

                return (
                  <div key={item.label} className="shrink-0 lg:w-full">
                    <button
                      type="button"
                      onClick={() => setOpenGroup((value) => (value === item.label ? null : item.label))}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                        active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                      aria-expanded={expanded}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${active ? "bg-slate-100" : "bg-white/10"}`}>
                        <LineIcon name={item.icon} />
                      </span>
                      {!collapsed ? (
                        <>
                          <span className="hidden flex-1 text-left lg:inline">{item.label}</span>
                          <span className={`hidden text-slate-400 transition lg:block ${expanded ? "rotate-90" : ""}`}>
                            <LineIcon name="chevron" />
                          </span>
                        </>
                      ) : null}
                    </button>

                    {expanded ? (
                      <div className="fixed left-4 right-4 top-[76px] z-50 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl lg:static lg:mt-1 lg:block lg:space-y-1 lg:border-0 lg:bg-transparent lg:p-0 lg:pl-11 lg:shadow-none">
                        {item.items.map((child) => {
                          const childActive = isActivePath(pathname, child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => startNavigationFeedback(child.href)}
                              className={`block rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                childActive ? "bg-white/90 text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => startNavigationFeedback(item.href)}
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

      <section className={`min-w-0 transition-opacity duration-200 ${pendingHref ? "opacity-80" : "opacity-100"}`}>
        <div
          className={`pointer-events-none fixed inset-x-0 top-0 z-[70] transition-opacity duration-200 ${
            pendingHref ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={pendingHref ? "false" : "true"}
        >
          <div className="h-1 w-full overflow-hidden bg-sky-100/90">
            <div className="navigation-progress h-full w-1/3 rounded-r-full bg-sky-500" />
          </div>
          <div className="flex justify-end px-4 pt-3 lg:px-8">
            <div className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-md">
              Loading page...
            </div>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
