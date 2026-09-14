import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Scholars Drill account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Enter your email and we will send you a link to set a new one. Your
        password works on both Scholars Drill and DSA, so this changes it for
        both.
      </p>

      <div className="mt-7">
        <ForgotForm />
      </div>

      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        Remembered it?{" "}
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
