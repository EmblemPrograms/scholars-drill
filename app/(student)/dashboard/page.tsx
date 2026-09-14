import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { container } from "@/app/_components/ui";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Placeholder. It exists so login has somewhere to land and so the session is
 * visibly working end to end. The real dashboard (continue practising,
 * recommendations, weak areas) comes with the practice engine.
 */
export default async function DashboardPage() {
  // The layout already redirected anyone without a session.
  const session = (await getSession())!;

  const details: Array<[string, string | null | undefined]> = [
    ["Email", session.email],
    ["Role", session.role],
    ["DSA Student ID", session.studentId || "Not a DSA-enrolled student"],
    ["Exam track", session.examTrack],
    ["Level", session.currentLevel],
    ["Programmes", session.programmes?.length ? session.programmes.join(", ") : null],
  ];

  return (
    <section className={`${container} py-12 lg:py-16`}>
      <p className="text-sm font-semibold text-brand-ink">Signed in</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Welcome, {session.fullname.split(" ")[0]}.
      </h1>
      <p className="mt-4 max-w-[38rem] leading-relaxed text-muted">
        Your account works across Distinguished Scholars Academy and Scholars
        Drill. Practice modes, mocks and your performance breakdown arrive next.
      </p>

      <dl className="mt-10 grid max-w-2xl gap-x-8 gap-y-5 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2 sm:p-8">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 font-medium break-words">{value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
