import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REVEAL_OPEN_TAG = /<MotionReveal(?:\s|>)/g;

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("MotionReveal usage contract (B09)", () => {
  it("does not expose delayed entrance on the shared primitive", () => {
    const reveal = readProjectFile("shared/motion/reveal.tsx");

    expect(reveal).not.toMatch(/\bdelay\b/);
    expect(reveal).toContain("useMotionPolicy");
    expect(reveal).toContain("springs.gentle");
  });

  it("keeps one hero-group reveal on Plan, Home, and Together", () => {
    const planHub = readProjectFile("app/[locale]/(product)/plan/page.tsx");
    const home = readProjectFile("app/[locale]/(product)/home/page.tsx");
    const together = readProjectFile(
      "app/[locale]/(product)/together/page.tsx",
    );

    expect(planHub.match(REVEAL_OPEN_TAG)).toHaveLength(1);
    expect(planHub).toContain("<PlanHubHero");
    expect(home.match(REVEAL_OPEN_TAG)).toHaveLength(1);
    expect(home).toContain("<HomeFinancialPulse");
    expect(together.match(REVEAL_OPEN_TAG)).toHaveLength(1);
    expect(together).toContain('tone="hero"');

    for (const source of [planHub, home, together]) {
      expect(source).not.toMatch(/delay\s*=/);
      expect(source).not.toMatch(/index\s*\*\s*/);
    }
  });
});
