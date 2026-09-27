"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/shared/utils/cn";

type RadioGroupContextValue = {
  name: string;
  value?: string;
  select: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function RadioGroup({
  name: nameProp,
  value,
  defaultValue,
  onChange,
  disabled,
  orientation = "vertical",
  label,
  description,
  error,
  children,
  className,
  "data-testid": testId,
}: RadioGroupProps) {
  const generatedName = useId();
  const name = nameProp ?? generatedName;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const resolvedValue = value !== undefined ? value : uncontrolledValue;

  const select = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  };

  return (
    <RadioGroupContext.Provider
      value={{ name, value: resolvedValue, select, disabled }}
    >
      <fieldset
        role="radiogroup"
        data-testid={testId}
        className={cn("flex flex-col gap-2 border-none p-0 m-0", className)}
      >
        {label ? (
          <legend className="text-sm font-semibold text-text-primary mb-1">
            {label}
          </legend>
        ) : null}
        {description ? (
          <p className="text-xs text-text-muted mb-2">{description}</p>
        ) : null}
        <div
          className={cn(
            orientation === "horizontal"
              ? "flex flex-row flex-wrap items-center gap-4"
              : "flex flex-col gap-0",
          )}
        >
          {children}
        </div>
        {error ? (
          <p className="text-xs text-debt font-medium mt-1" role="alert">
            {error}
          </p>
        ) : null}
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

export type RadioProps = {
  value: string;
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

export function Radio({
  value,
  id: idProp,
  label,
  description,
  disabled: itemDisabled,
  className,
  "data-testid": testId,
}: RadioProps) {
  const ctx = useContext(RadioGroupContext);
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const isChecked = ctx ? ctx.value === value : false;
  const isDisabled = itemDisabled || ctx?.disabled || false;

  const handleChange = () => {
    if (!isDisabled) ctx?.select(value);
  };

  return (
    <label
      htmlFor={id}
      className={cn(
        "group relative flex min-h-11 cursor-pointer items-center gap-3 select-none",
        isDisabled && "cursor-not-allowed opacity-45",
        className,
      )}
    >
      <div className="relative flex size-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="radio"
          name={ctx?.name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          data-testid={testId}
          className="peer sr-only"
        />
        {/* Custom 20x20px circle */}
        <div
          className={cn(
            "flex size-5 items-center justify-center rounded-full border transition-[border-color,box-shadow]",
            "border-border-strong bg-surface",
            "group-hover:border-primary",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring",
            isChecked && "border-2 border-primary",
          )}
        >
          {isChecked ? (
            <span className="size-2 rounded-full bg-primary" />
          ) : null}
        </div>
      </div>

      {label ? (
        <div className="flex flex-col text-sm leading-tight">
          <span className="font-medium text-text-primary group-hover:text-primary transition-colors">
            {label}
          </span>
          {description ? (
            <span className="text-xs text-text-muted mt-1 leading-normal">
              {description}
            </span>
          ) : null}
        </div>
      ) : null}
    </label>
  );
}
