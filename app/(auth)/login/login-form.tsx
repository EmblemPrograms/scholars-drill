"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { field, FormError } from "../_components/form";
import { button } from "@/app/_components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    // No onSubmit handler and no client-side fetch: the action is a form post,
    // so this still works if the JavaScript never arrives.
    <form action={formAction} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
