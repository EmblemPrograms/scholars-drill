import {
  CalendarBlank,
  Lightning,
  Shuffle,
  Target,
  Timer,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

type Mode = {
  icon: Icon;
  title: string;
  body: string;
  example?: string;
  /** Grid placement and surface for the bento cell. */
  cell: string;
  tone: "brand" | "tint" | "plain";
};

// Five modes, five cells: 2 + 1 on the first row, 1 + 1 + 1 on the second.
const modes: Mode[] = [
  {
    icon: Timer,
    title: "Full CBT simulation",
    body: "Timed like the real exam. Flag questions, jump around with the question grid, and submit when you are done or when the clock runs out.",
    cell: "md:col-span-2",
    tone: "brand",
  },
  {
    icon: CalendarBlank,
    title: "Past questions",
    body: "Choose the exam, the subject and the year.",
    example: "JAMB, Use of English, 2024",
    cell: "",
    tone: "tint",
  },
  {
    icon: Target,
    title: "Topic practice",
    body: "Go straight to the topic you keep getting wrong.",
    example: "Physics, Mechanics, 20 questions",
    cell: "",
    tone: "plain",
  },
  {
    icon: Lightning,
    title: "Quick drill",
    body: "Pick a subject and a number of questions. Done in minutes.",
    cell: "",
    tone: "plain",
  },
  {
    icon: Shuffle,
    title: "Mixed practice",
    body: "Questions from across a subject's topics, mixed the way the real paper mixes them.",
    cell: "",
    tone: "plain",
  },
];

const tones = {
  brand: "bg-brand text-on-brand border-transparent",
  tint: "bg-tint border-transparent",
  plain: "bg-surface border-line",
};

export function PracticeModes() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {modes.map(({ icon: ModeIcon, title, body, example, cell, tone }) => (
        <li
          key={title}
          className={`reveal flex flex-col rounded-2xl border p-6 sm:p-7 ${tones[tone]} ${cell}`}
        >
          <ModeIcon
            size={28}
            aria-hidden
            className={tone === "brand" ? "text-on-brand" : "text-brand-ink"}
          />
          <h3
            className={`mt-5 font-semibold tracking-tight ${tone === "brand" ? "text-2xl sm:text-3xl" : "text-lg"}`}
          >
            {title}
          </h3>
          <p
            className={`mt-2 leading-relaxed ${tone === "brand" ? "max-w-md text-on-brand/85" : "text-muted"}`}
          >
            {body}
          </p>
          {example && (
            <p className="mt-auto pt-6 font-mono text-sm text-ink">{example}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
