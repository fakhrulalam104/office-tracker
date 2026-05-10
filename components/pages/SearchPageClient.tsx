"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  meta: string;
};

const quickSearches = ["pending task", "ticket", "leave", "announcement", "asset", "client", "unread"];

export function SearchPageClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Search failed.");
        }

        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : "Search failed.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, SearchResult[]>>((groups, result) => {
      groups[result.type] = [...(groups[result.type] ?? []), result];
      return groups;
    }, {});
  }, [results]);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader
        eyebrow="Command Center"
        title="Global Search"
        description="Find people, tasks, tickets, projects, assets, documents, announcements, notes, and notifications from one place."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="sr-only" htmlFor="global-search">
          Search
        </label>
        <input
          id="global-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
          placeholder="Search anything..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {quickSearches.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuery(item)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">Searching...</p> : null}
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}
      {query.trim().length >= 2 && !loading && results.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">No matches found.</p>
      ) : null}

      <section className="space-y-5">
        {Object.entries(groupedResults).map(([type, items]) => (
          <div key={type} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">{type}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <Link key={item.id} href={item.href} className="block px-2 py-4 transition hover:bg-sky-50/60">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                      {item.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p> : null}
                    </div>
                    {item.meta ? <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">{item.meta}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
