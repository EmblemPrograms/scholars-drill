"use server";

import { apiFetch, ApiError } from "@/lib/api/client";

export type ResetState = {
  error?: string;
  done?: boolean;
};

/** Matches the backend's own minimum for a password. */
const MIN_LENGTH = 6;

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) {
    return { error: "This reset link is missing its token. Request a new link." };
  }
  if (newPassword.length < MIN_LENGTH) {
    return { error: `Use at least ${MIN_LENGTH} characters.` };
  }
  if (newPassword !== confirm) {
    return { error: "The two passwords do not match." };
  }

  try {
    await apiFetch<{ success: boolean; message: string }>(
      `/auth/reset-password/${encodeURIComponent(token)}`,
      { method: "POST", body: { newPassword } },
    );
    return { done: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Something went wrong. Try again." };
  }
}
