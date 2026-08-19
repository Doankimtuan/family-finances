import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeFinancialPulse } from "@/app/[locale]/(product)/home/home-financial-pulse";
import { HomeDashboardPeriod } from "@/modules/home/application/home-constants";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("financial value privacy", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function renderPulse() {
    return render(
      <FinancialPrivacyProvider>
        <HomeFinancialPulse
          balance={1_200_000}
          currency="VND"
          locale="vi"
          period={HomeDashboardPeriod.MONTH}
          metrics={null}
        />
      </FinancialPrivacyProvider>,
    );
  }

  it("shows values by default and masks them without exposing the raw amount", async () => {
    renderPulse();

    expect(screen.getByTestId("ledger-balance")).toHaveTextContent(
      "1.200.000 ₫",
    );
    const toggle = screen.getByTestId("home-financial-privacy-toggle");
    expect(toggle).toHaveAccessibleName("financialPrivacy.hide");

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId("ledger-balance")).toHaveTextContent("••••••");
    });
    expect(document.body).not.toHaveTextContent("1.200.000 ₫");
    expect(toggle).toHaveAccessibleName("financialPrivacy.show");
    expect(window.localStorage.getItem("vinha.financial-values-hidden")).toBe(
      "true",
    );
  });

  it("restores a persisted hidden preference after remount", async () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");
    renderPulse();

    await waitFor(() => {
      expect(screen.getByTestId("ledger-balance")).toHaveTextContent("••••••");
    });
    expect(
      screen.getByTestId("home-financial-privacy-toggle"),
    ).toHaveAccessibleName("financialPrivacy.show");
  });
});
