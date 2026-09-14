import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/login/actions";
import { BrandMark } from "@/app/_components/brand-mark";
import { container } from "@/app/_components/ui";

/**
 * The real guard for the signed-in area.
 *
 * `proxy.ts` only checks that a cookie exists. This asks the API who the cookie
 * belongs to, so an expired or revoked token cannot reach a student page.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className={`${container} flex h-16 items-center justify-between gap-4`}>
          <BrandMark />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{session.fullname}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full px-3 py-2 font-semibold text-ink transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
