"use client";
import { useState } from "react";
import Link from "next/link";
import { PhpMemoryLimitIncreaserTool } from "@/components/pages/developer-tools/PhpMemoryLimitIncreaserTool";
export function PhpMemoryLimitIncreaserPageClient() {
  const [backLoading, setBackLoading] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" onClick={() => setBackLoading(true)} className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            {backLoading ? <span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> Loading...</span> : "Back to features"}
          </Link>
        </div>
        <PhpMemoryLimitIncreaserTool />
      </div>
    </div>
  );
}