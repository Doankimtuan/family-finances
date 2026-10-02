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
    }

    expect(page).toContain("<PlanHubHero");
    expect(page).toContain('testId="plan-home-overspending"');
    expect(page).toContain('testId="plan-home-upcoming"');
    expect(loading).toContain("PlanWorkRowSkeleton");
    expect(loading).toContain('testId="plan-home-overspending"');
    expect(loading).toContain('testId="plan-home-upcoming"');

    expect(page.indexOf("<PlanCriticalSection locale=")).toBeLessThan(
      page.indexOf("<PlanAttentionSection"),
    );
    expect(page.indexOf("<PlanAttentionSection")).toBeLessThan(
      page.indexOf("<PlanJarsSection"),
    );
    expect(page.indexOf("<PlanJarsSection")).toBeLessThan(
      page.indexOf("<PlanUpcomingSection"),
    );
    expect(page.indexOf("<PlanUpcomingSection")).toBeLessThan(
      page.indexOf("<PlanShortcutSections"),
    );

    expect(loading.indexOf('testId="plan-home-jars"')).toBeLessThan(
      loading.indexOf('testId="plan-home-upcoming"'),
    );
    expect(loading.indexOf('testId="plan-home-upcoming"')).toBeLessThan(
      loading.indexOf("<PlanShortcutTilesFallback />"),
    );
  });
});
