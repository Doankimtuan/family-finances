"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  JarPlanKind,
  JarState,
  type JarPlan,
  type JarState as JarStateValue,
} from "@/modules/plan/application/client";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { setJarStateAction, upsertJarPlanAction } from "../actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
type Props = {
  jarId: string;
  state: JarStateValue;
  plan: JarPlan | null;
};

export function JarDetailControls({ jarId, state, plan }: Props) {
  const t = useTranslations("plan.jars");
  const router = useRouter();
  const percentId = useId();
  const fixedId = useId();
  const { online } = useOnlineStatusClient();
  const [editing, setEditing] = useState(false);
  const [planKind, setPlanKind] = useState<
    typeof JarPlanKind.PERCENT | typeof JarPlanKind.FIXED
  >(plan?.kind ?? JarPlanKind.PERCENT);
  const [percent, setPercent] = useState(
    String(plan ? Math.round(plan.percentBps / 100) : 0),
  );
  const [fixedAmount, setFixedAmount] = useState<number | null>(
    plan?.fixedAmount ?? 0,
  );
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [showAllocateReceipt, setShowAllocateReceipt] = useState(false);
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

  const runSavePlan = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      if (
        planKind === JarPlanKind.FIXED &&
        (fixedAmount == null || fixedAmount < 0)
      ) {
        return;
      }
      const result = await upsertJarPlanAction(
        planKind === JarPlanKind.PERCENT
          ? {
              jarId,
              planKind: JarPlanKind.PERCENT,
              percent: Number(percent),
            }
          : {
              jarId,
              planKind: JarPlanKind.FIXED,
              fixedAmount: fixedAmount ?? 0,
            },
      );
      if (result.status === "success") {
        setEditing(false);
        setShowAllocateReceipt(true);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  if (confirmArchive) {
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="jar-archive-confirm"
      >
        <StatusAlert
          variant="danger"
          title={t("archiveConfirmTitle")}
          description={t("archiveConfirmBody")}
        />
        <Button
          variant="primary"
          className="w-full"
          data-testid="jar-archive-confirm-yes"
          isDisabled={isPending || !online}
          onPress={() => runState(JarState.ARCHIVED)}
        >
          {t("archiveConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={() => setConfirmArchive(false)}
        >
          {t("createCancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="jar-controls">
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("editPlan")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {showAllocateReceipt ? (
        <div data-testid="jar-allocate-receipt">
          <StatusAlert
            variant="success"
            title={t("allocateReceiptTitle")}
            description={t("allocateReceiptBody")}
          />
          <Button
            variant="secondary"
            className="mt-(--space-2) w-full"
            data-testid="jar-allocate-receipt-dismiss"
            onPress={() => setShowAllocateReceipt(false)}
          >
            {t("allocateReceiptDismiss")}
          </Button>
        </div>
      ) : null}

      {editing ? (
        <div
          className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
          data-testid="jar-plan-form"
        >
          <StatusAlert
            variant="info"
            title={t("allocateVirtualTitle")}
            description={t("allocateVirtualBody")}
          />
          <fieldset className="flex flex-col gap-(--space-2)">
            <legend className="text-sm font-semibold text-text-primary">
              {t("planKindLabel")}
            </legend>
            <div className="flex gap-(--space-2)">
              <button
                type="button"
                aria-pressed={planKind === JarPlanKind.PERCENT}
                className={
                  planKind === JarPlanKind.PERCENT
                    ? "min-h-11 flex-1 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg"
                    : "min-h-11 flex-1 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary"
                }
                onClick={() => setPlanKind(JarPlanKind.PERCENT)}
              >
                {t("planKindPercent")}
              </button>
              <button
                type="button"
                aria-pressed={planKind === JarPlanKind.FIXED}
                className={
                  planKind === JarPlanKind.FIXED
                    ? "min-h-11 flex-1 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg"
                    : "min-h-11 flex-1 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary"
                }
                onClick={() => setPlanKind(JarPlanKind.FIXED)}
              >
                {t("planKindFixed")}
              </button>
            </div>
          </fieldset>
          {planKind === JarPlanKind.PERCENT ? (
            <TextField
              id={percentId}
              label={t("percentLabel")}
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          ) : (
            <AmountField
              id={fixedId}
              label={t("fixedLabel")}
              value={fixedAmount}
              onValueChange={setFixedAmount}
            />
          )}
          <Button
            variant="primary"
            className="w-full"
            data-testid="jar-plan-save"
            isDisabled={isPending || !online}
            onPress={runSavePlan}
          >
            {t("savePlan")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            isDisabled={isPending}
            onPress={() => setEditing(false)}
          >
            {t("createCancel")}
          </Button>
        </div>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          data-testid="jar-plan-edit"
          isDisabled={!online}
          onPress={() => {
            setShowAllocateReceipt(false);
            setEditing(true);
          }}
        >
          {t("editPlan")}
        </Button>
      )}

      <div className="flex flex-col gap-(--space-2)">
        <Text size="sm" className="font-semibold text-text-primary">
          {t("stateHeading")}
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
            variant="secondary"
            className="w-full"
            data-testid="jar-archive"
            isDisabled={isPending || !online}
            onPress={() => setConfirmArchive(true)}
          >
            {t("archive")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
