"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { MonthRitual } from "@/modules/plan/application/ritual-types";
import {
  RitualStatus,
  formatPeriodLabel,
} from "@/modules/plan/application/client";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { Progress } from "@/shared/ui/progress";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { SectionHeader } from "@/shared/patterns/section-header";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  previewRitualAction,
  approveRitualAction,
  correctRitualAction,
} from "./actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  ritual: MonthRitual;
};

function stepValue(status: MonthRitual["status"]): number {
  switch (status) {
    case RitualStatus.PREVIEWED:
      return 2;
    case RitualStatus.APPROVED:
      return 4;
    case RitualStatus.CORRECTED:
      return 3;
    default:
      return 1;
  }
}

export function RitualWizard({ ritual }: Props) {
  const t = useTranslations("plan.ritual");
  const router = useRouter();
  const noteId = useId();
  const { online } = useOnlineStatusClient();
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const periodLabel = formatPeriodLabel(ritual.periodMonth);
  const preview = ritual.preview;

  const run = (
    fn: () => Promise<
      { status: "success" } | { status: "error"; code: ProductActionErrorCode }
    >,
    onOk?: () => void,
  ) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await fn();
      if (result.status === "success") {
        onOk?.();
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div className="flex flex-col gap-(--space-5)" data-testid="plan-ritual">
      <Progress
        value={stepValue(ritual.status)}
        max={4}
        label={t("progressLabel", {
          step: String(stepValue(ritual.status)),
          total: "4",
        })}
      />

      <div className="flex flex-col gap-(--space-1)">
        <Text size="sm" tone="secondary">
          {t("periodLabel", { period: periodLabel })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("modeLabel", { mode: t(`modes.${ritual.mode}`) })}
        </Text>
      </div>

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {ritual.status === RitualStatus.APPROVED ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="ritual-celebration"
        >
          <StatusAlert
            variant="success"
            title={t("celebrationTitle")}
            description={t("celebrationBody")}
          />
          <StatusAlert
            variant="info"
            title={t("lockedTitle")}
            description={t("lockedBody")}
          />
          <SectionHeader title={t("correctionHeading")} />
          <TextField
            id={noteId}
            label={t("correctionNoteLabel")}
            value={correctionNote}
            onChange={(e) => setCorrectionNote(e.target.value)}
          />
          <Button
            variant="primary"
            className="w-full"
            data-testid="ritual-correct"
            isDisabled={isPending || !online}
            onPress={() =>
              run(() =>
                correctRitualAction({
                  note: correctionNote.trim(),
                  periodMonth: ritual.periodMonth,
                }),
              )
            }
          >
            {t("correctionCta")}
          </Button>
        </div>
      ) : null}

      {ritual.status === RitualStatus.CORRECTED ? (
        <StatusAlert
          variant="info"
          title={t("correctedTitle")}
          description={t("correctedBody")}
        />
      ) : null}

      {ritual.status !== RitualStatus.APPROVED ? (
        <>
          <section
            className="flex flex-col gap-(--space-3)"
            data-testid="ritual-preview"
          >
            <SectionHeader title={t("previewHeading")} />
            <Text size="sm" tone="secondary">
              {t("previewHint")}
            </Text>
            <ul className="flex flex-col gap-(--space-2)">
              <Kpi
                label={t("kpi.activeJars")}
                value={String(preview.activeJarCount)}
              />
              <Kpi
                label={t("kpi.pausedJars")}
                value={String(preview.pausedJarCount)}
              />
              <Kpi
                label={t("kpi.openInbox")}
                value={String(preview.openInboxCount)}
              />
              <Kpi
                label={t("kpi.activeGoals")}
                value={String(preview.activeGoalCount)}
              />
              <Kpi
                label={t("kpi.recurring")}
                value={String(preview.recurringActiveCount)}
              />
              <Kpi
                label={t("kpi.incomeMode")}
                value={t(`incomeModes.${preview.incomeAllocateMode}`)}
              />
            </ul>
            <Button
              variant="secondary"
              className="w-full"
              data-testid="ritual-preview-cta"
              isDisabled={isPending || !online}
              onPress={() => run(() => previewRitualAction())}
            >
              {ritual.status === RitualStatus.DRAFT ||
              ritual.status === RitualStatus.CORRECTED
                ? t("previewCta")
                : t("previewRefresh")}
            </Button>
          </section>

          {ritual.status === RitualStatus.PREVIEWED ||
          ritual.status === RitualStatus.CORRECTED ? (
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="ritual-assisted-steps"
            >
              <SectionHeader title={t("assistedHeading")} />
              <ol className="flex list-decimal flex-col gap-(--space-2) pl-(--space-5) text-sm text-text-secondary">
                <li>{t("assisted.stepJars")}</li>
                <li>{t("assisted.stepInbox")}</li>
                <li>{t("assisted.stepGoals")}</li>
                <li>{t("assisted.stepApprove")}</li>
              </ol>
            </section>
          ) : null}

          {ritual.status === RitualStatus.PREVIEWED ? (
            confirmApprove ? (
              <div
                className="flex flex-col gap-(--space-3)"
                data-testid="ritual-approve-confirm"
              >
                <StatusAlert
                  variant="warning"
                  title={t("approveConfirmTitle")}
                  description={t("approveConfirmBody")}
                />
                <Button
                  variant="primary"
                  className="w-full"
                  data-testid="ritual-approve-yes"
                  isDisabled={isPending || !online}
                  onPress={() =>
                    run(
                      () => approveRitualAction(),
                      () => setConfirmApprove(false),
                    )
                  }
                >
                  {t("approveConfirmYes")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  isDisabled={isPending}
                  onPress={() => setConfirmApprove(false)}
                >
                  {t("cancel")}
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                data-testid="ritual-approve"
                isDisabled={isPending || !online}
                onPress={() => {
                  if (!online) {
                    setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
                    return;
                  }
                  setConfirmApprove(true);
                }}
              >
                {t("approveCta")}
              </Button>
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex min-h-11 items-center justify-between gap-(--space-3) rounded-md border border-border-subtle bg-surface px-(--space-3) py-(--space-2)">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </li>
  );
}
