import type { ReactNode } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

export function AdminPageFrame({
  eyebrow,
  title,
  description,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1240px] space-y-8 px-6 py-8 lg:px-10">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}
