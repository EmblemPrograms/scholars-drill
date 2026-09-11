import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { button, container } from "./ui";

const links = [
  { href: "#modes", label: "Practice modes" },
  { href: "#results", label: "Results" },
  { href: "#verified", label: "Verified answers" },
  { href: "#dsa", label: "DSA students" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className={`${container} flex h-16 items-center justify-between gap-6`}>
        <BrandMark />

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-semibold text-ink transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Log in
          </Link>
          <Link href="/signup" className={`${button.primary} px-4 py-2.5`}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
