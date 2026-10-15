"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  JarState,
  type JarPlan,
  type JarState as JarStateValue,
  type JarKind as JarKindValue,
  type JarRolloverMode as JarRolloverModeValue,
} from "@/modules/plan/application/client";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  JarConfigurationForm,
  type JarCategoryFormOption,
  type JarOption,
} from "../jar-configuration-form";

type Props = {
  primaryAction?: ReactNode;
  jarId: string;
  state: JarStateValue;
  kind: JarKindValue;
  plan: JarPlan | null;
  rolloverMode: JarRolloverModeValue;
  name: string;
  categories: JarCategoryFormOption[];
  availableJars: JarOption[];
  currency: string;
  qualifyingIncome: number | null;
};

export function JarDetailControls({
  primaryAction,
  jarId,
  state,
  kind,
  plan,
  rolloverMode,
  name,
  categories,
  availableJars,
  currency,
  qualifyingIncome,
}: Props) {
  const t = useTranslations("plan.jars");
  const { online } = useOnlineStatusClient();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="jar-controls">
      <div
        className={cn(
          "grid items-stretch gap-(--space-2)",
          primaryAction ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {primaryAction}
        <Button
          variant="outline"
          className="h-auto min-h-11 w-full whitespace-normal px-(--space-2) py-(--space-2) text-xs"
          leadingIcon={<AppIcon icon={ACTION_ICONS.edit} size="sm" />}
          data-testid="jar-edit-open"
          isDisabled={!online}
          onPress={() => setEditing(true)}
        >
          {t("editJar")}
        </Button>
      </div>
      <Sheet isOpen={editing} onOpenChange={setEditing}>
        <ActionSheetLayout>
          {editing ? (
            <JarConfigurationForm
              mode="edit"
              jarId={jarId}
              initialName={name}
              initialKind={kind}
              initialEnabled={state === JarState.ACTIVE}
              initialPlan={plan}
              initialRolloverMode={rolloverMode}
              categories={categories}
              availableJars={availableJars}
              currency={currency}
              qualifyingIncome={qualifyingIncome}
              onCancel={() => setEditing(false)}
              onSaved={() => setEditing(false)}
            />
          ) : null}
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}
