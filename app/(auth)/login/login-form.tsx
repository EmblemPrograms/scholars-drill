"use client";

import { useActionState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { login, type LoginState } from "./actions";
import { button } from "@/app/_components/ui";

const field =
  "w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-ink transition-colors placeholder:text-muted/70 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    // No onSubmit handler and no client-side fetch: the action is a form post,
    // so this still works if the JavaScript never arrives.
    <form action={formAction} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div aria-live="polite">
        {state.error ? (
          <p className="flex items-start gap-2 rounded-xl bg-bad-soft px-3.5 py-3 text-sm font-medium text-bad">
            <WarningCircle size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
            {state.error}
          </p>
        ) : null}
      </div>

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
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
        <a
          href="/forgot-password"
          className="justify-self-start text-sm font-medium text-brand-ink hover:underline hover:underline-offset-4"
        >
          Forgot your password?
        </a>
      </div>

      <button type="submit" disabled={pending} className={`${button.primary} w-full disabled:opacity-70`}>
        {pending ? "Signing in..." : "Log in"}
      </button>
    </form>
  );
}
