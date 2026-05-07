import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/pages/PageHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/require-auth";
import { User } from "@/models/User";

export default async function AdminPage() {
  const user = await requireUser();
  await connectToDatabase();
  const users = await User.find({}).select("name email createdAt").sort({ createdAt: -1 }).lean();

  return (
    <AppShell userName={user.name}>
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
        <PageHeader
          eyebrow="Team Mode"
          title="Team Overview"
          description="A lightweight admin view for moving this tracker from personal use toward team reporting."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Users</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{users.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Role Model</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">Ready</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Reports</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">CSV</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Registered Team Members</p>
          <div className="mt-4 divide-y divide-slate-100">
            {users.map((member) => (
              <div key={String(member._id)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Member</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
