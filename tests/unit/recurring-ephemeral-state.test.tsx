import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateRecurringForm } from "@/app/[locale]/(product)/plan/recurring/create-recurring-form";

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

vi.mock("@/providers/status-alert-provider", () => ({
  useStatusAlert: () => ({ show: vi.fn(), hide: vi.fn() }),
}));

vi.mock("@/app/[locale]/(product)/plan/recurring/actions", () => ({
  createRecurringAction: vi.fn(),
}));

describe("CreateRecurringForm ephemeral state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function openForm() {
    fireEvent.click(screen.getByTestId("recurring-create-open"));
  }

  it("discards temporary create values when the sheet closes and reopens", () => {
    render(<CreateRecurringForm />);

    openForm();
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Draft rent" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "direction.income" }));
    fireEvent.click(screen.getByRole("radio", { name: "frequency.weekly" }));
    fireEvent.click(screen.getByRole("button", { name: "createCancel" }));

    expect(
      screen.queryByTestId("recurring-create-form"),
    ).not.toBeInTheDocument();

    openForm();
    expect(screen.getByLabelText("nameLabel")).toHaveValue("");
    expect(
      screen.getByRole("radio", { name: "direction.expense" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: "frequency.monthly" }),
    ).toHaveAttribute("aria-checked", "true");
  });
});
