"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

interface BaseFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
}

interface RHFInputProps extends BaseFieldProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function RHFInput({
  name,
  label,
  description,
  required,
  hideLabel,
  prefix,
  suffix,
  ...props
}: RHFInputProps & React.ComponentProps<typeof Input>) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const { t } = useI18n();

  const errorKey = errors[name]?.message as string | undefined;
  const error = errorKey ? t(errorKey) : undefined;

  return (
    <FormField
      label={label}
      htmlFor={name}
      error={error}
      description={description}
      required={required}
      hideLabel={hideLabel}
    >
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </div>
        )}
        <Input
          id={name}
          {...register(name, { valueAsNumber: props.type === "number" })}
          {...props}
          className={cn(
            prefix && "pl-8",
            suffix && "pr-8",
            props.className
          )}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            {suffix}
          </div>
        )}
      </div>
    </FormField>
  );
}

interface RHFSelectProps extends BaseFieldProps {
  options: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export function RHFSelect({
  name,
  label,
  description,
  required,
  hideLabel,
  options,
  placeholder,
  defaultValue,
  className,
}: RHFSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { t } = useI18n();

  const errorKey = errors[name]?.message as string | undefined;
  const error = errorKey ? t(errorKey) : undefined;

  return (
    <FormField
      label={label}
      htmlFor={name}
      error={error}
      description={description}
      required={required}
      hideLabel={hideLabel}
    >
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id={name} className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}

export function RHFMoneyInput({
  name,
  label,
  description,
  required,
  hideLabel,
  ...props
}: BaseFieldProps & Omit<React.ComponentProps<typeof MoneyInput>, "name">) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { t } = useI18n();

  const errorKey = errors[name]?.message as string | undefined;
  const error = errorKey ? t(errorKey) : undefined;

  return (
    <FormField
      label={label}
      htmlFor={name}
      error={error}
      description={description}
      required={required}
      hideLabel={hideLabel}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <MoneyInput
            name={name}
            id={name}
            {...props}
            defaultValue={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
    </FormField>
  );
}

interface RHFColorInputProps extends BaseFieldProps {
  hideHex?: boolean;
}

export function RHFColorInput({
  name,
  label,
  description,
  required,
  hideLabel,
  hideHex,
  ...props
}: RHFColorInputProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const { t } = useI18n();

  const errorKey = errors[name]?.message as string | undefined;
  const error = errorKey ? t(errorKey) : undefined;

  const colorValue = watch(name);

  return (
    <FormField
      label={label}
      htmlFor={name}
      error={error}
      description={description}
      required={required}
      hideLabel={hideLabel}
    >
      <div className="flex items-center gap-3">
        <input
          id={name}
          type="color"
          {...register(name)}
          {...props}
          className={cn(
            "h-10 w-20 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer shadow-sm",
            props.className,
          )}
        />
        {!hideHex && (
          <span className="text-xs text-slate-500 font-medium font-mono uppercase">
            {colorValue}
          </span>
        )}
      </div>
    </FormField>
  );
}
