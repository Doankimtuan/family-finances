import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { SavingsCycleHistory } from "@/app/[locale]/(product)/money/savings/[id]/savings-cycle-history";
import { CycleStatus } from "@/modules/savings/application/savings-constants";
import type {
  PackageSnapshot,
  SavingCycle,
} from "@/modules/savings/application/savings-types";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";

const { motionPolicyMock } = vi.hoisted(() => ({
  motionPolicyMock: vi.fn(),
}));

vi.mock("@/shared/motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/motion")>();
  return {
    ...actual,
    useMotionPolicy: motionPolicyMock,
  };
});

const FIRST_CYCLE_ID = "00000000-0000-4000-8000-000000000001";
const SECOND_CYCLE_ID = "00000000-0000-4000-8000-000000000002";

function policyState({
  reducedMotion = false,
  lowEnd = false,
}: {
  reducedMotion?: boolean;
  lowEnd?: boolean;
} = {}) {
  return ({ essential = false } = {}) => ({
    mounted: true,
    reducedMotion,
    lowEnd,
    enabled: !reducedMotion && (essential || !lowEnd),
  });
}

function cycle(overrides: Partial<SavingCycle> = {}): SavingCycle {
  return {
    id: FIRST_CYCLE_ID,
    savingId: "00000000-0000-4000-8000-000000000010",
    cycleNumber: 1,
    startDate: "2026-01-01",
    endDate: "2026-04-01",
    principal: 10_000_000,
    lockedRate: 6,
    packageSnapshot: {
      packageName: "90-day",
      durationDays: 90,
      annualInterestRate: 6,
      settlementRules: [],
      penaltyRules: [],
      renewableAvailable: true,
      minAmount: null,
      maxAmount: null,
    } satisfies PackageSnapshot,
    accruedInterest: 0,
    settlementResult: null,
    renewalDecision: null,
    status: CycleStatus.ACTIVE,
    fundingTransactionId: null,
    settlementTransactionId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    previousCycleId: null,
    nextCycleId: null,
    ...overrides,
  };
}

function renderHistory(cycles: SavingCycle[] = [cycle()]) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <SavingsCycleHistory cycles={cycles} currency={DEFAULT_CURRENCY} />
    </NextIntlClientProvider>,
  );
}

function toggleFor(cycleId: string) {
  return within(screen.getByTestId(`savings-cycle-row-${cycleId}`)).getByRole(
    "button",
  );
}

describe("Savings cycle history motion policy", () => {
  beforeEach(() => {
    motionPolicyMock.mockImplementation(policyState());
  });

  it("expands and collapses with motion when the policy allows it", async () => {
    renderHistory();

    const toggle = toggleFor(FIRST_CYCLE_ID);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId(`savings-cycle-details-${FIRST_CYCLE_ID}`),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const details = screen.getByTestId(
      `savings-cycle-details-${FIRST_CYCLE_ID}`,
    );
    expect(details).toHaveAttribute("data-motion-enabled", "true");
    expect(within(details).getByText("Cycle snapshot")).toBeInTheDocument();
    expect(within(details).getByText("90-day")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(
        screen.queryByTestId(`savings-cycle-details-${FIRST_CYCLE_ID}`),
      ).not.toBeInTheDocument();
    });
  });

  it("expands and collapses without movement when reduced motion is preferred", () => {
    motionPolicyMock.mockImplementation(policyState({ reducedMotion: true }));
    renderHistory();

    const toggle = toggleFor(FIRST_CYCLE_ID);
    fireEvent.click(toggle);

    const details = screen.getByTestId(
      `savings-cycle-details-${FIRST_CYCLE_ID}`,
    );
    expect(details).toHaveAttribute("data-motion-enabled", "false");
    expect(within(details).getByText("Cycle snapshot")).toBeVisible();
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId(`savings-cycle-details-${FIRST_CYCLE_ID}`),
    ).not.toBeInTheDocument();
  });

  it("expands and collapses without movement when the low-end policy disables motion", () => {
    motionPolicyMock.mockImplementation(policyState({ lowEnd: true }));
    renderHistory();

    const toggle = toggleFor(FIRST_CYCLE_ID);
    fireEvent.click(toggle);

    const details = screen.getByTestId(
      `savings-cycle-details-${FIRST_CYCLE_ID}`,
    );
    expect(details).toHaveAttribute("data-motion-enabled", "false");
    expect(within(details).getByText("Cycle snapshot")).toBeVisible();
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId(`savings-cycle-details-${FIRST_CYCLE_ID}`),
    ).not.toBeInTheDocument();
  });

  it("keeps expanded state as the only interaction source of truth", async () => {
    renderHistory([
      cycle(),
      cycle({
        id: SECOND_CYCLE_ID,
        cycleNumber: 2,
        packageSnapshot: {
          packageName: "180-day",
          durationDays: 180,
          annualInterestRate: 7,
          settlementRules: [],
          penaltyRules: [],
          renewableAvailable: true,
          minAmount: null,
          maxAmount: null,
        },
      }),
    ]);

    fireEvent.click(toggleFor(FIRST_CYCLE_ID));
    expect(toggleFor(FIRST_CYCLE_ID)).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByTestId(`savings-cycle-details-${FIRST_CYCLE_ID}`),
    ).toBeInTheDocument();

    fireEvent.click(toggleFor(SECOND_CYCLE_ID));

    expect(toggleFor(FIRST_CYCLE_ID)).toHaveAttribute("aria-expanded", "false");
    expect(toggleFor(SECOND_CYCLE_ID)).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => {
      expect(
        screen.queryByTestId(`savings-cycle-details-${FIRST_CYCLE_ID}`),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByTestId(`savings-cycle-details-${SECOND_CYCLE_ID}`),
    ).toBeInTheDocument();
  });
});
