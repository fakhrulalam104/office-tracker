export default function GlobalLoading() {
  return (
    <div className="min-h-[calc(100vh-2rem)] bg-slate-50">
      <div className="fixed inset-x-0 top-0 z-[80]">
        <div className="h-1 w-full overflow-hidden bg-sky-100">
          <div className="navigation-progress h-full w-1/3 rounded-r-full bg-sky-500" />
        </div>
        <div className="flex justify-end px-4 pt-3 lg:px-8">
          <div className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-md">
            Loading page...
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] space-y-6 px-6 py-8 lg:px-10">
        <div className="h-10 w-56 rounded-2xl bg-slate-200/80" />
        <div className="space-y-6">
          <div className="h-40 rounded-3xl bg-white/80 shadow-sm" />
          <div className="h-80 rounded-3xl bg-white/80 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
