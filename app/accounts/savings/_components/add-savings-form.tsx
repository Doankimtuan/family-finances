"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { FormProvider } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

import { useSavingsForm } from "../_hooks/use-savings-form";
import type { AccountOption, GoalOption, JarOption } from "../_lib/form-types";
import { SavingsStepType } from "./savings-step-type";
import { SavingsStepDetails } from "./savings-step-details";
import { SavingsStepReview } from "./savings-step-review";

type Props = {
  accounts: AccountOption[];
  goals: GoalOption[];
  jars?: JarOption[];
  defaultType?: "bank" | "third_party";
  triggerLabel?: string;
};

export function AddSavingsForm({
  accounts,
  goals,
  jars = [],
  defaultType = "bank",
  triggerLabel,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const {
    form,
    preview,
    isPending,
    validateDetails,
    toggleLinkedAccount,
    handleConfirm,
  } = useSavingsForm(defaultType, accounts);

  const steps = [
    t("savings.form.step.type"),
    t("savings.form.step.details"),
    t("savings.form.step.review"),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setStep(1);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerLabel ?? t("savings.add")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-300 bg-white p-6 shadow-2xl sm:max-w-3xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-950">
            {t("savings.form.title")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-600">
            {t("savings.form.description")}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <div className="space-y-5">
            {/* Step Indicator */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              {steps.map((label, index) => {
                const value = index + 1;
                const active = step === value;
                const done = step > value;
                return (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    onClick={async () => {
                      if (value === 3) {
                        const isValid = await validateDetails();
                        if (isValid) setStep(value);
                      } else {
                        setStep(value);
                      }
                    }}
                    className={cn(
                      "rounded-xl px-3 py-3 text-left transition h-auto justify-start",
                      active
                        ? "bg-white shadow-sm ring-1 ring-slate-200 hover:bg-white"
                        : "text-slate-600 hover:bg-white/70",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          active || done
                            ? "bg-primary text-primary-foreground"
                            : "bg-white text-slate-600 ring-1 ring-slate-200",
                        )}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : value}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Wizard Steps */}
            {step === 1 && (
              <SavingsStepType
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <SavingsStepDetails
                accounts={accounts}
                goals={goals}
                jars={jars}
                toggleLinkedAccount={toggleLinkedAccount}
                onBack={() => setStep(1)}
                onNext={async () => {
                  const isValid = await validateDetails();
                  if (isValid) setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <SavingsStepReview
                form={form.watch()}
                preview={preview}
                accounts={accounts}
                goals={goals}
                jars={jars}
                isPending={isPending}
                onBack={() => setStep(2)}
                onConfirm={() => handleConfirm(() => setOpen(false))}
              />
            )}
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
