import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";
import { TransactionDirection } from "@/modules/ledger/application/client";
import { JarKind } from "@/modules/plan/application/client";
import { CreateCategoryForm } from "@/app/[locale]/(product)/plan/jars/create-category-form";

const { createCategoryMock, refreshMock } = vi.hoisted(() => ({
  createCategoryMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/app/[locale]/(product)/plan/jars/actions", () => ({
  createCategoryAction: createCategoryMock,
}));

const jars = [{ id: "jar-1", name: "Essentials", kind: JarKind.SPENDING }];

function renderForm() {
  return render(
    <StatusAlertProvider>
      <CreateCategoryForm jars={jars} />
      <StatusAlertHost />
    </StatusAlertProvider>,
  );
}

function openForm() {
  fireEvent.click(screen.getByTestId("category-create-open"));
}

function selectJar(optionName: string) {
  const field = screen.getByTestId("category-jar-select");
  const trigger =
    field.querySelector("[data-slot='select-trigger']") ??
    field.querySelector("button") ??
    field;
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("option", { name: optionName }));
}

beforeEach(() => {
  vi.clearAllMocks();
  createCategoryMock.mockResolvedValue({
    status: "success",
    categoryId: "category-1",
  });
});

describe("CreateCategoryForm", () => {
  it("saves income without a jar", async () => {
    renderForm();

    openForm();
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Salary" },
    });
    fireEvent.click(screen.getByTestId("category-kind-income"));

    fireEvent.click(screen.getByTestId("category-create-submit"));

    await waitFor(() =>
      expect(createCategoryMock).toHaveBeenCalledWith({
        name: "Salary",
        kind: TransactionDirection.INCOME,
        jarId: null,
      }),
    );
  });

  it("saves an expense category without a jar", async () => {
    renderForm();

    openForm();
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Pet Grooming" },
    });
    fireEvent.click(screen.getByTestId("category-create-submit"));

    await waitFor(() =>
      expect(createCategoryMock).toHaveBeenCalledWith({
        name: "Pet Grooming",
        kind: TransactionDirection.EXPENSE,
        jarId: null,
      }),
    );
  });

  it("keeps a selected jar optional across category kinds", async () => {
    renderForm();

    openForm();
    selectJar("jars.essentials");
    fireEvent.click(screen.getByTestId("category-kind-income"));

    const field = screen.getByTestId("category-jar-select");
    expect(field.querySelector("[data-slot='select-value']")).toHaveTextContent(
      "jars.essentials",
    );
  });

  it("discards ephemeral create state when the sheet is closed and reopened", () => {
    renderForm();

    openForm();
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Draft category" },
    });
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(
      screen.queryByTestId("category-create-form"),
    ).not.toBeInTheDocument();

    openForm();
    expect(screen.getByLabelText("nameLabel")).toHaveValue("");
    expect(screen.getByTestId("category-kind-expense")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
