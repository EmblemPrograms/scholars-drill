import type { Metadata } from "next";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the code we emailed you to finish setting up your account.",
  robots: { index: false },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-2 leading-relaxed text-muted">
        We sent you a code. Enter it below and you are in. The code expires in
        10 minutes.
      </p>

      <div className="mt-7">
        <VerifyForm email={email} />
      </div>

      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        Already verified?{" "}
        <a
          href="/login"
          className="font-semibold text-brand-ink hover:underline hover:underline-offset-4"
        >
          Log in
        </a>
      </p>
    </div>
  );
}
