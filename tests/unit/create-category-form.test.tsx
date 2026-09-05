import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";
import { TransactionDirection } from "@/modules/ledger/application/client";
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

const jars = [{ id: "jar-1", name: "Essentials", kind: "spending" }];

function renderForm() {
  return render(
    <StatusAlertProvider>
      <CreateCategoryForm jars={jars} />
      <StatusAlertHost />
    </StatusAlertProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  createCategoryMock.mockResolvedValue({
    status: "success",
    categoryId: "category-1",
  });
});

describe("CreateCategoryForm", () => {
  it("hides the jar field and saves income without a jar", async () => {
    renderForm();

    fireEvent.click(screen.getByTestId("category-create-open"));
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Salary" },
    });
    fireEvent.change(screen.getByLabelText("kindLabel"), {
      target: { value: TransactionDirection.INCOME },
    });

    expect(screen.queryByTestId("category-jar-select")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("category-create-submit"));

    await waitFor(() =>
      expect(createCategoryMock).toHaveBeenCalledWith({
        name: "Salary",
        kind: TransactionDirection.INCOME,
        jarId: null,
      }),
    );
  });

  it("keeps the jar required for expense categories", async () => {
    renderForm();

    fireEvent.click(screen.getByTestId("category-create-open"));
    fireEvent.change(screen.getByLabelText("nameLabel"), {
      target: { value: "Pet Grooming" },
    });
    fireEvent.click(screen.getByTestId("category-create-submit"));

    expect(
      await screen.findByText("errors.category_unmapped"),
    ).toBeInTheDocument();
    expect(createCategoryMock).not.toHaveBeenCalled();
  });

  it("clears a selected jar before switching to income", () => {
    renderForm();

    fireEvent.click(screen.getByTestId("category-create-open"));
    fireEvent.change(screen.getByTestId("category-jar-select"), {
      target: { value: "jar-1" },
    });
    fireEvent.change(screen.getByLabelText("kindLabel"), {
      target: { value: TransactionDirection.INCOME },
    });
    fireEvent.change(screen.getByLabelText("kindLabel"), {
      target: { value: TransactionDirection.EXPENSE },
    });

    expect(screen.getByTestId("category-jar-select")).toHaveValue("");
  });
});
