"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { button } from "./ui";

type Question = {
  subject: string;
  prompt: ReactNode;
  options: string[];
  answer: number;
  explanation: string;
  /** Why each wrong option is wrong, keyed by option index. */
  why: Record<number, string>;
};

const LETTERS = ["A", "B", "C", "D"];

// Every answer and explanation here has been worked through by hand. This
// widget is the first thing a visitor judges the product by, and the product's
// promise is that answers are right.
const QUESTIONS: Question[] = [
  {
    subject: "Mathematics",
    prompt: "If log₁₀ 2 = 0.3010, find the value of log₁₀ 8.",
    options: ["0.6020", "0.9030", "2.4080", "0.0903"],
    answer: 1,
    explanation:
      "8 = 2³, so log₁₀ 8 = 3 × log₁₀ 2 = 3 × 0.3010 = 0.9030.",
    why: {
      0: "0.6020 is 2 × log₁₀ 2, which is log₁₀ 4.",
      2: "2.4080 comes from multiplying by 8 instead of by the power, 3.",
      3: "0.0903 has the right digits with the decimal point in the wrong place.",
    },
  },
  {
    subject: "Use of English",
    prompt: (
      <>
        Choose the option opposite in meaning to the word in italics: The
        reviewers were <em>laudatory</em> about her first novel.
      </>
    ),
    options: ["critical", "flattering", "detailed", "hesitant"],
    answer: 0,
    explanation:
      "Laudatory means expressing praise, so its opposite is critical.",
    why: {
      1: "Flattering is close in meaning to laudatory, not opposite to it.",
      2: "Detailed describes how much was said, not whether it was praise.",
      3: "Hesitant describes doubt, not the opposite of praise.",
    },
  },
  {
    subject: "Chemistry",
    prompt: "How many moles are there in 22 g of carbon(IV) oxide? (C = 12, O = 16)",
    options: ["0.25 mol", "0.50 mol", "1.00 mol", "2.00 mol"],
    answer: 1,
    explanation:
      "The molar mass of CO₂ is 12 + (2 × 16) = 44 g/mol. Moles = mass ÷ molar mass = 22 ÷ 44 = 0.50 mol.",
    why: {
      0: "0.25 mol of CO₂ would weigh 11 g.",
      2: "1.00 mol of CO₂ weighs 44 g, twice the mass given.",
      3: "2.00 mol of CO₂ would weigh 88 g.",
    },
  },
];

export function SampleQuestion() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const question = QUESTIONS[index];
  const answered = selected !== null;
  const correct = selected === question.answer;
  const isLast = index === QUESTIONS.length - 1;

  function choose(option: number) {
    if (answered) return;
    setSelected(option);
    if (option === question.answer) setScore((s) => s + 1);
  }

  function next() {
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
  }

  function optionStyle(option: number) {
    if (!answered) {
      return "border-line bg-canvas hover:border-brand hover:bg-tint";
    }
    if (option === question.answer) return "border-good bg-good-soft";
    if (option === selected) return "border-bad bg-bad-soft";
    return "border-line bg-canvas opacity-55";
  }

  return (
    <section
      aria-label="Sample question"
      className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7"
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-semibold text-brand-ink">{question.subject}</p>
        <p className="font-mono text-muted tabular-nums">
          {index + 1} of {QUESTIONS.length}
        </p>
      </div>

      <p className="mt-4 text-lg leading-snug font-medium text-pretty">
        {question.prompt}
      </p>

      <ul className="mt-5 grid gap-2.5">
        {question.options.map((option, i) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              aria-pressed={selected === i}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default ${optionStyle(i)}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface font-mono text-sm font-semibold text-muted">
                {LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
              {answered && i === question.answer && (
                <CheckCircle size={22} weight="fill" className="text-good" aria-label="Correct answer" />
              )}
              {answered && i === selected && i !== question.answer && (
                <XCircle size={22} weight="fill" className="text-bad" aria-label="Your answer" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <div aria-live="polite">
        {answered ? (
          <div className="mt-5 rounded-xl bg-canvas p-4 text-sm leading-relaxed">
            <p className={`font-semibold ${correct ? "text-good" : "text-bad"}`}>
              {correct
                ? "Correct."
                : `Not quite. The answer is ${LETTERS[question.answer]}.`}
            </p>
            {!correct && selected !== null && question.why[selected] && (
              <p className="mt-1 text-muted">{question.why[selected]}</p>
            )}
            <p className="mt-2">{question.explanation}</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">
            Pick an answer to see the working.
          </p>
        )}
      </div>

      {answered && !isLast && (
        <button type="button" onClick={next} className={`${button.primary} mt-5`}>
          Next question
          <ArrowRight size={16} aria-hidden />
        </button>
      )}

      {answered && isLast && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="mr-auto text-sm font-semibold">
            You got {score} of {QUESTIONS.length}.
          </p>
          <button type="button" onClick={restart} className={button.secondary}>
            <ArrowCounterClockwise size={16} aria-hidden />
            Try again
          </button>
          <Link href="/signup" className={button.primary}>
            Start free
          </Link>
        </div>
      )}
    </section>
  );
}
