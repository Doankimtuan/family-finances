import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { DatePickerField, NumberField, TextField } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";
import { Progress } from "@/shared/ui/progress";

describe("shared/ui Pattern v1", () => {
  it("renders StatusAlert compound", () => {
    render(
      <StatusAlert
        variant="danger"
        title="Auth error"
        description="Check credentials"
      />,
    );
    expect(screen.getByText("Auth error")).toBeInTheDocument();
    expect(screen.getByText("Check credentials")).toBeInTheDocument();
  });

  it("renders TextField with label and error", () => {
    render(
      <TextField
        id="email"
        label="Email"
        error="Enter a valid email"
        defaultValue=""
      />,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("renders Button smoke", () => {
    render(<Button>Continue</Button>);
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("renders Progress with a transform-based indicator", () => {
    const { container } = render(
      <Progress
        value={25}
        label="Setup progress"
        showLabel={false}
        indicatorClassName="bg-debt"
      />,
    );
    const indicator = container.querySelector(
      "[data-slot='progress-indicator']",
    );

    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("origin-left", "bg-debt");
    expect(indicator).not.toHaveAttribute(
      "style",
      expect.stringContaining("width"),
    );
  });

  it("gives a NumberField one full-width editable grid column", () => {
    const { container } = render(
      <NumberField id="conversion-fee" label="Conversion fee (%)" value={0} />,
    );
    const group = container.querySelector("[data-slot='number-field-group']");
    const input = container.querySelector("[data-slot='number-field-input']");

    expect(group).toHaveClass("grid-cols-[minmax(0,1fr)]");
    expect(input).toHaveClass("col-span-full", "w-full");
  });

  it("places the date picker trigger inside its continuous field group", () => {
    const { container } = render(
      <DatePickerField
        id="start-date"
        label="Start date"
        value="2026-08-13"
        onChange={() => undefined}
      />,
    );
    const group = container.querySelector("[data-slot='date-input-group']");
    const trigger = container.querySelector(
      "[data-slot='date-picker-trigger']",
    );

    expect(group).toHaveClass("px-(--space-2)");
    expect(group).not.toHaveClass("px-(--space-3)");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    expect(group).toContainElement(trigger);
  });

  it("vertically centers the select trigger value", () => {
    const { container } = render(
      <Select selectedKey="tpbank" aria-label="Payment from account">
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <Select.ListBox>
            <Select.ListBox.Item id="tpbank" textValue="TPBank">
              TPBank
            </Select.ListBox.Item>
          </Select.ListBox>
        </Select.Popover>
      </Select>,
    );
    const trigger = container.querySelector("[data-slot='select-trigger']");
    const value = container.querySelector("[data-slot='select-value']");

    expect(trigger).toHaveClass("flex", "h-11", "items-center", "py-0");
    expect(value).toHaveClass("items-center", "leading-none");
  });
});
