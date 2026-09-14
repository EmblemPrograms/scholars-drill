import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false },
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-2 leading-relaxed text-muted">
        This changes the password you use for both Scholars Drill and
        Distinguished Scholars Academy.
      </p>

      <div className="mt-7">
        <ResetForm token={token} />
      </div>

      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        Link expired?{" "}
        <a
          href="/forgot-password"
          className="font-semibold text-brand-ink hover:underline hover:underline-offset-4"
        >
          Request a new one
        </a>
      </p>
    </div>
  );
}
