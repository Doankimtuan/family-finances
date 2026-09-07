import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  RecurringDirection,
  RecurringFrequency,
} from "@/modules/plan/application/plan-constants";
import { RecurringDetailForm } from "@/app/[locale]/(product)/plan/recurring/[id]/recurring-detail-form";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));
vi.mock("@/app/[locale]/(product)/plan/recurring/actions", () => ({
  updateRecurringAction: vi.fn(),
  deleteRecurringAction: vi.fn(),
}));

describe("RecurringDetailForm", () => {
  it("edits schedule dates with shared date pickers and a shared checkbox", () => {
    render(
      <RecurringDetailForm
        ruleId="rule-1"
        name="Rent"
        direction={RecurringDirection.EXPENSE}
        amount={12_000_000}
        frequency={RecurringFrequency.MONTHLY}
        dayOfMonth={1}
        dayOfWeek={null}
        startDate="2026-09-01"
        nextRunDate="2026-10-01"
        isActive
      />,
    );

    const form = screen.getByTestId("recurring-detail-form");
    expect(
      form.querySelectorAll("[data-slot='date-picker-trigger']"),
    ).toHaveLength(2);
    expect(screen.getByLabelText("startDateLabel").tagName).not.toBe("INPUT");
    expect(screen.getByLabelText("nextRunLabel").tagName).not.toBe("INPUT");
    expect(screen.getByLabelText("activeLabel")).toHaveAttribute(
      "type",
      "checkbox",
    );
  });
});
