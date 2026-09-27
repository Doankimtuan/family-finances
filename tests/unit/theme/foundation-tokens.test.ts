import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SEMANTIC_COLOR_TOKENS,
  THEME_MODES,
  RADIUS_TOKENS,
  SPACING_TOKENS,
  CONTROL_DIMENSIONS,
  ICON_DIMENSIONS,
  cssVar,
} from "@/shared/theme";

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

  it("defines the 5-tier geometric radius tokens matching Task 11", () => {
    expect(RADIUS_TOKENS.xs).toBe("4px");
    expect(RADIUS_TOKENS.sm).toBe("8px");
    expect(RADIUS_TOKENS.control).toBe("10px");
    expect(RADIUS_TOKENS.card).toBe("12px");
    expect(RADIUS_TOKENS.xl).toBe("14px");
    expect(RADIUS_TOKENS.overlay).toBe("16px");
    expect(RADIUS_TOKENS.full).toBe("9999px");
  });

  it("defines 4px baseline coordinate spacing tokens", () => {
    expect(SPACING_TOKENS[0]).toBe("0px");
    expect(SPACING_TOKENS[1]).toBe("4px");
    expect(SPACING_TOKENS[2]).toBe("8px");
    expect(SPACING_TOKENS[3]).toBe("12px");
    expect(SPACING_TOKENS[4]).toBe("16px");
    expect(SPACING_TOKENS[5]).toBe("20px");
    expect(SPACING_TOKENS[6]).toBe("24px");
    expect(SPACING_TOKENS[8]).toBe("32px");
    expect(SPACING_TOKENS[10]).toBe("40px");
    expect(SPACING_TOKENS[12]).toBe("48px");
    expect(SPACING_TOKENS[16]).toBe("64px");
  });

  it("guarantees WCAG AA minimum 44px interactive control dimensions", () => {
    expect(CONTROL_DIMENSIONS.touchTargetMin).toBe("44px");
    expect(CONTROL_DIMENSIONS.buttonMd).toBe("44px");
    expect(CONTROL_DIMENSIONS.topAppBar).toBe("56px");
    expect(CONTROL_DIMENSIONS.bottomNav).toBe("56px");
    expect(CONTROL_DIMENSIONS.inputStandard).toBe("48px");
    expect(CONTROL_DIMENSIONS.inputHero).toBe("64px");
  });

  it("defines Warm Precision icon system sizing and resting/active strokes", () => {
    expect(ICON_DIMENSIONS.sm).toBe("16px");
    expect(ICON_DIMENSIONS.md).toBe("20px");
    expect(ICON_DIMENSIONS.lg).toBe("24px");
    expect(ICON_DIMENSIONS.strokeResting).toBe("1.5px");
    expect(ICON_DIMENSIONS.strokeActive).toBe("1.9px");
    expect(ICON_DIMENSIONS.containerSm).toBe("32px");
    expect(ICON_DIMENSIONS.containerMd).toBe("40px");
  });

  it("verifies styles/globals.css contains canonical Light and Dark tokens", () => {
    const cssPath = resolve(process.cwd(), "styles/globals.css");
    const css = readFileSync(cssPath, "utf8");

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
