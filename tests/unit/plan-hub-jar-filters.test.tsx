import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JarBudgetState } from "@/modules/plan/application/plan-constants";
import { PlanJarFilterList } from "@/app/[locale]/(product)/plan/plan-jar-filter-list";

describe("Plan overview jar filters", () => {
  it("filters live jar rows by over-budget and remaining state", () => {
    render(
      <PlanJarFilterList
        labels={{
          group: "Filter jars",
          all: "All",
          overspent: "Over",
          remaining: "Remaining",
          empty: "No jars match.",
          sort: "Sort",
          sortByName: "Sort alphabetically",
          restoreSort: "Restore saved order",
        }}
        locale="en"
        title="3 budget jars"
        items={[
          {
            id: "jar-a",
            sortName: "Groceries",
            budgetState: JarBudgetState.HEALTHY,
            hasRemaining: true,
            content: <span>Groceries</span>,
          },
          {
            id: "jar-b",
            sortName: "Shopping",
            budgetState: JarBudgetState.OVERSPENT,
            hasRemaining: false,
            content: <span>Shopping</span>,
          },
          {
            id: "jar-c",
            sortName: "Rent",
            budgetState: JarBudgetState.HEALTHY,
            hasRemaining: false,
            content: <span>Rent</span>,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("plan-jar-filter-all")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByTestId(/plan-jar-list/)).toHaveLength(1);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Shopping")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("plan-jar-filter-overspent"));
    expect(screen.getByTestId("plan-jar-filter-overspent")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Shopping")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("plan-jar-filter-remaining"));
    expect(screen.getByTestId("plan-jar-filter-remaining")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.queryByText("Shopping")).not.toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("sorts the preview by localized name and restores its supplied order", () => {
    render(
      <PlanJarFilterList
        labels={{
          group: "Filter jars",
          all: "All",
          overspent: "Over",
          remaining: "Remaining",
          empty: "No jars match.",
          sort: "Sort",
          sortByName: "Sort alphabetically",
          restoreSort: "Restore saved order",
        }}
        locale="en"
        title="3 budget jars"
        items={[
          {
            id: "jar-b",
            sortName: "Shopping",
            hasRemaining: false,
            content: <span>Shopping</span>,
          },
          {
            id: "jar-a",
            sortName: "Groceries",
            hasRemaining: true,
            content: <span>Groceries</span>,
          },
          {
            id: "jar-c",
            sortName: "Rent",
            hasRemaining: true,
            content: <span>Rent</span>,
          },
        ]}
      />,
    );

    const list = screen.getByTestId("plan-jar-list");
    const readOrder = () =>
      Array.from(list.querySelectorAll("li"), (item) => item.textContent);

    expect(readOrder()).toEqual(["Shopping", "Groceries", "Rent"]);
    fireEvent.click(screen.getByTestId("plan-jar-sort"));
    expect(readOrder()).toEqual(["Groceries", "Rent", "Shopping"]);
    fireEvent.click(screen.getByTestId("plan-jar-sort"));
    expect(readOrder()).toEqual(["Shopping", "Groceries", "Rent"]);
  });
});
