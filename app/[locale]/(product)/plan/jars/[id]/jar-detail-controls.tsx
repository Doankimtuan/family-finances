"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  JarState,
  type JarPlan,
  type JarState as JarStateValue,
  type JarKind as JarKindValue,
  type JarRolloverMode as JarRolloverModeValue,
} from "@/modules/plan/application/client";
import { cn } from "@/shared/utils/cn";
import { PlanDisclosure } from "../../plan-disclosure";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/patterns/card";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { setJarStateAction } from "../actions";
import {
  JarConfigurationForm,
  type JarCategoryFormOption,
  type JarOption,
} from "../jar-configuration-form";

type Props = {
  primaryAction?: ReactNode;
  children?: ReactNode;
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

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function JarDetailControls({
  primaryAction,
  children,
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
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const runState = (next: JarStateValue) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await setJarStateAction({ jarId, state: next });
      if (result.status === "success") {
        setConfirmArchive(false);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="jar-controls">
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("editJar")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
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
      {children}
      <PlanDisclosure
        showLabel={t("stateHeading")}
        hideLabel={t("stateHeading")}
        testId="jar-lifecycle-options"
      >
        <Card tone="soft" className="gap-(--space-3) p-(--space-4)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("stateHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {state === JarState.ACTIVE ? t("pauseHint") : t("resumeHint")}
          </Text>
          {state === JarState.ACTIVE ? (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="jar-pause"
              isDisabled={isPending || !online}
              onPress={() => runState(JarState.PAUSED)}
            >
              {t("pause")}
            </Button>
          ) : null}
          {state === JarState.PAUSED || state === JarState.ARCHIVED ? (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="jar-resume"
              isDisabled={isPending || !online}
              onPress={() => runState(JarState.ACTIVE)}
            >
              {state === JarState.ARCHIVED ? t("unarchive") : t("resume")}
            </Button>
          ) : null}
          {state !== JarState.ARCHIVED ? (
            <Button
              variant="danger"
              className="w-full"
              data-testid="jar-archive"
              isDisabled={isPending || !online}
              onPress={() => setConfirmArchive(true)}
            >
              {t("archive")}
            </Button>
          ) : null}
        </Card>
      </PlanDisclosure>
      <Sheet isOpen={confirmArchive} onOpenChange={setConfirmArchive}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("archiveConfirmTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <StatusAlert
              variant="danger"
              title={t("archiveConfirmTitle")}
              description={t("archiveConfirmBody")}
              data-testid="jar-archive-confirm"
            />
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("createCancel")}
            primaryLabel={t("archiveConfirmYes")}
            onSecondary={() => setConfirmArchive(false)}
            onPrimary={() => runState(JarState.ARCHIVED)}
            primaryTestId="jar-archive-confirm-yes"
            isDisabled={!online}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}
