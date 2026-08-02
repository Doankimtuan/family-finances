/**
 * Semantic color token IDs used across ViNha.
 * Values live in styles/globals.css as --color-* / --vinha-*.
 * Components must reference these names (or Tailwind utilities derived from them),
 * never raw palette hex.
 */
export const SEMANTIC_COLOR_TOKENS = [
  "canvas-outer",
  "canvas",
  "surface",
  "surface-elevated",
  "surface-hover",
  "border-subtle",
  "border-strong",
  "divider",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-muted",
  "placeholder",
  "disabled",
  "primary",
  "primary-hover",
  "primary-fg",
  "secondary",
  "secondary-fg",
  "accent",
  "accent-fg",
  "accent-strong",
  "success",
  "warning",
  "danger",
  "info",
  "credit",
  "debit",
  "income",
  "expense",
  "saving",
  "installment",
  "health-excellent",
  "health-good",
  "health-warning",
  "health-critical",
  "chart-ink",
  "chart-grid",
  "chart-positive",
  "chart-negative",
  "chart-neutral",
  "chart-series-real",
  "chart-series-intention",
  "skeleton",
  "overlay",
  "backdrop",
  "focus-ring",
  "inverse",
  "inverse-fg",
] as const;

export type SemanticColorToken = (typeof SEMANTIC_COLOR_TOKENS)[number];

export function cssVar(token: SemanticColorToken): string {
  return `var(--color-${token})`;
}

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
