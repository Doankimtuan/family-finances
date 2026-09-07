import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FinancialDeltaDirection,
  FinancialDeltaValue,
} from "@/shared/patterns/financial-delta";

describe("FinancialDeltaValue", () => {
  it("renders a signed amount when direction is missing from the RSC boundary", () => {
    expect(() =>
      render(<FinancialDeltaValue>+₫4,909,794</FinancialDeltaValue>),
    ).not.toThrow();

    expect(screen.getByText("+₫4,909,794")).toBeInTheDocument();
  });

  it("keeps a positive tone when direction is explicit", () => {
    render(
      <FinancialDeltaValue direction={FinancialDeltaDirection.POSITIVE}>
        +₫100,000
      </FinancialDeltaValue>,
    );

    expect(screen.getByText("+₫100,000")).toBeInTheDocument();
  });
});
