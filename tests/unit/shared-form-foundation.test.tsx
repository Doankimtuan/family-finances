import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { AmountField } from "@/shared/patterns/amount-field";
import {
  MoneyInput,
  FieldSelect,
  SelectField,
  selectKeyValue,
  TextField,
  formFieldA11y,
} from "@/shared/ui/form";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

/**
 * Canonical form foundation contract: RHF owns submitted state, zodResolver
 * validates against a schema-derived type, register for native inputs,
 * Controller for shared controlled fields. Field errors surface per field.
 */
const referenceSchema = z.object({
  label: z.string().trim().min(1, "validation.required"),
  targetId: z.string().min(1, "validation.required"),
  amount: z
    .number({ error: "validation.required" })
    .int("validation.invalidAmount")
    .positive("validation.invalidAmount"),
});

type ReferenceValues = z.infer<typeof referenceSchema>;

const referenceOptions = [
  { id: "jar-1", label: "Spending" },
  { id: "jar-2", label: "Emergency" },
];

function ReferenceForm({
  onSubmit,
}: {
  onSubmit: (values: ReferenceValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReferenceValues>({
    resolver: zodResolver(referenceSchema),
    defaultValues: { label: "", targetId: "jar-1" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        id="reference-label"
        label="Label"
        registration={register("label")}
        error={errors.label?.message}
      />
      <Controller
        control={control}
        name="targetId"
        render={({ field }) => (
          <SelectField
            id="reference-target"
            label="Target"
            value={field.value}
            onChange={field.onChange}
            options={referenceOptions}
            error={errors.targetId?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AmountField
            id="reference-amount"
            label="Amount"
            value={field.value ?? null}
            onValueChange={(next) => field.onChange(next ?? undefined)}
            error={errors.amount?.message}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
}

describe("form foundation: RHF + zodResolver reference pattern", () => {
  it("surfaces schema messages as per-field errors on invalid submit", async () => {
    render(<ReferenceForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByText("Save"));

    expect(await screen.findAllByText("validation.required")).toHaveLength(2);
    expect(screen.getByLabelText("Label")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("delivers schema-parsed typed values on valid submit", async () => {
    const onSubmit = vi.fn();
    render(<ReferenceForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "  Groceries  " },
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "50000" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      label: "Groceries",
      targetId: "jar-1",
      amount: 50000,
    });
  });
});

describe("form foundation: SelectField", () => {
  it("renders the selected option label inside the trigger", () => {
    const { container } = render(
      <SelectField
        id="country"
        label="Country"
        value="vn"
        onChange={() => undefined}
        options={[
          { id: "vn", label: "Vietnam" },
          { id: "sg", label: "Singapore" },
        ]}
      />,
    );

    expect(
      container.querySelector("[data-slot='select-value']")?.textContent,
    ).toBe("Vietnam");
    expect(screen.getByText("Country")).toBeInTheDocument();
  });

  it("marks the control invalid and describes the error", () => {
    render(
      <SelectField
        id="country"
        label="Country"
        value=""
        onChange={() => undefined}
        error="Pick a country"
        options={[{ id: "vn", label: "Vietnam" }]}
      />,
    );

    expect(screen.getByText("Pick a country")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toHaveAttribute(
      "aria-describedby",
      "country-error",
    );
  });

  it("normalizes selection keys to the string/empty-state contract", () => {
    expect(selectKeyValue(null)).toBe("");
    expect(selectKeyValue("jar-9")).toBe("jar-9");
  });
});

describe("form foundation: FieldSelect", () => {
  it("renders a read-only value and invokes its trigger", () => {
    const onPress = vi.fn();

    render(
      <FieldSelect
        id="loan-type"
        label="Loan type"
        value="Other"
        onPress={onPress}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Loan type" });
    expect(trigger).toHaveAttribute("aria-readonly", "true");
    expect(trigger).toHaveTextContent("Other");

    fireEvent.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("keeps disabled state and field messaging accessible", () => {
    render(
      <FieldSelect
        id="loan-type"
        label="Loan type"
        value="Other"
        description="Choose a loan category"
        error="Choose a valid category"
        isDisabled
      />,
    );

    const trigger = screen.getByRole("button", { name: "Loan type" });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-describedby", "loan-type-error");
    expect(screen.getByText("Choose a valid category")).toBeInTheDocument();
    expect(
      screen.queryByText("Choose a loan category"),
    ).not.toBeInTheDocument();
  });
});

describe("form foundation: MoneyInput numeric contract", () => {
  it("renders the canonical numeric value with currency formatting", () => {
    const { container } = render(
      <MoneyInput
        id="price"
        label="Price"
        value={1500000}
        onValueChange={() => undefined}
      />,
    );

    const input = container.querySelector("input");
    expect(input?.value).toContain("1,500,000");
  });

  it("renders the intentionally empty state from null", () => {
    const { container } = render(
      <MoneyInput
        id="price"
        label="Price"
        value={null}
        onValueChange={() => undefined}
      />,
    );

    const input = container.querySelector("input");
    expect(input?.value).toBe("");
  });
});

describe("form foundation: formFieldA11y described-by wiring", () => {
  const id = "field";

  it("references the error message only", () => {
    expect(formFieldA11y(id, true, true)).toEqual({
      id,
      "aria-invalid": true,
      "aria-describedby": `${id}-error`,
    });
  });

  it("references the description while no error is shown", () => {
    expect(formFieldA11y(id, false, true)).toEqual({
      id,
      "aria-invalid": undefined,
      "aria-describedby": `${id}-description`,
    });
  });

  it("omits aria-describedby when nothing is described", () => {
    expect(formFieldA11y(id, false, false)).toEqual({
      id,
      "aria-invalid": undefined,
      "aria-describedby": undefined,
    });
  });
});
