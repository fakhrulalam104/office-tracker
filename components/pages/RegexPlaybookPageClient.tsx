"use client";

import Link from "next/link";
import { RegexPlaybookTool } from "@/components/pages/developer-tools/RegexPlaybookTool";

export function RegexPlaybookPageClient() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            Back to features
          </Link>
        </div>
        <RegexPlaybookTool />
      </div>
    </div>
  );
}