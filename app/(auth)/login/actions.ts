"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/client";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export type LoginState = {
  error?: string;
  /** Kept so the field is not cleared when the password was the problem. */
  email?: string;
};

type LoginResponse = {
  success: boolean;
  token: string;
  user: { id: string; fullname: string; email: string; role: string };
};

/** Only same-origin paths, so `?next=` cannot bounce someone off-site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  try {
    const result = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!result?.token) {
      return { error: "The server did not return a session. Try again.", email };
    }

    await setSessionCookie(result.token);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, email };
    }
    return { error: "Something went wrong. Try again.", email };
  }

  // redirect() throws to unwind, so it must sit outside the try block.
  redirect(next);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
