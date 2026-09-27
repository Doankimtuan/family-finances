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
  "surface-subtle",
  "surface-elevated",
  "surface-hover",
  "surface-soft",
  "surface-highlight",
  "border-subtle",
  "border-strong",
  "border-focus",
  "divider",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-muted",
  "placeholder",
  "disabled",
  "disabled-bg",
  "disabled-border",
  "disabled-text",
  "readonly-bg",
  "readonly-border",
  "readonly-text",
  "primary",
  "primary-hover",
  "primary-soft",
  "primary-fg",
  "secondary",
  "secondary-fg",
  "accent",
  "accent-fg",
  "accent-strong",
  "success",
  "warning",
  "warning-soft",
  "danger",
  "info",
  "credit",
  "debit",
  "income",
  "income-soft",
  "expense",
  "expense-soft",
  "saving",
  "savings",
  "savings-soft",
  "debt",
  "debt-soft",
  "transfer",
  "transfer-soft",
  "investment",
  "investment-soft",
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

/** Canonical corner radii (Warm Precision system). */
export const RADIUS_TOKENS = {
  xs: "4px",
  sm: "8px",
  control: "10px",
  card: "12px",
  xl: "14px",
  overlay: "16px",
  full: "9999px",
} as const;

export type RadiusToken = keyof typeof RADIUS_TOKENS;

/** Canonical spacing rhythm (4px base grid). */
export const SPACING_TOKENS = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export type SpacingToken = keyof typeof SPACING_TOKENS;

/** Canonical control dimensions and touch target guarantees. */
export const CONTROL_DIMENSIONS = {
  buttonSm: "36px",
  buttonMd: "44px",
  buttonLg: "52px",
  touchTargetMin: "44px",
  inputStandard: "48px",
  inputHero: "64px",
  topAppBar: "56px",
  bottomNav: "56px",
} as const;

/** Canonical icon sizes and stroke widths. */
export const ICON_DIMENSIONS = {
  xs: "14px",
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "32px",
  strokeResting: "1.5px",
  strokeActive: "1.9px",
  containerSm: "32px",
  containerMd: "40px",
  containerLg: "56px",
} as const;
