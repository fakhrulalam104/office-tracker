"use client";

import Link from "next/link";
import { PageHeader } from "@/components/pages/PageHeader";

const features = [
  {
    href: "/features/stopwatch",
    label: "Stopwatch",
    description: "A focused timer users can keep open while working through any task.",
    status: "Available"
  }
];

export function FeaturesPageClient() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader
        eyebrow="Features"
        title="Workspace Tools"
        description="A growing collection of lightweight apps users can open whenever they need a little extra utility during the day."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path d="M9 3h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M12 8v4l2.5 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{feature.status}</span>
            </div>
            <div className="mt-5">
              <h2 className="text-lg font-semibold text-slate-950">{feature.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            </div>
            <div className="mt-6 text-sm font-semibold text-sky-700 transition group-hover:text-sky-800">Open app</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
