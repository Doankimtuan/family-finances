import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import ProductError from "@/app/[locale]/(product)/error";

describe("product route error boundary", () => {
  it("renders a safe retry state and delegates reset", () => {
    const reset = vi.fn();

    render(
      <ProductError error={new Error("infrastructure detail")} reset={reset} />,
    );

    expect(screen.getByTestId("system-error")).toBeInTheDocument();
    expect(screen.queryByText("infrastructure detail")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("system-error-retry"));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
