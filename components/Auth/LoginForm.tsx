"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { maskEmail } from "@/lib/auth-debug";

type Errors = {
  email?: string;
  password?: string;
  form?: string;
};

function createFlowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loginDebug(step: string, details: Record<string, unknown> = {}) {
  console.info(`[office-auth:client] ${step}`, {
    at: new Date().toISOString(),
    ...details
  });
}

export function LoginForm({ registered }: { registered: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const flowId = createFlowId();
    const nextErrors: Errors = {};
    const normalizedEmail = email.toLowerCase().trim();

    loginDebug("login.submit-start", {
      flowId,
      email: maskEmail(normalizedEmail),
      hasPassword: Boolean(password),
      location: window.location.href
    });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      loginDebug("login.validation-failed", {
        flowId,
        fields: Object.keys(nextErrors)
      });
      setErrors(nextErrors);
      return;
    }

    setPending(true);
    setErrors({});

    try {
      loginDebug("login.signin-call-start", {
        flowId,
        email: maskEmail(normalizedEmail)
      });

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        flowId,
        redirectTo: "/dashboard",
        redirect: false
      });

      loginDebug("login.signin-call-result", {
        flowId,
        status: result?.status ?? null,
        ok: result?.ok ?? null,
        error: result?.error ?? null,
        code: result?.code ?? null,
        url: result?.url ?? null
      });

      setPending(false);

      if (result?.error) {
        loginDebug("login.signin-error-shown", {
          flowId,
          error: result.error,
          code: result.code ?? null
        });
        setErrors({
          form:
            result.error === "Configuration"
              ? "Sign-in is not configured correctly on the server. Check the Vercel auth secret."
              : "Invalid email or password."
        });
        return;
      }

      loginDebug("login.redirect-dashboard", {
        flowId,
        url: result?.url ?? "/dashboard"
      });

      router.push(result?.url ?? "/dashboard");
      router.refresh();
    } catch (error) {
      loginDebug("login.signin-exception", {
        flowId,
        message: error instanceof Error ? error.message : String(error)
      });
      setPending(false);
      setErrors({ form: "Could not reach the sign-in server. Check the browser console and Vercel logs." });
    }
  }

  return (
    <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-500">Office Tracker</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Use your office tracker account to view and update your month.</p>
      </div>

      {registered ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Account created successfully. Please sign in.
        </div>
      ) : null}

      {errors.form ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your password"
          />
          {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password}</p> : null}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create an account
        </Link>
      </p>
    </div>
  );
}
