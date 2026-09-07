import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { routing } from "@/i18n/routing";
import { LocaleSwitcher } from "@/shared/patterns/locale-switcher";

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next-intl", () => ({
  useLocale: () => routing.defaultLocale,
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => APP_PATH.HOME,
  useRouter: () => ({ replace: replaceMock }),
}));

describe("LocaleSwitcher", () => {
  it("gives every locale control a 44px minimum hit target", () => {
    render(<LocaleSwitcher />);

    const group = screen.getByRole("group", { name: "a11y.localeSwitcher" });
    expect(group).toHaveClass("shrink-0");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(routing.locales.length);
    for (const button of buttons) {
      expect(button).toHaveClass("min-h-11", "min-w-11");
    }
  });

  it("keeps the current locale selected and switches the path locale", () => {
    render(<LocaleSwitcher />);

    const nextLocale = routing.locales.find(
      (code) => code !== routing.defaultLocale,
    );
    expect(nextLocale).toBeDefined();

    const currentButton = screen.getByRole("button", {
      name: new RegExp(`^${routing.defaultLocale}\\b`, "i"),
    });
    const nextButton = screen.getByRole("button", {
      name: new RegExp(`^${nextLocale}\\b`, "i"),
    });

    expect(currentButton).toHaveAttribute("aria-pressed", "true");
    expect(nextButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(nextButton);
    expect(replaceMock).toHaveBeenCalledWith(APP_PATH.HOME, {
      locale: nextLocale,
    });
  });
});
