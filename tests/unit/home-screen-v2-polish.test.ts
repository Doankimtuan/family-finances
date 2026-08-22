import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Home Screen v2 polish contracts", () => {
  it("visually detaches the sticky capture action", () => {
    const source = read("shared/patterns/bottom-action-bar.tsx");

    expect(source).toContain("before:bg-gradient-to-t");
    expect(source).toContain("shadow-[0_-8px_18px_-12px");
    expect(source).toContain("dark:shadow-[0_-8px_20px_-12px");
  });

  it("keeps Cash Flow hierarchy compact and numeric values aligned", () => {
    const source = read(
      "app/[locale]/(product)/home/home-cash-flow-section.tsx",
    );

    expect(source).not.toContain("cashFlow.navigationLabel");
    expect(source).not.toContain("cashFlow.navigation");
    expect(source).toContain('t("cashFlow.infoLabel")');
    expect(source).toContain('className="mt-(--space-1) text-right"');
    expect(source).not.toContain('title={t("cashFlow.summaryLabel")}');
  });

  it("uses one uncategorized review affordance and stronger plan parity", () => {
    const spending = read(
      "app/[locale]/(product)/home/home-spending-section.tsx",
    );
    const home = read("app/[locale]/(product)/home/page.tsx");

    expect(spending).toContain('t("spending.reviewAria"');
    expect(spending).not.toContain('t("spending.reviewAvailable")');
    expect(home).toContain("FINANCE_ICONS.savings");
    expect(home).toContain("bg-surface-elevated");
  });

  it("clarifies quiet chart periods and keeps labels bilingual", () => {
    const chart = read("app/[locale]/(product)/home/home-cash-flow-chart.tsx");
    const english = JSON.parse(read("messages/en/home.json")) as {
      cashFlow: { infoLabel: string; lowData: string };
    };
    const vietnamese = JSON.parse(read("messages/vi/home.json")) as {
      cashFlow: { infoLabel: string; lowData: string };
    };
    const navigation = JSON.parse(read("messages/vi/navigation.json")) as {
      together: string;
    };

    expect(chart).toContain("<ReferenceLine");
    expect(chart).toContain('strokeDasharray="2 4"');
    expect(chart).toContain("dot={{");
    expect(english.cashFlow.infoLabel).toBe("What’s included");
    expect(vietnamese.cashFlow.infoLabel).toBe("Phạm vi số liệu");
    expect(english.cashFlow.lowData).toContain("confirmed as zero");
    expect(vietnamese.cashFlow.lowData).toContain("không phát sinh");
    expect(navigation.together).toBe("Cùng nhau");
  });
});
