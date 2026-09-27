import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SEMANTIC_COLOR_TOKENS, THEME_MODES, cssVar } from "@/shared/theme";

describe("Foundation Tokens — ViNha Warm Precision", () => {
  it("exposes canonical theme modes", () => {
    expect(THEME_MODES).toEqual(["system", "light", "dark"]);
  });

  it("exposes all canonical surface and border tokens", () => {
    expect(SEMANTIC_COLOR_TOKENS).toContain("canvas");
    expect(SEMANTIC_COLOR_TOKENS).toContain("canvas-outer");
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface");
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface-subtle");
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface-elevated");
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface-hover");
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface-highlight");
    expect(SEMANTIC_COLOR_TOKENS).toContain("border-subtle");
    expect(SEMANTIC_COLOR_TOKENS).toContain("border-strong");
    expect(SEMANTIC_COLOR_TOKENS).toContain("border-focus");
    expect(SEMANTIC_COLOR_TOKENS).toContain("divider");
  });

  it("exposes all financial domain semantic tokens and soft containers", () => {
    expect(SEMANTIC_COLOR_TOKENS).toContain("primary");
    expect(SEMANTIC_COLOR_TOKENS).toContain("primary-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("income");
    expect(SEMANTIC_COLOR_TOKENS).toContain("income-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("expense");
    expect(SEMANTIC_COLOR_TOKENS).toContain("expense-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("debt");
    expect(SEMANTIC_COLOR_TOKENS).toContain("debt-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("transfer");
    expect(SEMANTIC_COLOR_TOKENS).toContain("transfer-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("investment");
    expect(SEMANTIC_COLOR_TOKENS).toContain("investment-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("warning");
    expect(SEMANTIC_COLOR_TOKENS).toContain("warning-soft");
    expect(SEMANTIC_COLOR_TOKENS).toContain("savings");
    expect(SEMANTIC_COLOR_TOKENS).toContain("savings-soft");
  });

  it("strictly distinguishes Disabled tokens from Read-Only tokens", () => {
    // Disabled tokens
    expect(SEMANTIC_COLOR_TOKENS).toContain("disabled");
    expect(SEMANTIC_COLOR_TOKENS).toContain("disabled-bg");
    expect(SEMANTIC_COLOR_TOKENS).toContain("disabled-border");
    expect(SEMANTIC_COLOR_TOKENS).toContain("disabled-text");

    // Read-only tokens
    expect(SEMANTIC_COLOR_TOKENS).toContain("readonly-bg");
    expect(SEMANTIC_COLOR_TOKENS).toContain("readonly-border");
    expect(SEMANTIC_COLOR_TOKENS).toContain("readonly-text");

    // Must be distinct variable keys
    expect(cssVar("disabled-bg")).not.toEqual(cssVar("readonly-bg"));
    expect(cssVar("disabled-text")).not.toEqual(cssVar("readonly-text"));
  });

  it("verifies styles/globals.css contains canonical Light and Dark tokens", () => {
    const cssPath = resolve(process.cwd(), "styles/globals.css");
    const css = readFileSync(cssPath, "utf8");

    // CSS is the single source of truth for geometric and control tokens.
    expect(css).toContain("--radius-sm: 8px");
    expect(css).toContain("--radius-control: 10px");
    expect(css).toContain("--radius-card: 12px");
    expect(css).toContain("--control-touch-target: 44px");
    expect(css).toContain("--icon-stroke-resting: 1.5px");

    // Light theme checks
    expect(css).toContain("--vinha-canvas: #fafaf9");
    expect(css).toContain("--vinha-surface: #ffffff");
    expect(css).toContain("--vinha-surface-subtle: #f6f4f2");
    expect(css).toContain("--vinha-border-subtle: #dde4e1");
    expect(css).toContain("--vinha-primary: #0f766e");
    expect(css).toContain("--vinha-income: #047857");
    expect(css).toContain("--vinha-income-soft: #ecfdf5");
    expect(css).toContain("--vinha-expense: #27272a");
    expect(css).toContain("--vinha-expense-soft: #f4f4f5");
    expect(css).toContain("--vinha-debt: #be123c");
    expect(css).toContain("--vinha-debt-soft: #fff1f2");
    expect(css).toContain("--vinha-warning: #b45309");
    expect(css).toContain("--vinha-warning-soft: #fffbeb");

    // Dark theme checks
    expect(css).toContain("--vinha-canvas: #141416");
    expect(css).toContain("--vinha-surface: #1c1c1f");
    expect(css).toContain("--vinha-surface-subtle: #242428");
    expect(css).toContain("--vinha-border-subtle: #3f3f46");
    expect(css).toContain("--vinha-primary: #2dd4bf");
    expect(css).toContain("--vinha-income: #34d399");
    expect(css).toContain("--vinha-income-soft: #064e3b");
    expect(css).toContain("--vinha-expense: #e4e4e7");
    expect(css).toContain("--vinha-expense-soft: #27272a");
    expect(css).toContain("--vinha-debt: #fb7185");
    expect(css).toContain("--vinha-debt-soft: #4c0519");
    expect(css).toContain("--vinha-warning: #fbbf24");
    expect(css).toContain("--vinha-warning-soft: #451a03");

    // Canonical --vn-* aliases check
    expect(css).toContain("--vn-canvas: var(--vinha-canvas)");
    expect(css).toContain("--vn-surface: var(--vinha-surface)");
    expect(css).toContain("--vn-primary: var(--vinha-primary)");
    expect(css).toContain("--vn-income: var(--vinha-income)");
    expect(css).toContain("--vn-expense: var(--vinha-expense)");
    expect(css).toContain("--vn-debt: var(--vinha-debt)");

    // Typography utilities check
    expect(css).toContain(".text-numeric-hero");
    expect(css).toContain(".text-numeric-lg");
    expect(css).toContain(".text-numeric-md");
    expect(css).toContain(".text-display-lg");
    expect(css).toContain(".text-headline-lg");
    expect(css).toContain(".touch-target-44");
    expect(css).toContain(".pt-safe");
    expect(css).toContain(".pb-safe");
    expect(css).toContain(".screen-gutter");
    expect(css).toContain(".state-disabled");
    expect(css).toContain(".state-readonly");
  });
});
