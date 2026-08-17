import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import {
  ControlledFields,
  type ControlledFieldConfig,
} from "@/shared/patterns/controlled-fields";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const schema = z.object({
  amount: z.number().nullable(),
  count: z.number().min(1, "validation.invalid"),
  choice: z.string().min(1, "validation.required"),
  date: z.string().nullable(),
  decimal: z.string(),
  percent: z.number(),
  nested: z.object({ value: z.number() }),
});

type Values = z.infer<typeof schema>;

const fields = [
  {
    type: "amount",
    name: "amount",
    label: "Amount",
    id: "controlled-amount",
  },
  {
    type: "number",
    name: "count",
    label: "Count",
    id: "controlled-count",
    minValue: 1,
  },
  {
    type: "select",
    name: "choice",
    label: "Choice",
    id: "controlled-choice",
    options: [{ id: "one", label: "One" }],
  },
  {
    type: "date",
    name: "date",
    label: "Date",
    id: "controlled-date",
    emptyValue: null,
  },
  {
    type: "decimal",
    name: "decimal",
    label: "Decimal",
    id: "controlled-decimal",
    description: "Decimal description",
    required: true,
  },
  {
    type: "percentage",
    name: "percent",
    label: "Percent",
    id: "controlled-percent",
  },
  {
    type: "number",
    name: "nested.value",
    label: "Nested count",
    id: "controlled-nested-count",
  },
] satisfies ControlledFieldConfig<Values>[];

function TestForm({
  onSubmit = vi.fn(),
  choice = "one",
}: {
  onSubmit?: (values: Values) => void;
  choice?: string;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: null,
      count: 1,
      choice,
      date: null,
      decimal: "",
      percent: 5,
      nested: { value: 2 },
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <ControlledFields control={form.control} fields={fields} />
      <button type="submit">Save</button>
    </form>
  );
}

describe("controlled RHF fields", () => {
  it("renders every supported field and preserves explicit ids", () => {
    render(<TestForm />);

    expect(screen.getByLabelText("Amount")).toHaveAttribute(
      "id",
      "controlled-amount",
    );
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("Choice")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Decimal")).toBeInTheDocument();
    expect(screen.getByText("Decimal description")).toBeInTheDocument();
    expect(screen.getByText("Decimal").parentElement).toHaveTextContent("*");
    expect(screen.getByText("Percent")).toBeInTheDocument();
    expect(screen.getByText("Nested count")).toBeInTheDocument();
  });

  it("updates RHF state through a controlled amount field", async () => {
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "250000" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0].amount).toBe(250000);
  });

  it("normalizes cleared values to the configured empty value", async () => {
    const onSubmit = vi.fn();
    function EmptyValueForm() {
      const form = useForm<Values>({
        defaultValues: {
          amount: 100,
          count: 1,
          choice: "one",
          date: null,
          decimal: "",
          percent: 5,
          nested: { value: 2 },
        },
      });
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ControlledFields
            control={form.control}
            fields={[
              {
                type: "amount",
                name: "amount",
                label: "Amount",
                emptyValue: undefined,
              },
            ]}
          />
          <button type="submit">Save empty value</button>
        </form>
      );
    }

    render(<EmptyValueForm />);
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Save empty value"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0].amount).toBeUndefined();
  });

  it("updates select state and honors disabled presentation", async () => {
    const onSubmit = vi.fn();
    function SelectForm() {
      const form = useForm<Values>({
        defaultValues: {
          amount: null,
          count: 1,
          choice: "",
          date: null,
          decimal: "",
          percent: 5,
          nested: { value: 2 },
        },
      });
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ControlledFields
            control={form.control}
            fields={[
              fields[2],
              {
                type: "number",
                name: "count",
                label: "Disabled count",
                isDisabled: true,
              },
            ]}
          />
          <button type="submit">Save selection</button>
        </form>
      );
    }

    render(<SelectForm />);
    expect(screen.getByLabelText("Disabled count")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Choice"));
    fireEvent.click(await screen.findByRole("option", { name: "One" }));
    fireEvent.click(screen.getByText("Save selection"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0].choice).toBe("one");
  });

  it("uses the configured empty value and displays field errors", async () => {
    render(<TestForm choice="" />);

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Save"));

    expect(await screen.findByText("validation.required")).toBeInTheDocument();
  });

  it("supports a localized error formatter and generated ids", async () => {
    function FormWithFormatter() {
      const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
          amount: null,
          count: 0,
          choice: "",
          date: null,
          decimal: "",
          percent: 5,
          nested: { value: 2 },
        },
      });
      return (
        <form onSubmit={form.handleSubmit(() => undefined)}>
          <ControlledFields
            control={form.control}
            fields={[{ type: "number", name: "count", label: "Count" }]}
            getErrorMessage={() => "localized.invalid"}
          />
          <button type="submit">Validate</button>
        </form>
      );
    }

    render(<FormWithFormatter />);
    expect(screen.getByLabelText("Count").id).toMatch(/^_r_/);
    fireEvent.click(screen.getByText("Validate"));
    expect(await screen.findByText("localized.invalid")).toBeInTheDocument();
  });
});

// Compile-time contract: a numeric field cannot target a string path.
// @ts-expect-error intentional type-safety assertion
const invalidField: ControlledFieldConfig<Values> = {
  type: "number",
  name: "choice",
  label: "Invalid",
};
void invalidField;

// @ts-expect-error select fields require their option list
const invalidSelect: ControlledFieldConfig<Values> = {
  type: "select",
  name: "choice",
  label: "Missing options",
};
void invalidSelect;

// @ts-expect-error date fields do not accept numeric-only props
const invalidDate: ControlledFieldConfig<Values> = {
  type: "date",
  name: "date",
  label: "Invalid date config",
  step: 1,
};
void invalidDate;
