"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/client";
import { setSessionCookie } from "@/lib/auth/session";

export type VerifyState = {
  error?: string;
  email?: string;
};

export type ResendState = {
  error?: string;
  message?: string;
};

type VerifyResponse = {
  success: boolean;
  token: string;
  user: { id: string; fullname: string; email: string };
};

export async function verifyOtp(
  _prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim();

  if (!email) return { error: "Enter the email you signed up with." };
  if (!/^\d{4,6}$/.test(otp)) {
    return { error: "Enter the code from your email.", email };
  }

  try {
    const result = await apiFetch<VerifyResponse>("/auth/verify-otp", {
      method: "POST",
      body: { email, otp },
    });

    if (!result?.token) {
      return { error: "Verified, but no session was returned. Try logging in.", email };
    }

    // Verification returns a token, so there is no reason to make someone who
    // just proved their email type their password again.
    await setSessionCookie(result.token);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message, email };
    return { error: "Something went wrong. Try again.", email };
  }

  redirect("/dashboard");
}

export async function resendOtp(
  _prevState: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email first." };

  try {
    await apiFetch<{ success: boolean }>("/auth/resend-otp", {
      method: "POST",
      body: { email },
    });
    return { message: "A new code is on its way. It expires in 10 minutes." };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "Could not send a new code. Try again." };
  }
}
