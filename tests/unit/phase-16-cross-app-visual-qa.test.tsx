import type { ComponentProps } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import { TransactionAmountTone } from "@/shared/patterns/transaction-row";
import { Progress } from "@/shared/ui/progress";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { TransactionListItem } from "@/app/[locale]/(product)/money/transactions/transaction-list-item";
import GlobalNotFound from "@/app/not-found";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { LOCALE_NATIVE_LABEL } from "@/i18n/locales";
import enErrors from "@/messages/en/errors.json";
import viErrors from "@/messages/vi/errors.json";
import enAuth from "@/messages/en/auth.json";
import viAuth from "@/messages/vi/auth.json";
import enMoney from "@/messages/en/money.json";
import viMoney from "@/messages/vi/money.json";
import enPlan from "@/messages/en/plan.json";
import viPlan from "@/messages/vi/plan.json";
import enNavigation from "@/messages/en/navigation.json";
import viNavigation from "@/messages/vi/navigation.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const FORBIDDEN_COPY = [
  "Net Worth",
  "Free to Spend",
  "Ready to Assign",
  "Age of Money",
  "Total Money",
] as const;

describe("Phase 16 cross-app visual QA", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps exactly five IA tabs and excludes Health", () => {
    expect(TABS).toHaveLength(5);
    expect(TABS.map((tab) => tab.href)).toEqual([
      APP_PATH.HOME,
      APP_PATH.MONEY,
      APP_PATH.PLAN,
      APP_PATH.INBOX,
      APP_PATH.TOGETHER,
    ]);
    expect(TABS.some((tab) => tab.href === APP_PATH.HEALTH)).toBe(false);
  });

  it("does not leak transaction amounts through the list accessible name when privacy is on", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <ul>
          <TransactionListItem
            href={moneyTransactionPath("txn-1")}
            activityId="txn-1"
            title="Coffee shop"
            subtitle="Food · Cash"
            amountLabel="−₫85,000"
            amountMeta=""
            amountAria="Expense ₫85,000"
            tone={TransactionAmountTone.DEBIT}
            leading={<span>icon</span>}
          />
        </ul>
      </FinancialPrivacyProvider>,
    );

    const row = screen.getByTestId("transaction-row-txn-1");
    expect(row).toHaveAccessibleName("Coffee shop. Food · Cash");
    expect(row).not.toHaveAccessibleName(/₫85,000/);
    expect(row).not.toHaveTextContent("−₫85,000");
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
  });

  it("omits a hardcoded Progress accessible name when unlabeled", () => {
    render(<Progress value={40} showLabel={false} />);
    expect(screen.getByRole("progressbar")).not.toHaveAccessibleName(
      "Progress",
    );
  });

  it("tokenizes the Inbox badge and global not-found chrome", () => {
    const nav = readProjectFile("shared/patterns/bottom-navigation.tsx");
    expect(nav).not.toContain("text-[10px]");
    expect(nav).toContain("text-xs");

    const progress = readProjectFile("shared/ui/progress.tsx");
    expect(progress).not.toContain('"Progress"');

    render(<GlobalNotFound />);
    expect(
      screen.getByRole("heading", { name: enErrors.notFound }),
    ).toBeInTheDocument();
    expect(screen.getByText(viErrors.notFound)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: LOCALE_NATIVE_LABEL.en }),
    ).toHaveAttribute("href", "/en");
    expect(
      screen.getByRole("link", { name: LOCALE_NATIVE_LABEL.vi }),
    ).toHaveAttribute("href", "/vi");
  });

  it("does not ship forbidden competitor copy in product messages", () => {
    const catalogs = [
      JSON.stringify(enAuth),
      JSON.stringify(viAuth),
      JSON.stringify(enMoney),
      JSON.stringify(viMoney),
      JSON.stringify(enPlan),
      JSON.stringify(viPlan),
      JSON.stringify(enNavigation),
      JSON.stringify(viNavigation),
    ].join("\n");

    for (const phrase of FORBIDDEN_COPY) {
      expect(catalogs).not.toContain(phrase);
    }
    expect(enAuth.welcome).not.toHaveProperty("previewNetLabel");
    expect(JSON.stringify(enAuth)).not.toContain("left this month");
  });
});
