"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  JarState,
  type JarState as JarStateValue,
} from "@/modules/plan/application/client";
import { useRouter } from "@/i18n/navigation";
import { PlanDisclosure } from "../../plan-disclosure";
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

type Props = {
  jarId: string;
  state: JarStateValue;
};

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function JarDetailLifecycleControls({ jarId, state }: Props) {
  const t = useTranslations("plan.jars");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
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
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="jar-lifecycle-controls"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("editJar")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
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
