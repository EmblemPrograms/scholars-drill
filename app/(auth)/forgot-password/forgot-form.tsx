"use client";

import { useActionState } from "react";
import { requestReset, type ForgotState } from "./actions";
import { field, FormError } from "../_components/form";
import { button } from "@/app/_components/ui";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestReset,
    {},
  );

  if (state.sent) {
    return (
      <div aria-live="polite" className="grid gap-4">
        <p className="rounded-xl bg-good-soft px-3.5 py-3 text-sm font-medium text-good">
          If an account exists for {state.email}, a reset link is on its way.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          The link expires in 10 minutes. Check your spam folder if it has not
          arrived in a few minutes.
        </p>
        <a href="/login" className={`${button.secondary} justify-self-start`}>
          Back to log in
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <FormError message={state.error} />

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
          defaultValue={state.email}
          placeholder="you@example.com"
          className={field}
        />
        <p className="text-sm text-muted">
          Use the address you log in with. DSA students: your DSA email.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${button.primary} w-full disabled:opacity-70`}
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
