import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  JarConfigurationForm,
  jarConfigurationPayload,
} from "@/app/[locale]/(product)/plan/jars/jar-configuration-form";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";
import {
  JarKind,
  JarPlanKind,
  JarRolloverMode,
} from "@/modules/plan/application/client";
import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";

const { createJarMock, updateJarMock, refreshMock, savedMock } = vi.hoisted(
  () => ({
    createJarMock: vi.fn(),
    updateJarMock: vi.fn(),
    refreshMock: vi.fn(),
    savedMock: vi.fn(),
  }),
);

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, replace: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/app/[locale]/(product)/plan/jars/actions", () => ({
  createJarAction: createJarMock,
  updateJarConfigurationAction: updateJarMock,
}));

const OWNED_CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const FOREIGN_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";
const INCOME_CATEGORY_ID = "33333333-3333-4333-8333-333333333333";
const TARGET_JAR_ID = "44444444-4444-4444-8444-444444444444";
const JAR_ID = "jar-1";

const categories = [
  {
    id: OWNED_CATEGORY_ID,
    name: "Groceries",
    kind: TransactionDirection.EXPENSE,
    jarId: JAR_ID,
  },
  {
    id: FOREIGN_CATEGORY_ID,
    name: "Cafe",
    kind: TransactionDirection.EXPENSE,
    jarId: "jar-2",
  },
  {
    id: INCOME_CATEGORY_ID,
    name: "Salary",
    kind: TransactionDirection.INCOME,
    jarId: "jar-3",
  },
];

const baseProps = {
  categories,
  availableJars: [{ id: TARGET_JAR_ID, name: "Buffer" }],
  currency: "VND",
  qualifyingIncome: 10_000_000,
};

function fillValidFixedForm() {
  fireEvent.change(screen.getByLabelText("createNameLabel"), {
    target: { value: "  Essentials  " },
  });
  fireEvent.change(screen.getByLabelText("fixedLabel"), {
    target: { value: "5000000" },
  });
}

function renderJarForm(ui: ReactNode) {
  return render(
    <StatusAlertProvider>
      {ui}
      <StatusAlertHost />
    </StatusAlertProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JarConfigurationForm create flow", () => {
  it("blocks an empty submit with per-field errors and no server call", async () => {
    renderJarForm(
      <JarConfigurationForm {...baseProps} mode="create" onSaved={savedMock} />,
    );

    fireEvent.click(screen.getByTestId("jar-create-submit"));

    expect(await screen.findByText("errors.name_invalid")).toBeInTheDocument();
    expect(screen.getByText("errors.fixed_invalid")).toBeInTheDocument();
    expect(createJarMock).not.toHaveBeenCalled();
  });

  it("submits a valid fixed allocation with a numeric amount and trimmed name", async () => {
    createJarMock.mockResolvedValue({ status: "success", jarId: "jar-new" });
    renderJarForm(
      <JarConfigurationForm {...baseProps} mode="create" onSaved={savedMock} />,
    );

    fillValidFixedForm();
    fireEvent.click(screen.getByTestId("jar-create-submit"));

    await waitFor(() => expect(createJarMock).toHaveBeenCalledTimes(1));
    expect(createJarMock).toHaveBeenCalledWith({
      name: "Essentials",
      kind: JarKind.SPENDING,
      enabled: true,
      planKind: JarPlanKind.FIXED,
      fixedAmount: 5_000_000,
      rolloverMode: JarRolloverMode.RESET,
      categoryIds: [],
      confirmReassignCategoryIds: [],
    });
  });

  it("submits a valid decimal percent allocation", async () => {
    createJarMock.mockResolvedValue({ status: "success", jarId: "jar-new" });
    renderJarForm(
      <JarConfigurationForm {...baseProps} mode="create" onSaved={savedMock} />,
    );

    fireEvent.click(screen.getByTestId("jar-create-plan-percent"));
    fireEvent.change(screen.getByLabelText("percentLabel"), {
      target: { value: "7.5" },
    });
    fireEvent.change(screen.getByLabelText("createNameLabel"), {
      target: { value: "Essentials" },
    });
    fireEvent.click(screen.getByTestId("jar-create-submit"));

    await waitFor(() => expect(createJarMock).toHaveBeenCalledTimes(1));
    expect(createJarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        planKind: JarPlanKind.PERCENT,
        percent: 7.5,
      }),
    );
    const payload = createJarMock.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("fixedAmount");
  });

  it("enforces the percent boundaries at the field before any server call", async () => {
    renderJarForm(
      <JarConfigurationForm {...baseProps} mode="create" onSaved={savedMock} />,
    );

    fireEvent.click(screen.getByTestId("jar-create-plan-percent"));
    fireEvent.change(screen.getByLabelText("createNameLabel"), {
      target: { value: "Essentials" },
    });
    const percentInput = screen.getByLabelText("percentLabel");

    fireEvent.change(percentInput, { target: { value: "0" } });
    fireEvent.click(screen.getByTestId("jar-create-submit"));
    expect(
      await screen.findByText("errors.percent_invalid"),
    ).toBeInTheDocument();

    fireEvent.change(percentInput, { target: { value: "100.1" } });
    fireEvent.click(screen.getByTestId("jar-create-submit"));
    expect(createJarMock).not.toHaveBeenCalled();

    fireEvent.change(percentInput, { target: { value: "100" } });
    fireEvent.click(screen.getByTestId("jar-create-submit"));

    await waitFor(() => expect(createJarMock).toHaveBeenCalledTimes(1));
    expect(createJarMock).toHaveBeenCalledWith(
      expect.objectContaining({ percent: 100 }),
    );
  });

  it("resets to canonical defaults after a successful create", async () => {
    createJarMock.mockResolvedValue({ status: "success", jarId: "jar-new" });
    renderJarForm(
      <JarConfigurationForm {...baseProps} mode="create" onSaved={savedMock} />,
    );

    fillValidFixedForm();
    fireEvent.click(screen.getByTestId("jar-create-submit"));

    await waitFor(() => expect(savedMock).toHaveBeenCalledTimes(1));
    expect(
      (screen.getByLabelText("createNameLabel") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("fixedLabel") as HTMLInputElement).value,
    ).toBe("");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("requires explicit confirmation before reassigning foreign categories", async () => {
    createJarMock.mockResolvedValue({ status: "success", jarId: "jar-new" });
    renderJarForm(
      <JarConfigurationForm {...baseProps} mode="create" onSaved={savedMock} />,
    );

    fillValidFixedForm();
    fireEvent.click(screen.getByLabelText(/Cafe/));
    fireEvent.click(screen.getByTestId("jar-create-submit"));

    expect(await screen.findByText("errors.invalid")).toBeInTheDocument();
    expect(createJarMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(/confirmReassignment/));
    fireEvent.click(screen.getByTestId("jar-create-submit"));

    await waitFor(() => expect(createJarMock).toHaveBeenCalledTimes(1));
    expect(createJarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryIds: [FOREIGN_CATEGORY_ID],
        confirmReassignCategoryIds: [FOREIGN_CATEGORY_ID],
      }),
    );
  });
});

describe("JarConfigurationForm edit flow", () => {
  const editProps = {
    ...baseProps,
    mode: "edit" as const,
    jarId: JAR_ID,
    initialName: "Groceries Jar",
    initialKind: JarKind.SPENDING,
    initialEnabled: true,
    initialRolloverMode: JarRolloverMode.RESET,
  };

  it("initializes from server-provided values (percent plan)", () => {
    renderJarForm(
      <JarConfigurationForm
        {...editProps}
        initialPlan={{
          kind: JarPlanKind.PERCENT,
          percentBps: 5_000,
          fixedAmount: 0,
        }}
      />,
    );

    expect(
      (screen.getByLabelText("percentLabel") as HTMLInputElement).value,
    ).toBe("50");
    expect(screen.getByTestId("jar-edit-plan-percent")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText(/Groceries/)).toBeChecked();
    expect(screen.getByLabelText(/Cafe/)).not.toBeChecked();
  });

  it("initializes a fixed plan with the persisted amount", () => {
    renderJarForm(
      <JarConfigurationForm
        {...editProps}
        initialPlan={{
          kind: JarPlanKind.FIXED,
          percentBps: 0,
          fixedAmount: 15_000_000,
        }}
      />,
    );

    expect(
      (screen.getByLabelText("fixedLabel") as HTMLInputElement).value,
    ).toBe("15,000,000");
  });

  it("blocks removal of categories without a destination jar", async () => {
    updateJarMock.mockResolvedValue({ status: "success", jarId: JAR_ID });
    renderJarForm(
      <JarConfigurationForm
        {...editProps}
        initialPlan={{
          kind: JarPlanKind.FIXED,
          percentBps: 0,
          fixedAmount: 15_000_000,
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Groceries/));
    expect(screen.getByText("removedCategoriesHeading")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("jar-plan-edit"));

    expect(await screen.findByText("errors.invalid")).toBeInTheDocument();
    expect(updateJarMock).not.toHaveBeenCalled();
  });
});

describe("jarConfigurationPayload", () => {
  const fixedValues = {
    name: "Essentials",
    kind: JarKind.SPENDING,
    enabled: true,
    planKind: JarPlanKind.FIXED,
    fixedAmount: 5_000_000,
    rolloverMode: JarRolloverMode.RESET,
    categoryIds: [OWNED_CATEGORY_ID],
    confirmReassignCategoryIds: [],
    confirmReassignment: false,
  };

  it("sends only the allocation branch matching the plan kind", () => {
    const fixedPayload = jarConfigurationPayload(fixedValues, {
      confirmReassignCategoryIds: [],
      includeRemovedTarget: false,
    });
    expect(fixedPayload).not.toHaveProperty("percent");
    expect(fixedPayload.fixedAmount).toBe(5_000_000);

    const percentPayload = jarConfigurationPayload(
      { ...fixedValues, planKind: JarPlanKind.PERCENT, percent: 12.5 },
      { confirmReassignCategoryIds: [], includeRemovedTarget: false },
    );
    expect(percentPayload).not.toHaveProperty("fixedAmount");
    expect(percentPayload.percent).toBe(12.5);
  });

  it("includes the removed-category target only for actual removals", () => {
    const values = {
      ...fixedValues,
      removedCategoryTargetJarId: TARGET_JAR_ID,
    };

    const withoutRemoval = jarConfigurationPayload(values, {
      confirmReassignCategoryIds: [],
      includeRemovedTarget: false,
    });
    expect(withoutRemoval).not.toHaveProperty("removedCategoryTargetJarId");

    const withRemoval = jarConfigurationPayload(values, {
      confirmReassignCategoryIds: [FOREIGN_CATEGORY_ID],
      includeRemovedTarget: true,
    });
    expect(withRemoval.removedCategoryTargetJarId).toBe(TARGET_JAR_ID);
    expect(withRemoval.confirmReassignCategoryIds).toEqual([
      FOREIGN_CATEGORY_ID,
    ]);
  });
});
