import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Money motion ownership", () => {
  it("keeps one overview reveal and static account/destination regions", () => {
    const moneyPage = readProjectFile("app/[locale]/(product)/money/page.tsx");
    const detailPage = readProjectFile(
      "app/[locale]/(product)/money/accounts/[id]/page.tsx",
    );
    const accountScan = readProjectFile(
      "app/[locale]/(product)/money/money-accounts-scan.tsx",
    );

    expect(moneyPage.match(/<MotionReveal(?:\s|>)/g)).toHaveLength(1);
    expect(detailPage).not.toContain("MotionReveal");
    expect(accountScan).not.toContain("motion/react");
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
