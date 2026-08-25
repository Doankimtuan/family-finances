"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { Button } from "@/shared/ui/button";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import type {
  JarCategoryFormOption,
  JarOption,
} from "./jar-configuration-form";
import { JarConfigurationForm } from "./jar-configuration-form";

type Props = {
  categories: JarCategoryFormOption[];
  availableJars: JarOption[];
  currency: string;
  qualifyingIncome: number | null;
};

export function CreateJarForm({
  categories,
  availableJars,
  currency,
  qualifyingIncome,
}: Props) {
  const t = useTranslations("plan.jars");
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        data-testid="jar-create-open"
        isDisabled={!online}
        onPress={() => setOpen(true)}
      >
        {online ? t("create") : t("errors.offline")}
      </Button>
      <Sheet isOpen={open} onOpenChange={setOpen}>
        <ActionSheetLayout>
          {open ? (
            <JarConfigurationForm
              mode="create"
              categories={categories}
              availableJars={availableJars}
              currency={currency}
              qualifyingIncome={qualifyingIncome}
              onCancel={() => setOpen(false)}
              onSaved={() => setOpen(false)}
            />
          ) : null}
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
