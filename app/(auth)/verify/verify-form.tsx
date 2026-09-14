"use client";

import { useActionState } from "react";
import {
  verifyOtp,
  resendOtp,
  type VerifyState,
  type ResendState,
} from "./actions";
import { field, FormError } from "../_components/form";
import { button } from "@/app/_components/ui";

export function VerifyForm({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState<VerifyState, FormData>(
    verifyOtp,
    { email },
  );
  const [resendState, resendAction, resending] = useActionState<ResendState, FormData>(
    resendOtp,
    {},
  );

  const knownEmail = state.email ?? email;

  return (
    <div className="grid gap-5">
      <form action={formAction} className="grid gap-5">
        <FormError message={state.error} />

        {knownEmail ? (
          <input type="hidden" name="email" value={knownEmail} />
        ) : (
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={field}
            />
          </div>
        )}

        <div className="grid gap-2">
          <label htmlFor="otp" className="text-sm font-semibold">
            Verification code
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            // Lets phones offer the code straight from the email or SMS.
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            placeholder="0000"
            className={`${field} text-center font-mono text-2xl tracking-[0.4em]`}
          />
          {knownEmail ? (
            <p className="text-sm text-muted">Sent to {knownEmail}.</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`${button.primary} w-full disabled:opacity-70`}
        >
          {pending ? "Verifying..." : "Verify and continue"}
        </button>
      </form>

      <form action={resendAction} className="grid gap-3 border-t border-line pt-5">
        {knownEmail ? <input type="hidden" name="email" value={knownEmail} /> : null}

        <div aria-live="polite">
          {resendState.message ? (
            <p className="text-sm font-medium text-good">{resendState.message}</p>
          ) : null}
          {resendState.error ? (
            <p className="text-sm font-medium text-bad">{resendState.error}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span>No code yet?</span>
          <button
            type="submit"
            disabled={resending}
            className="rounded font-semibold text-brand-ink hover:underline hover:underline-offset-4 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {resending ? "Sending..." : "Send a new one"}
          </button>
        </div>
      </form>
    </div>
  );
}
