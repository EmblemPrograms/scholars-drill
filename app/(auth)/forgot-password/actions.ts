"use server";

import { apiFetch, ApiError } from "@/lib/api/client";

export type ForgotState = {
  error?: string;
  sent?: boolean;
  email?: string;
};

export async function requestReset(
  _prevState: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Enter the email address on your account." };
  }

  try {
    await apiFetch<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
    return { sent: true, email };
  } catch (error) {
    if (error instanceof ApiError) {
      // The API answers 404 for an address it does not know, which tells an
      // attacker which emails have accounts. Until that is fixed server-side,
      // do not repeat it back: show the same confirmation either way.
      if (error.status === 404) return { sent: true, email };
      return { error: error.message, email };
    }
    return { error: "Something went wrong. Try again.", email };
  }
}
