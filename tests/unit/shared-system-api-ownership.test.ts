import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as motionApi from "@/shared/motion";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("shared-system API ownership (B16)", () => {
  it("owns radius values on semantic tokens and aliases Tailwind scale to them", () => {
    const tokens = readProjectFile("styles/globals.css");

    expect(tokens).toContain("--radius-control: 10px;");
    expect(tokens).toContain("--radius-card: 12px;");
    expect(tokens).toContain("--radius-overlay: 16px;");
    expect(tokens).toContain("--radius-md: var(--radius-control);");
    expect(tokens).toContain("--radius-lg: var(--radius-card);");
    expect(tokens).toContain("--radius-xl: var(--radius-overlay);");
    expect(tokens).not.toMatch(/--radius-md:\s*10px;/);
    expect(tokens).not.toMatch(/--radius-lg:\s*12px;/);
    expect(tokens).not.toMatch(/--radius-xl:\s*16px;/);
  });

  it("does not export unused page-transition or native-field adapters", () => {
    const motionIndex = readProjectFile("shared/motion/index.ts");
    const patternsIndex = readProjectFile("shared/patterns/index.ts");

    expect(motionIndex).not.toContain("MotionPageTransition");
    expect(motionIndex).not.toContain("pageVariants");
    expect(motionApi).not.toHaveProperty("MotionPageTransition");
    expect(motionApi).not.toHaveProperty("pageVariants");
    expect(patternsIndex).not.toContain("labeled-native-field");
    expect(patternsIndex).not.toContain("LabeledSelect");
    expect(patternsIndex).not.toContain("LabeledDateInput");
  });
});
