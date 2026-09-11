import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { CardBillingMonthStatus } from "@/modules/ledger/application/credit-card-constants";

describe("product link prefetch posture", () => {
  it("keeps viewport product links from prefetching full RSC trees", () => {
    expect(PRODUCT_LINK_PREFETCH).toBe(false);
    const files = [
      "shared/patterns/bottom-navigation.tsx",
      "shared/patterns/top-app-bar.tsx",
      "shared/patterns/hero-pill-link.tsx",
      "app/[locale]/(product)/money/money-module-section.tsx",
      "app/[locale]/(product)/money/money-accounts-scan.tsx",
      "app/[locale]/(product)/money/loans/loan-product-row.tsx",
      "app/[locale]/(product)/home/home-product-summaries.tsx",
      "app/[locale]/(product)/plan/page.tsx",
      "app/[locale]/(product)/plan/plan-destination-row.tsx",
      "app/[locale]/(product)/plan/plan-hub-exceptions.tsx",
      "app/[locale]/(product)/plan/recommendation-list.tsx",
      "app/[locale]/(product)/plan/emergency-inbox-banner.tsx",
      "app/[locale]/(product)/plan/recurring/plan-recurring-row.tsx",
    ];
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toContain(
        "prefetch={PRODUCT_LINK_PREFETCH}",
      );
    }
  });

  it("disables prefetch on every Plan hub Link", () => {
    const source = readFileSync("app/[locale]/(product)/plan/page.tsx", "utf8");
    const linkOpens = source.match(/<Link\b/g) ?? [];
    const prefetchFlags =
      source.match(/prefetch=\{PRODUCT_LINK_PREFETCH\}/g) ?? [];
    expect(linkOpens.length).toBeGreaterThan(0);
    expect(prefetchFlags).toHaveLength(linkOpens.length);
  });
});

describe("credit card hub payload", () => {
  it("excludes settled billing months from the hub list query", () => {
    const querySource = readFileSync(
      "modules/ledger/application/queries/list-credit-cards.ts",
      "utf8",
    );
    const migrationSource = readFileSync(
      "supabase/migrations/20260911055502_money_credit_card_raw_inputs.sql",
      "utf8",
    );
    expect(migrationSource).toContain(
      `m.status <> '${CardBillingMonthStatus.SETTLED}'`,
    );
    expect(querySource).toContain(
      "export const listCreditCards = cache(loadCreditCards)",
    );
    expect(CardBillingMonthStatus.SETTLED).toBe("settled");
  });
});
