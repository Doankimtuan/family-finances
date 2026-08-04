"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type {
  MonthRitual,
  RitualActionErrorCode,
} from "@/modules/plan/application/client";
import {
  RitualStatus,
  QUICK_CLOSE_CONSECUTIVE_RITUALS,
  formatPeriodLabel,
} from "@/modules/plan/application/client";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
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
  RitualActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  ritual: MonthRitual;
};

type PendingAction = "preview" | "approve" | "quickClose" | "correct";

function stepValue(status: MonthRitual["status"]): number {
  switch (status) {
    case RitualStatus.PREVIEWED:
      return 2;
    case RitualStatus.APPROVED:
    case RitualStatus.PENDING_REVIEW:
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const periodLabel = formatPeriodLabel(ritual.periodMonth);
  const preview = ritual.preview;
  const busy = pendingAction != null;
  const hasDivergence = ritual.divergence.length > 0;
  const isLockedView =
    ritual.status === RitualStatus.APPROVED ||
    ritual.status === RitualStatus.PENDING_REVIEW;

  const run = (
    action: PendingAction,
    fn: () => Promise<
      { status: "success" } | { status: "error"; code: RitualActionErrorCode }
    >,
    onOk?: () => void,
  ) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    setPendingAction(action);
    void (async () => {
      try {
        const result = await fn();
        if (result.status === "success") {
          onOk?.();
          router.refresh();
          setPendingAction(null);
          return;
        }
        setErrorCode(result.code);
        setPendingAction(null);
      } catch {
        setErrorCode(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
        setPendingAction(null);
      }
    })();
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
        {ritual.quickCloseEligible ? (
          <Text
            size="sm"
            tone="secondary"
            data-testid="ritual-quick-close-ready"
          >
            {t("quickCloseReady", {
              count: String(ritual.consecutiveCompletedRituals),
              threshold: String(QUICK_CLOSE_CONSECUTIVE_RITUALS),
            })}
          </Text>
        ) : (
          <Text
            size="sm"
            tone="secondary"
            data-testid="ritual-quick-close-progress"
          >
            {t("quickCloseProgress", {
              count: String(ritual.consecutiveCompletedRituals),
              threshold: String(QUICK_CLOSE_CONSECUTIVE_RITUALS),
            })}
          </Text>
        )}
      </div>

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {ritual.status === RitualStatus.PENDING_REVIEW ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="ritual-pending-review"
        >
          <StatusAlert
            variant="warning"
            title={t("pendingReviewTitle")}
            description={t("pendingReviewBody")}
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
            isDisabled={busy || !online}
            onPress={() =>
              run("correct", () =>
                correctRitualAction({
                  note: correctionNote.trim(),
                  periodMonth: ritual.periodMonth,
                }),
              )
            }
          >
            {pendingAction === "correct" ? t("correcting") : t("correctionCta")}
          </Button>
        </div>
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
            isDisabled={busy || !online}
            onPress={() =>
              run("correct", () =>
                correctRitualAction({
                  note: correctionNote.trim(),
                  periodMonth: ritual.periodMonth,
                }),
              )
            }
          >
            {pendingAction === "correct" ? t("correcting") : t("correctionCta")}
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

      {!isLockedView ? (
        <>
          <section
            className="flex flex-col gap-(--space-3)"
            data-testid="ritual-divergence"
          >
            <SectionHeader title={t("divergenceHeading")} />
            {hasDivergence ? (
              <>
                <StatusAlert
                  variant="warning"
                  title={t("divergenceBlockedTitle")}
                  description={t("divergenceBlockedBody")}
                />
                <ul className="flex flex-col gap-(--space-2)">
                  {ritual.divergence.map((item) => (
                    <li
                      key={item.categoryId}
                      className="flex min-h-11 items-center justify-between gap-(--space-3) rounded-md border border-border-subtle bg-surface px-(--space-3) py-(--space-2)"
                      data-testid="ritual-divergence-item"
                    >
                      <span className="text-sm text-text-primary">
                        {item.categoryName}
                      </span>
                      <span className="text-sm tabular-nums text-text-secondary">
                        {t("divergenceTxnCount", {
                          count: String(item.transactionCount),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <StatusAlert
                variant="success"
                title={t("divergenceClearTitle")}
                description={t("divergenceClearBody")}
              />
            )}
          </section>

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
              <Kpi
                label={t("kpi.emergencies")}
                value={String(ritual.emergencies.length)}
              />
            </ul>
            <Button
              variant="secondary"
              className="w-full"
              data-testid="ritual-preview-cta"
              isDisabled={busy || !online || hasDivergence}
              onPress={() => run("preview", () => previewRitualAction())}
            >
              {pendingAction === "preview"
                ? t("previewing")
                : ritual.status === RitualStatus.DRAFT ||
                    ritual.status === RitualStatus.CORRECTED
                  ? t("previewCta")
                  : t("previewRefresh")}
            </Button>
          </section>

          {(ritual.status === RitualStatus.PREVIEWED ||
            ritual.status === RitualStatus.CORRECTED ||
            ritual.status === RitualStatus.DRAFT) &&
          ritual.emergencies.length > 0 ? (
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="ritual-emergency-reflection"
            >
              <SectionHeader title={t("emergencyHeading")} />
              <Text size="sm" tone="secondary">
                {t("emergencyHint")}
              </Text>
              <ul className="flex flex-col gap-(--space-2)">
                {ritual.emergencies.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-(--space-1) rounded-md border border-border-subtle bg-surface px-(--space-3) py-(--space-2)"
                    data-testid="ritual-emergency-item"
                  >
                    <span className="text-sm font-semibold tabular-nums text-text-primary">
                      {t("emergencyAmount", { amount: String(item.amount) })}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {item.intentNote
                        ? t("emergencyNote", { note: item.intentNote })
                        : t("emergencyNoteMissing")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {ritual.status === RitualStatus.PREVIEWED ||
          ritual.status === RitualStatus.CORRECTED ? (
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="ritual-assisted-steps"
            >
              <SectionHeader title={t("assistedHeading")} />
              <ol className="flex list-decimal flex-col gap-(--space-2) pl-(--space-5) text-sm text-text-secondary">
                <li>{t("assisted.stepDivergence")}</li>
                <li>{t("assisted.stepInbox")}</li>
                <li>{t("assisted.stepEmergency")}</li>
                <li>{t("assisted.stepApprove")}</li>
              </ol>
            </section>
          ) : null}

          {ritual.quickCloseEligible &&
          ritual.status !== RitualStatus.APPROVED ? (
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="ritual-quick-close"
            >
              <StatusAlert
                variant="info"
                title={t("quickCloseTitle")}
                description={t("quickCloseBody")}
              />
              <Button
                variant="primary"
                className="w-full"
                data-testid="ritual-quick-close-cta"
                isDisabled={busy || !online || hasDivergence}
                onPress={() =>
                  run("quickClose", () =>
                    approveRitualAction({ quickClose: true }),
                  )
                }
              >
                {pendingAction === "quickClose"
                  ? t("approving")
                  : t("quickCloseCta")}
              </Button>
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
                  isDisabled={busy || !online || hasDivergence}
                  onPress={() =>
                    run(
                      "approve",
                      () => approveRitualAction(),
                      () => setConfirmApprove(false),
                    )
                  }
                >
                  {pendingAction === "approve"
                    ? t("approving")
                    : t("approveConfirmYes")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  isDisabled={busy}
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
                isDisabled={busy || !online || hasDivergence}
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
