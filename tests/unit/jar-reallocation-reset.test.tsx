import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { ReallocateJarForm } from "@/app/[locale]/(product)/plan/jars/reallocate-jar-form";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { OverspendPolicy } from "@/modules/tenancy/application/household-policies.schema";
import { APP_LOCALE } from "@/i18n/routing";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";
import plan from "@/messages/en/plan.json";
import catalog from "@/messages/en/catalog.json";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));
vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));
vi.mock("@/app/[locale]/(product)/plan/jars/actions", () => ({
  reallocateJarCapacityAction: vi.fn(),
}));

describe("Jar reallocation ephemeral state", () => {
  it("discards unsaved amount when closed and reopened", async () => {
    render(
      <NextIntlClientProvider
        locale={APP_LOCALE.ENGLISH}
        messages={{ plan, catalog }}
      >
        <FinancialPrivacyProvider>
          <ReallocateJarForm
            sourceJarId="11111111-1111-4111-8111-111111111111"
            sourceJarName="Household"
            availableToMove={1000}
            currency={DEFAULT_CURRENCY}
            targetJars={[
              { id: "22222222-2222-4222-8222-222222222222", name: "Savings" },
            ]}
            overspendPolicy={OverspendPolicy.WARN}
          />
        </FinancialPrivacyProvider>
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByTestId("jar-reallocate-open"));
    const amount = await screen.findByLabelText(
      plan.jars.reallocate.amountLabel,
    );
    fireEvent.change(amount, { target: { value: "500" } });
    expect(amount).toHaveValue("500");
    expect(screen.getByTestId("jar-reallocate-preview")).toHaveTextContent(
      "Household → Savings",
    );
    expect(screen.getByTestId("jar-reallocate-preview")).toHaveTextContent(
      plan.jars.reallocate.receiptMoneyUnchanged,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: plan.jars.reallocate.cancel,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("jar-reallocate-form"),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("jar-reallocate-open"));
    expect(
      await screen.findByLabelText(plan.jars.reallocate.amountLabel),
    ).toHaveValue("");
    expect(
      screen.queryByTestId("jar-reallocate-preview"),
    ).not.toBeInTheDocument();
  });
});
