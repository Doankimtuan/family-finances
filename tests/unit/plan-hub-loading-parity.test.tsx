import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Plan hub loading parity (B08)", () => {
  it("mirrors the loaded hub hierarchy in the route loading boundary", () => {
    const page = readProjectFile("app/[locale]/(product)/plan/page.tsx");
    const loading = readProjectFile("app/[locale]/(product)/plan/loading.tsx");

    for (const source of [page, loading]) {
      expect(source).toContain("<Page");
      expect(source).toContain("<TopAppBar");
      expect(source).toContain('testId="plan-home-jars"');
      expect(source).toContain('testId="plan-home-goals"');
    }

    expect(page).toContain("<PlanHubHero");
    expect(page).toContain("<PlanHubExceptions");
    expect(page).toContain('testId="plan-home-recommendations"');
    expect(page).toContain('testId="plan-home-upcoming"');
    expect(loading).toContain("PlanWorkRowSkeleton");
    expect(loading).toContain('testId="plan-home-exceptions"');
    expect(loading).toContain('testId="plan-home-upcoming"');

    expect(page.indexOf("<PlanHubHero")).toBeLessThan(
      page.indexOf("<PlanHubExceptions"),
    );
    expect(page.indexOf("<PlanHubExceptions")).toBeLessThan(
      page.indexOf('testId="plan-home-recommendations"'),
    );
    expect(page.indexOf('testId="plan-home-recommendations"')).toBeLessThan(
      page.indexOf('testId="plan-home-upcoming"'),
    );
    expect(page.indexOf('testId="plan-home-upcoming"')).toBeLessThan(
      page.indexOf('testId="plan-home-jars"'),
    );
    expect(page.indexOf('testId="plan-home-jars"')).toBeLessThan(
      page.indexOf('testId="plan-home-goals"'),
    );

    expect(loading.indexOf('testId="plan-home-exceptions"')).toBeLessThan(
      loading.indexOf('testId="plan-home-upcoming"'),
    );
    expect(loading.indexOf('testId="plan-home-upcoming"')).toBeLessThan(
      loading.indexOf('testId="plan-home-jars"'),
    );
    expect(loading.indexOf('testId="plan-home-jars"')).toBeLessThan(
      loading.indexOf('testId="plan-home-goals"'),
    );
  });
});
