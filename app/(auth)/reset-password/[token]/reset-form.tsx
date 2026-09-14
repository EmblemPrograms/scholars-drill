"use client";

import { useActionState } from "react";
import { resetPassword, type ResetState } from "./actions";
import { field, FormError } from "../../_components/form";
import { button } from "@/app/_components/ui";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    {},
  );

  if (state.done) {
    return (
      <div aria-live="polite" className="grid gap-4">
        <p className="rounded-xl bg-good-soft px-3.5 py-3 text-sm font-medium text-good">
          Your password has been changed.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Use it to log in here and on Distinguished Scholars Academy.
        </p>
        <a href="/login" className={`${button.primary} justify-self-start`}>
          Log in
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <FormError message={state.error} />

      <div className="grid gap-2">
        <label htmlFor="newPassword" className="text-sm font-semibold">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={field}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-sm text-muted">
          At least 6 characters.
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="confirm" className="text-sm font-semibold">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={field}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${button.primary} w-full disabled:opacity-70`}
      >
        {pending ? "Saving..." : "Set new password"}
      </button>
    </form>
  );
}
