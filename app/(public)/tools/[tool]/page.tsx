"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { toolComponents } from "../tool-map";

function ToolLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
    </div>
  );
}

export default function PublicToolPage() {
  const params = useParams();
  const slug = params.tool as string;
  const Component = toolComponents[slug];

  if (!Component) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Tool not found</h1>
        <p className="text-sm text-slate-500">The tool you are looking for does not exist.</p>
        <a href="/tools" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to Tools
        </a>
      </div>
    );
  }

  return (
    <Suspense fallback={<ToolLoader />}>
      <Component />
    </Suspense>
  );
}
