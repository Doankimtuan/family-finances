"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import type { MembershipImpactSummary } from "@/modules/tenancy/application/membership-lifecycle";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { leaveHouseholdAction, removeHouseholdMemberAction } from "./actions";

type Props =
  | {
      action: "leave";
      member: HouseholdMemberRow;
      impact: MembershipImpactSummary;
      isLastAdmin?: boolean;
      isSoloAdmin?: boolean;
    }
  | {
      action: "remove";
      member: HouseholdMemberRow;
      impact: MembershipImpactSummary;
      isLastAdmin?: boolean;
      isSoloAdmin?: boolean;
    };

export function MemberLifecycleAction({
  action,
  member,
  impact,
  isLastAdmin = false,
  isSoloAdmin = false,
}: Props) {
  const t = useTranslations("together.members");
  const router = useRouter();
  const statusAlert = useStatusAlert();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const memberName = member.displayName ?? member.email ?? t("thisMember");

  if (action === "leave" && isLastAdmin) {
    return (
      <StatusAlert
        variant={AlertVariant.INFO}
        title={t("leaveBlockedTitle")}
        description={t(
          isSoloAdmin
            ? "householdClosureUnavailable"
            : "transferAdminBeforeLeaving",
        )}
      />
    );
  }

  const onConfirm = () => {
    statusAlert.hide();
    startTransition(async () => {
      const result =
        action === "leave"
          ? await leaveHouseholdAction()
          : await removeHouseholdMemberAction(member.id);
      if (result.status === "success") {
        setConfirming(false);
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("errorTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  };

  if (!confirming) {
    return (
      <Button
        variant={action === "remove" ? "danger" : "secondary"}
        className="w-full"
        data-testid={`together-${action}-member`}
        onPress={() => setConfirming(true)}
      >
        {action === "leave" ? t("leaveAction") : t("removeAction")}
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-(--space-2)">
      <StatusAlert
        variant={AlertVariant.WARNING}
        title={
          action === "leave" ? t("leaveConfirmTitle") : t("removeConfirmTitle")
        }
        description={
          action === "leave"
            ? t("leaveConfirmBody", { name: memberName })
            : t("removeConfirmBody", { name: memberName })
        }
      />
      <p className="text-sm text-text-secondary">
        {t("impactSummary", impact)}
      </p>
      {impact.loans + impact.liabilities + impact.savings > 0 ? (
        <p className="text-sm text-text-secondary">{t("obligationWarning")}</p>
      ) : null}
      <Button
        variant={action === "remove" ? "danger" : "primary"}
        className="w-full"
        isDisabled={isPending}
        onPress={onConfirm}
      >
        {isPending ? t("saving") : t("confirmLifecycle")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => {
          setConfirming(false);
          statusAlert.hide();
        }}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
