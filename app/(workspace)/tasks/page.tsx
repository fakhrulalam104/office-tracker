import { redirect } from "next/navigation";
import { PageHeader } from "@/components/pages/PageHeader";
import { requireUser } from "@/lib/require-auth";

export default async function TasksPage() {
  const user = await requireUser();

  if (user.role !== "member") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        eyebrow="Assigned Work"
        title="Tasks"
        description="Review the tasks assigned to you and keep track of what needs your attention."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-950">My Tasks</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">No tasks have been assigned yet.</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">0 open</span>
        </div>
      </section>
    </div>
  );
}
