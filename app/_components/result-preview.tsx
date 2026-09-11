// A static preview of the results screen (PRD sections 15 to 17), filled with
// clearly labelled sample data. The numbers are internally consistent:
// 14 + 11 + 6 = 31 correct out of 16 + 12 + 12 = 40 questions.

const topics = [
  { name: "Algebra", correct: 14, total: 16 },
  { name: "Indices and logarithms", correct: 11, total: 12 },
  { name: "Probability", correct: 6, total: 12 },
];

const WEAK_BELOW = 60;

export function ResultPreview() {
  const correct = topics.reduce((sum, t) => sum + t.correct, 0);
  const total = topics.reduce((sum, t) => sum + t.total, 0);

  return (
    <figure className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <figcaption className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold">Mathematics mock</span>
        <span className="rounded-full bg-tint px-3 py-1 text-xs font-medium text-muted">
          Sample result
        </span>
      </figcaption>

      <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3">
        <p className="font-mono text-5xl font-semibold tracking-tight tabular-nums">
          {correct}
          <span className="text-2xl text-muted">/{total}</span>
        </p>
        <dl className="flex gap-6 pb-1.5 text-sm">
          <div>
            <dt className="text-muted">Score</dt>
            <dd className="font-mono font-semibold tabular-nums">
              {Math.round((correct / total) * 100)}%
            </dd>
          </div>
          <div>
            <dt className="text-muted">Time used</dt>
            <dd className="font-mono font-semibold tabular-nums">38 of 45 min</dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 leading-relaxed text-muted">
        Good attempt. You were strong in indices and algebra but lost marks in
        probability.
      </p>

      <ul className="mt-6 grid gap-4">
        {topics.map((topic) => {
          const pct = Math.round((topic.correct / topic.total) * 100);
          const weak = pct < WEAK_BELOW;
          return (
            <li key={topic.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">
                  {topic.name}
                  {weak && (
                    <span className="ml-2 rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad">
                      Weak area
                    </span>
                  )}
                </span>
                <span className="font-mono text-muted tabular-nums">
                  {topic.correct}/{topic.total}, {pct}%
                </span>
              </div>
              <span
                aria-hidden
                className={`mt-2 block h-1.5 rounded-full ${weak ? "bg-bad" : "bg-brand"}`}
                style={{ width: `${pct}%` }}
              />
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
