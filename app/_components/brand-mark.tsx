import Link from "next/link";
import { Exam } from "@phosphor-icons/react/dist/ssr";

export function BrandMark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-full font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <span className="grid size-8 place-items-center rounded-xl bg-brand text-on-brand">
        <Exam size={18} aria-hidden />
      </span>
      Scholars Drill
    </Link>
  );
}
