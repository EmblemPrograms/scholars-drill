// Shared class strings, so every CTA on the site has the same shape and states.

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold transition-[transform,background-color,border-color] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const button = {
  primary: `${base} bg-brand text-on-brand hover:bg-brand/90`,
  secondary: `${base} border border-line bg-surface text-ink hover:border-ink/30`,
  inverse: `${base} bg-on-brand text-brand hover:bg-on-brand/90 focus-visible:outline-on-brand`,
};

export const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
