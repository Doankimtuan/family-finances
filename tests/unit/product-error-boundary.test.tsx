import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_LOCALE } from "@/i18n/routing";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-intl/server", () => ({
  getMessages: async () => {
    const { loadMessages } = await import("@/i18n/load-messages");
    return loadMessages(APP_LOCALE.VIETNAMESE);
  },
  getTranslations: vi.fn(),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/providers/app-provider", () => ({
  AppProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/providers/locale-provider", () => ({
  LocaleProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/app/[locale]/set-html-lang", () => ({
  SetHtmlLang: () => null,
}));

import ProductError from "@/app/[locale]/(product)/error";
import LocaleLayout from "@/app/[locale]/layout";

describe("product route error boundary", () => {
  it("renders localized recovery copy from the locale provider and delegates reset", async () => {
    const reset = vi.fn();
    const layout = await LocaleLayout({
      params: Promise.resolve({ locale: APP_LOCALE.VIETNAMESE }),
      children: (
        <ProductError
          error={new Error("infrastructure detail")}
          reset={reset}
        />
      ),
    });

    render(layout);

    expect(screen.getByTestId("system-error")).toBeInTheDocument();
    expect(screen.queryByText("infrastructure detail")).not.toBeInTheDocument();
    expect(screen.getByText("Không thể hoàn tất yêu cầu")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Không thể tải nội dung này. Thử lại hoặc về trang chủ.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Thử lại")).toBeInTheDocument();
    expect(screen.getByText("Về trang chủ")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("system-error-retry"));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
