import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const navigationState = vi.hoisted(() => ({
  pathname: "",
  linkPending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => navigationState.pathname,
  Link: ({
    href,
    children,
    prefetch,
    onClick,
    ...props
  }: {
    href: string;
    children: ReactNode;
    prefetch?: boolean;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    void prefetch;
    return (
      <a
        href={href}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          event.preventDefault();
        }}
      >
        {children}
      </a>
    );
  },
}));

vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: navigationState.linkPending }),
}));

vi.mock("@/shared/motion", () => ({
  useMotionPolicy: () => ({ enabled: false }),
  motionTokens: { scale: { pop: 1.02 } },
  springs: { snappy: {} },
}));

beforeEach(() => {
  navigationState.pathname = APP_PATH.HOME;
  navigationState.linkPending = false;
});

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
    expect(homeTab).toHaveClass("text-primary");
    expect(
      homeTab.querySelector('[data-slot="nav-tab-active-indicator"]'),
    ).toHaveClass("bg-primary-soft");
  });

  it("selects the destination optimistically without changing current-page semantics", () => {
    render(<BottomNavigation />);
    const homeTab = screen.getByRole("link", { name: /navigation.home/ });
    const moneyTab = screen.getByRole("link", { name: /navigation.money/ });

    fireEvent.click(moneyTab);

    expect(moneyTab).toHaveAttribute("data-active", "true");
    expect(moneyTab).not.toHaveAttribute("aria-current");
    expect(homeTab).toHaveAttribute("data-active", "false");
    expect(homeTab).toHaveAttribute("aria-current", "page");
  });

  it("lets only the newest normal navigation remain optimistic", () => {
    render(<BottomNavigation />);
    const moneyTab = screen.getByRole("link", { name: /navigation.money/ });
    const planTab = screen.getByRole("link", { name: /navigation.plan/ });

    fireEvent.click(moneyTab);
    fireEvent.click(planTab);

    expect(planTab).toHaveAttribute("data-active", "true");
    expect(moneyTab).toHaveAttribute("data-active", "false");
  });

  it("reconciles to the committed pathname and clears pending state", () => {
    const { rerender } = render(<BottomNavigation />);
    fireEvent.click(screen.getByRole("link", { name: /navigation.money/ }));
    navigationState.pathname = APP_PATH.MONEY;

    rerender(<BottomNavigation />);

    const moneyTab = screen.getByRole("link", { name: /navigation.money/ });
    expect(moneyTab).toHaveAttribute("aria-current", "page");
    expect(moneyTab).toHaveAttribute("data-active", "true");
  });

  it("preserves keyboard focus when the committed pathname changes", () => {
    const { rerender } = render(<BottomNavigation />);
    const moneyTab = screen.getByRole("link", { name: /navigation.money/ });
    moneyTab.focus();

    navigationState.pathname = APP_PATH.MONEY;
    rerender(<BottomNavigation />);

    expect(screen.getByRole("link", { name: /navigation.money/ })).toBe(
      moneyTab,
    );
    expect(document.activeElement).toBe(moneyTab);
    expect(moneyTab).toHaveAttribute("aria-current", "page");
  });

  it("clears optimistic selection on browser history navigation", () => {
    render(<BottomNavigation />);
    fireEvent.click(screen.getByRole("link", { name: /navigation.money/ }));
    fireEvent.popState(window);

    expect(
      screen.getByRole("link", { name: /navigation.home/ }),
    ).toHaveAttribute("data-active", "true");
  });

  it("reverts optimistic selection when a link settles without changing route", async () => {
    const { rerender } = render(<BottomNavigation />);
    navigationState.linkPending = true;
    rerender(<BottomNavigation />);
    const moneyTab = screen.getByRole("link", { name: /navigation.money/ });
    fireEvent.click(moneyTab);
    expect(moneyTab).toHaveAttribute("data-active", "true");

    navigationState.linkPending = false;
    rerender(<BottomNavigation />);

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /navigation.home/ }),
      ).toHaveAttribute("data-active", "true"),
    );
  });

  it("preserves modified-link behavior and ignores the current tab", () => {
    render(<BottomNavigation />);
    const homeTab = screen.getByRole("link", { name: /navigation.home/ });
    const moneyTab = screen.getByRole("link", { name: /navigation.money/ });

    fireEvent.click(moneyTab, { ctrlKey: true });
    expect(homeTab).toHaveAttribute("data-active", "true");

    expect(fireEvent.click(homeTab)).toBe(false);
    expect(homeTab).toHaveAttribute("data-active", "true");
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
    expect(source).toContain("mt-(--space-2)");
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
