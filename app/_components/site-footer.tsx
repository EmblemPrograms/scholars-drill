import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "./brand-mark";
import { container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div
        className={`${container} flex flex-col gap-8 py-10 text-sm md:flex-row md:items-center md:justify-between`}
      >
        <div className="flex flex-col gap-3">
          <BrandMark />
          <p className="text-muted">
            A{" "}
            <a
              href="https://distinguishedscholarsacademy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Distinguished Scholars Academy
              <ArrowUpRight size={14} aria-hidden />
            </a>{" "}
            product.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
          <a href="#modes" className="hover:text-ink">Practice modes</a>
          <a href="#verified" className="hover:text-ink">Verified answers</a>
          <Link href="/login" className="hover:text-ink">Log in</Link>
          <Link href="/signup" className="hover:text-ink">Start free</Link>
        </nav>

        <p className="text-muted">
          © {new Date().getFullYear()} Scholars Drill
        </p>
      </div>
    </footer>
  );
}
