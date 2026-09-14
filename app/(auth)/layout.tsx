import Link from "next/link";
import { BrandMark } from "@/app/_components/brand-mark";

/**
 * Shell for signed-out pages: login, signup, OTP, password reset.
 * Deliberately has no app navigation, so there is one thing to do on the page.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <BrandMark />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 sm:items-center sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 text-sm text-muted sm:px-6">
        <Link href="/" className="hover:text-ink">
          Back to home
        </Link>
      </footer>
    </div>
  );
}
