import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const REVEAL_OPEN_TAG = /<MotionReveal(?:\s|>)/g;

describe("Money motion ownership", () => {
  it("keeps one reveal per money surface and static account/destination regions", () => {
    const moneyPage = readProjectFile("app/[locale]/(product)/money/page.tsx");
    const accountDetailPage = readProjectFile(
      "app/[locale]/(product)/money/accounts/[id]/page.tsx",
    );
    const investmentDetailPage = readProjectFile(
      "app/[locale]/(product)/money/investments/[id]/page.tsx",
    );
    const investmentOverview = readProjectFile(
      "app/[locale]/(product)/money/investments/investment-overview-client.tsx",
    );
    const savingsPage = readProjectFile(
      "app/[locale]/(product)/money/savings/page.tsx",
    );
    const savingsDetailPage = readProjectFile(
      "app/[locale]/(product)/money/savings/[id]/page.tsx",
    );
    const loansPage = readProjectFile(
      "app/[locale]/(product)/money/loans/page.tsx",
    );
    const loanDetailPage = readProjectFile(
      "app/[locale]/(product)/money/loans/[id]/page.tsx",
    );
    const loanSchedulePage = readProjectFile(
      "app/[locale]/(product)/money/loans/[id]/schedule/page.tsx",
    );
    const debtsPage = readProjectFile(
      "app/[locale]/(product)/money/debts/page.tsx",
    );
    const debtDetailPage = readProjectFile(
      "app/[locale]/(product)/money/debts/[id]/page.tsx",
    );
    const accountScan = readProjectFile(
      "app/[locale]/(product)/money/money-accounts-scan.tsx",
    );

    for (const source of [
      moneyPage,
      accountDetailPage,
      investmentDetailPage,
      investmentOverview,
      savingsPage,
      savingsDetailPage,
      loansPage,
      loanDetailPage,
      loanSchedulePage,
      debtsPage,
      debtDetailPage,
    ]) {
      expect(source.match(REVEAL_OPEN_TAG)).toHaveLength(1);
      expect(source).not.toMatch(/delay\s*=/);
      expect(source).not.toMatch(/index\s*\*/);
    }
    expect(accountScan).not.toContain("motion/react");
  });

  it("routes Savings expand/collapse through useMotionPolicy", () => {
    const cycleHistory = readProjectFile(
      "app/[locale]/(product)/money/savings/[id]/savings-cycle-history.tsx",
    );
    const renewalEditor = readProjectFile(
      "app/[locale]/(product)/money/savings/[id]/renewal-policy-editor.tsx",
    );
    const catalogManager = readProjectFile(
      "app/[locale]/(product)/money/savings/savings-catalog-manager.tsx",
    );

    for (const source of [cycleHistory, renewalEditor, catalogManager]) {
      expect(source).toContain("useMotionPolicy");
      expect(source).toContain("motionPolicy.enabled");
    }
  });

  it("keeps financial object rendering free of value animation", () => {
    const accountCard = readProjectFile("modules/ledger/ui/account-card.tsx");
    const creditCard = readProjectFile(
      "modules/ledger/ui/credit-card-card.tsx",
    );
    const accountHero = readProjectFile(
      "shared/patterns/financial-account-hero.tsx",
    );

    for (const source of [accountCard, creditCard, accountHero]) {
      expect(source).not.toContain("motion/react");
      expect(source).not.toMatch(/animate\s*=/);
    }
  });
});
