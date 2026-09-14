import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

/** One definition of an input, shared by every auth form. */
export const field =
  "w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-ink transition-colors placeholder:text-muted/70 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function FormError({ message }: { message?: string }) {
  return (
    <div aria-live="polite">
      {message ? (
        <p className="flex items-start gap-2 rounded-xl bg-bad-soft px-3.5 py-3 text-sm font-medium text-bad">
          <WarningCircle size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
