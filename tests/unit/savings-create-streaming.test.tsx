import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/shared/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/motion")>()),
  MotionStep: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MotionStepDirection: { FORWARD: "forward", BACKWARD: "backward" },
}));
vi.mock("@/app/[locale]/(product)/money/savings/savings-actions", () => ({
  createSavingAction: vi.fn(),
}));

import { CreateSavingWizard } from "@/app/[locale]/(product)/money/savings/new/create-saving-wizard";

type Data = Awaited<Parameters<typeof CreateSavingWizard>[0]["data"]>;
const data: Data = {
  accounts: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Cash",
      type: "cash",
      balance: 2_000_000,
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Checking",
      type: "checking",
      balance: 0,
    },
  ],
  providers: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      displayName: "Manual Saving",
      savingType: "manual_saving",
    },
  ],
  packagesByProvider: {
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc": [
      {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        packageName: "90 days",
        durationDays: 90,
        annualInterestRate: 6,
        minAmount: null,
        maxAmount: null,
      },
    ],
  },
};
async function setup() {
  let resolve!: (data: Data) => void;
  const promise = new Promise<Data>((done) => {
    resolve = done;
  });
  await act(async () => {
    render(
      <CreateSavingWizard
        data={promise}
        unavailable={{
          title: "No accounts",
          description: "Create one first",
          actionHref: "/money/accounts",
          actionLabel: "Create account",
        }}
      />,
    );
  });
  return resolve;
}

describe("Create server-data streaming", () => {
  it("keeps the mounted name, mode and scope while server options arrive", async () => {
    const resolve = await setup();
    const name = screen.getByLabelText(/savingNameLabel/);
    expect(screen.getByTestId("savings-create-data-loading")).toBeTruthy();
    expect(screen.getByTestId("savings-wizard-next")).toBeDisabled();
    await act(async () => {
      fireEvent.change(name, { target: { value: "My early name" } });
      fireEvent.click(screen.getByTestId("savings-create-mode-historical"));
      fireEvent.click(screen.getByRole("radio", { name: "personal" }));
    });
    await act(async () => resolve(data));
    await waitFor(() =>
      expect(screen.getByTestId("savings-create-wizard")).toHaveAttribute(
        "data-ready",
        "true",
      ),
    );
    expect(screen.getByLabelText(/savingNameLabel/)).toBe(name);
    expect(name).toHaveValue("My early name");
    expect(
      screen.getByTestId("savings-create-mode-historical"),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "personal" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.queryByTestId("savings-create-data-loading")).toBeNull();
    expect(screen.queryByLabelText(/sourceSection/)).toBeNull();
    expect(screen.getByTestId("savings-wizard-next")).toBeDisabled();
  });
  it("seeds the existing live defaults and valid account choices after streaming", async () => {
    const resolve = await setup();
    await act(async () => resolve(data));
    await waitFor(() =>
      expect(screen.getByTestId("savings-create-wizard")).toHaveAttribute(
        "data-ready",
        "true",
      ),
    );
    expect(screen.getByLabelText(/savingNameLabel/)).toHaveValue(
      "Manual Saving",
    );
    expect(screen.getByTestId("savings-create-mode-live")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText(/sourceSection/)).toBeTruthy();
    expect(screen.getByLabelText(/payoutAccountLabel/)).toBeTruthy();
  });
  it("shows the existing account recovery and cannot proceed when eligibility is empty", async () => {
    const resolve = await setup();
    await act(async () => resolve({ ...data, accounts: [] }));
    await waitFor(() => expect(screen.getByText("No accounts")).toBeTruthy());
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/money/accounts");
    expect(screen.queryByTestId("savings-wizard-next")).toBeNull();
    expect(screen.queryByTestId("savings-wizard-confirm")).toBeNull();
  });
});
