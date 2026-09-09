import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";
import {
  BottomActionBar,
  BottomActionBarLayout,
} from "@/shared/patterns/bottom-action-bar";
import {
  FloatingAction,
  FloatingActionButton,
} from "@/shared/patterns/floating-action";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialDeltaValue } from "@/shared/patterns/financial-delta";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => APP_PATH.HOME,
  Link: ({
    href,
    children,
    prefetch: _prefetch,
    ...props
  }: {
    href: string;
    children: ReactNode;
    prefetch?: boolean;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Phase 2 app-shell foundation", () => {
  it("marks the Home tab current and keeps 44px targets on all five tabs", () => {
    render(<BottomNavigation />);

    const nav = screen.getByRole("navigation", { name: "a11y.primaryNav" });
    expect(nav).toHaveAttribute("data-slot", "bottom-navigation");
    expect(nav).not.toHaveClass("min-[481px]:rounded-[var(--radius-overlay)]");

    const tabs = screen.getAllByRole("link");
    expect(tabs).toHaveLength(5);
    for (const tab of tabs) {
      expect(tab).toHaveClass("min-h-14");
    }

    const homeTab = screen.getByRole("link", { name: /navigation.home/ });
    expect(homeTab).toHaveAttribute("aria-current", "page");
    expect(homeTab).toHaveAttribute("data-active", "true");
    expect(homeTab).toHaveClass("bg-primary-soft", "text-primary");
  });

  it("keeps TopAppBar variants compact and exposes a single trailing slot", () => {
    const { rerender } = render(
      <TopAppBar variant={TopAppBarVariant.PRIMARY} title="Money" />,
    );
    expect(screen.getByRole("banner")).toHaveAttribute(
      "data-slot",
      "top-app-bar",
    );
    expect(screen.getByRole("banner")).toHaveAttribute(
      "data-header-variant",
      TopAppBarVariant.PRIMARY,
    );

    rerender(
      <TopAppBar
        variant={TopAppBarVariant.DETAIL}
        title="Cash account"
        backHref={APP_PATH.MONEY}
        trailing={<button type="button">Edit</button>}
      />,
    );
    expect(screen.getByRole("link", { name: "a11y.back" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
    expect(
      screen.getByRole("button", { name: "Edit" }).parentElement,
    ).toHaveAttribute("data-slot", "header-trailing");
  });

  it("keeps the FAB pill thumb-reachable and pointer-transparent around the control", () => {
    render(
      <FloatingAction>
        <FloatingActionButton>Add transaction</FloatingActionButton>
      </FloatingAction>,
    );

    expect(document.querySelector('[data-slot="floating-action"]')).toHaveClass(
      "pointer-events-none",
    );
    const button = screen.getByRole("button", { name: "Add transaction" });
    expect(button).toHaveClass(
      "rounded-full",
      "min-h-(--floating-action-size)",
    );
    expect(button).toHaveClass("pointer-events-auto");
  });

  it("keeps BottomActionBar on the page gutter and one primary cluster", () => {
    render(
      <BottomActionBar layout={BottomActionBarLayout.STACKED}>
        <button type="button">Save</button>
      </BottomActionBar>,
    );
    expect(
      document.querySelector('[data-slot="bottom-action-bar"]'),
    ).toBeInTheDocument();

    const source = readProjectFile("shared/patterns/bottom-action-bar.tsx");
    expect(source).toContain("-mx-(--page-gutter)");
    expect(source).toContain("px-(--page-gutter)");
    expect(source).toContain("pb-(--space-4)");
    expect(source).toContain("mb-(--space-3)");
    expect(source).not.toContain("-mx-(--space-4)");
  });

  it("keeps sheet physics on overlay radius, 90dvh, and sticky footer clearance", () => {
    const sheet = readProjectFile("shared/patterns/sheet.tsx");
    const footer = readProjectFile("shared/patterns/action-sheet-layout.tsx");
    expect(sheet).toContain("max-h-[min(90dvh,720px)]");
    expect(sheet).toContain("rounded-t-(--radius-overlay)");
    expect(footer).toContain(
      "pb-[calc(var(--sheet-footer-space)+env(safe-area-inset-bottom,0px))]",
    );
  });

  it("labels financial number kinds without changing calculations", () => {
    render(<FinancialDeltaValue>+₫10,000</FinancialDeltaValue>);
    const amount = screen
      .getByText("+₫10,000")
      .closest("[data-financial-kind]");
    expect(amount).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.MOVEMENT,
    );
    expect(FinancialNumberKind.CURRENT_STATE).toBe("current-state");
    expect(FinancialNumberKind.ESTIMATE).toBe("estimate");
  });

  it("exposes Card tone as data, not nested card chrome", () => {
    render(<Card tone="elevated">Grouped facts</Card>);
    expect(
      screen.getByText("Grouped facts").closest("[data-tone]"),
    ).toHaveAttribute("data-tone", "elevated");
  });

  it("uses the attached FAB gap token after dropping the floating nav margin", () => {
    const tokens = readProjectFile("styles/globals.css");
    expect(tokens).toContain("--floating-action-gap: var(--space-4);");
    expect(tokens).toContain("--app-viewport-max: 440px;");
    expect(tokens).toContain("--radius-control: 10px;");
    expect(tokens).toContain("--radius-card: 12px;");
    expect(tokens).toContain("--radius-overlay: 16px;");
  });
});
