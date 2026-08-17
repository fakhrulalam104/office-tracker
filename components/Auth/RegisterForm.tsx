"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Errors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setPending(true);
    setErrors({});

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        company,
        password
      })
    });

    const data = (await response.json().catch(() => null)) as
      | { fieldErrors?: Errors; message?: string }
      | null;

    setPending(false);

    if (!response.ok) {
      setErrors({
        ...data?.fieldErrors,
        form: data?.message ?? "Could not create account."
      });
      return;
    }

    router.push("/login?registered=1");
    router.refresh();
  }

  return (
    <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-500">Office Tracker</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">Register with your office email and a secure password.</p>
      </div>

      {errors.form ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="Your name"
          />
          {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name}</p> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Company or team</span>
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="Acme Office"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="name@company.com"
          />
          {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email}</p> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="At least 8 characters"
          />
          {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password}</p> : null}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href="/tools"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Browse Tools
        </Link>
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
