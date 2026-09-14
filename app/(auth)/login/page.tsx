import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Log in to Scholars Drill. Distinguished Scholars Academy students use their existing DSA email and password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // The proxy gate is optimistic and only sees whether a cookie exists. This is
  // the real check.
  const session = await getSession();
  if (session) redirect(next && next.startsWith("/") ? next : "/dashboard");

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Studying at Distinguished Scholars Academy? Use the same email and
        password. There is no second account to create.
      </p>

      <div className="mt-7">
        <LoginForm next={next} />
      </div>

      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        New here?{" "}
        <a
          href="/signup"
          className="font-semibold text-brand-ink hover:underline hover:underline-offset-4"
        >
          Create a free account
        </a>
      </p>
    </div>
  );
}
