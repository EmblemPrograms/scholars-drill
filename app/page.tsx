import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChartLineUp,
  Flag,
  ListChecks,
  MagnifyingGlass,
  PencilSimple,
  SealCheck,
} from "@phosphor-icons/react/dist/ssr";
import dsaGraduates from "@/public/images/dsa-graduates.jpg";
import { PracticeModes } from "./_components/practice-modes";
import { ResultPreview } from "./_components/result-preview";
import { SampleQuestion } from "./_components/sample-question";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { button, container } from "./_components/ui";

const reviewSteps = [
  {
    icon: PencilSimple,
    title: "Written",
    body: "A tutor writes the question, the answer and the working.",
  },
  {
    icon: MagnifyingGlass,
    title: "Reviewed",
    body: "A reviewer checks it and can send it back for correction.",
  },
  {
    icon: SealCheck,
    title: "Approved",
    body: "Only approved questions are cleared for publishing.",
  },
  {
    icon: Flag,
    title: "Published",
    body: "It reaches your practice with a report button attached.",
  },
];

const resultPoints = [
  {
    icon: ListChecks,
    text: "Review every question with the correct answer and the working.",
  },
  {
    icon: ChartLineUp,
    text: "Watch your accuracy per subject change from one attempt to the next.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section
          className={`${container} grid items-center gap-12 pt-12 pb-20 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-28`}
        >
          <div>
            <p className="rise text-sm font-semibold text-brand-ink">
              For JAMB, WAEC, NECO and Post-UTME
            </p>
            <h1 className="rise mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance [--i:1] sm:text-5xl">
              Practise the real exam before exam day.
            </h1>
            <p className="rise mt-6 max-w-[34rem] text-lg leading-relaxed text-muted [--i:2]">
              Past questions by subject, topic and year, with a worked
              explanation for every answer. Free to start.
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3 [--i:3]">
              <Link href="/signup" className={button.primary}>
                Start free
              </Link>
              <Link href="/login" className={button.secondary}>
                Log in
              </Link>
            </div>
          </div>

          <div className="rise [--i:2]">
            <SampleQuestion />
          </div>
        </section>

        {/* Practice modes */}
        <section id="modes" className={`${container} scroll-mt-20 pb-24 lg:pb-32`}>
          <div className="reveal max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Five ways to practise
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Start with a few quick questions or sit a full timed mock. Every
              mode draws from the same checked question bank.
            </p>
          </div>
          <div className="mt-10">
            <PracticeModes />
          </div>
        </section>

        {/* Results */}
        <section
          id="results"
          className={`${container} grid scroll-mt-20 items-center gap-12 pb-24 lg:grid-cols-2 lg:gap-20 lg:pb-32`}
        >
          <div className="reveal order-2 lg:order-1">
            <ResultPreview />
          </div>
          <div className="reveal order-1 lg:order-2">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              See exactly where your marks go.
            </h2>
            <p className="mt-4 max-w-[36rem] text-lg leading-relaxed text-muted">
              After every quiz you get your score, the time you used, and your
              accuracy for each subject and topic. Your weakest topics come
              first.
            </p>
            <ul className="mt-8 grid gap-4">
              {resultPoints.map(({ icon: PointIcon, text }) => (
                <li key={text} className="flex gap-3">
                  <PointIcon size={22} aria-hidden className="mt-0.5 shrink-0 text-brand-ink" />
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Verified answers */}
        <section id="verified" className="scroll-mt-16 border-y border-line bg-surface">
          <div className={`${container} py-20 lg:py-28`}>
            <div className="reveal max-w-3xl">
              <p className="text-sm font-semibold text-brand-ink">Verified answers</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Every answer is checked before you see it.
              </h2>
              <p className="mt-5 max-w-[40rem] text-lg leading-relaxed text-muted">
                No question reaches you until it has been reviewed and
                approved. Spot a mistake? Report it, and the question is pulled
                until it is fixed.
              </p>
            </div>

            <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {reviewSteps.map(({ icon: StepIcon, title, body }) => (
                <li key={title} className="reveal border-t-2 border-brand pt-5">
                  <StepIcon size={26} aria-hidden className="text-brand-ink" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* DSA students */}
        <section
          id="dsa"
          className={`${container} grid scroll-mt-20 items-center gap-12 py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-32`}
        >
          <div className="reveal">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Already a student at Distinguished Scholars Academy?
            </h2>
            <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-muted">
              Log in with the email and password you use for DSA. Your details
              come with you, so there is nothing to fill in twice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/login" className={button.primary}>
                Log in
              </Link>
              <a
                href="https://distinguishedscholarsacademy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline hover:underline-offset-4"
              >
                About DSA
                <ArrowUpRight size={16} aria-hidden />
              </a>
            </div>
          </div>

          <div className="reveal overflow-hidden rounded-2xl">
            <Image
              src={dsaGraduates}
              alt="Distinguished Scholars Academy students in graduation gowns"
              placeholder="blur"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="aspect-[3/2] h-auto w-full object-cover"
            />
          </div>
        </section>

        {/* Final call to action */}
        <section className={`${container} pb-24 lg:pb-32`}>
          <div className="reveal rounded-2xl bg-brand px-6 py-14 text-center text-on-brand sm:px-12 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your first drill is free.
            </h2>
            <p className="mx-auto mt-4 max-w-[32rem] text-lg leading-relaxed text-on-brand/85">
              Create a free account and start practising in any subject today.
            </p>
            <Link href="/signup" className={`${button.inverse} mt-8`}>
              Start free
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
