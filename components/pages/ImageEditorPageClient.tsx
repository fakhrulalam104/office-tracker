"use client";

import dynamic from "next/dynamic";

const EditorApp = dynamic(() => import("@/components/pages/image-editor/EditorApp"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[60vh] place-items-center bg-slate-50">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700" /> Loading image editor...
      </div>
    </div>
  )
});

export function ImageEditorPageClient() {
  return <EditorApp />;
}