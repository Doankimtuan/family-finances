import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HomePeriodData,
  HomePeriodTransition,
  useHomePeriodTransition,
} from "@/app/[locale]/(product)/home/home-period-transition";
import {
  HomeDashboardPeriod,
  HOME_PERIOD_SCROLL_KEY,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { SHELL_SCROLL_REGION_SLOT } from "@/shared/patterns/shell-scroll-region";

const { replaceMock, prefetchMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  prefetchMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    prefetch: prefetchMock,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function PeriodSwitch({ children }: { children?: ReactNode }) {
  const { selectPeriod } = useHomePeriodTransition();
  return (
    <button
      type="button"
      onClick={() => selectPeriod(HomeDashboardPeriod.QUARTER, false)}
    >
      {children ?? "switch-quarter"}
    </button>
  );
}

function mountScrollRegion(scrollTop: number) {
  const region = document.createElement("div");
  region.setAttribute("data-slot", SHELL_SCROLL_REGION_SLOT);
  Object.defineProperty(region, "scrollTop", {
    configurable: true,
    writable: true,
    value: scrollTop,
  });
  document.body.append(region);
  return region;
}

describe("Home period switch scroll", () => {
  afterEach(() => {
    replaceMock.mockClear();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("replaces the period without asking Next.js to scroll to the top", () => {
    render(
      <HomePeriodTransition period={HomeDashboardPeriod.MONTH}>
        <PeriodSwitch />
      </HomePeriodTransition>,
    );

    fireEvent.click(screen.getByRole("button", { name: "switch-quarter" }));

    expect(replaceMock).toHaveBeenCalledWith(
      {
        pathname: APP_PATH.HOME,
        query: { period: HomeDashboardPeriod.QUARTER },
      },
      { scroll: false },
    );
  });

  it("stores the current shell scroll before the period read", () => {
    const region = mountScrollRegion(420);

    render(
      <HomePeriodTransition period={HomeDashboardPeriod.MONTH}>
        <PeriodSwitch />
      </HomePeriodTransition>,
    );

    fireEvent.click(screen.getByRole("button", { name: "switch-quarter" }));

    expect(window.sessionStorage.getItem(HOME_PERIOD_SCROLL_KEY)).toBe("420");
    region.remove();
  });

  it("restores preserved shell scroll when Home remounts after the period read", () => {
    const region = mountScrollRegion(0);
    window.sessionStorage.setItem(HOME_PERIOD_SCROLL_KEY, "420");
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    render(
      <HomePeriodTransition period={HomeDashboardPeriod.QUARTER}>
        <PeriodSwitch />
      </HomePeriodTransition>,
    );

    expect(region.scrollTop).toBe(420);
    expect(window.sessionStorage.getItem(HOME_PERIOD_SCROLL_KEY)).toBeNull();
    region.remove();
  });

  it("keeps the current period figures mounted while the next period loads", () => {
    render(
      <HomePeriodTransition period={HomeDashboardPeriod.MONTH}>
        <HomePeriodData>
          <p>current-metrics</p>
        </HomePeriodData>
        <PeriodSwitch />
      </HomePeriodTransition>,
    );

    fireEvent.click(screen.getByRole("button", { name: "switch-quarter" }));

    expect(screen.getByText("current-metrics")).toBeInTheDocument();
    expect(screen.getByTestId(HOME_TEST_ID.PERIOD_CONTENT)).toBeInTheDocument();
  });

  it("does not tear down This period into a skeleton while switching", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "app/[locale]/(product)/home/home-period-transition.tsx",
      ),
      "utf8",
    );

    expect(source).not.toContain("HomePeriodStorySkeleton");
    expect(source).not.toContain("AnimatePresence");
    expect(source).not.toContain("key={period}");
  });
});
