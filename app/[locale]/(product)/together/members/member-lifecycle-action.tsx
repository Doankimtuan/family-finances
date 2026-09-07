"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import type { MembershipImpactSummary } from "@/modules/tenancy/application/membership-lifecycle";
import {
  MEMBERSHIP_LIFECYCLE_ACTION,
  type MembershipLifecycleAction,
} from "@/modules/tenancy/application/tenancy-constants";
import { ActionSheetLayout, Sheet, SheetActionFooter } from "@/shared/patterns";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { cn } from "@/shared/utils/cn";
import { leaveHouseholdAction, removeHouseholdMemberAction } from "./actions";

type Props = {
  action: MembershipLifecycleAction;
  member: HouseholdMemberRow;
  impact: MembershipImpactSummary;
  isLastAdmin?: boolean;
  isSoloAdmin?: boolean;
  className?: string;
};

export function MemberLifecycleAction({
  action,
  member,
  impact,
  isLastAdmin = false,
  isSoloAdmin = false,
  className,
}: Props) {
  const t = useTranslations("together.members");
  const router = useRouter();
  const statusAlert = useStatusAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const memberName = member.displayName ?? member.email ?? t("thisMember");
  const isRemoval = action === MEMBERSHIP_LIFECYCLE_ACTION.REMOVE;
  const confirmTitle = isRemoval
    ? t("removeConfirmTitle")
    : t("leaveConfirmTitle");
  const confirmBody = isRemoval
    ? t("removeConfirmBody", { name: memberName })
    : t("leaveConfirmBody", { name: memberName });
  const confirmLabel = isRemoval ? t("removeConfirm") : t("leaveConfirm");
  const submittingLabel = isRemoval
    ? t("removeSubmitting")
    : t("leaveSubmitting");
  const errorTitle = isRemoval ? t("removeErrorTitle") : t("leaveErrorTitle");
  const confirmTestId = isRemoval
    ? "together-remove-confirm"
    : "together-leave-confirm";
  const hasFollowUpObligations =
    impact.loans + impact.liabilities + impact.savings > 0;

  if (action === MEMBERSHIP_LIFECYCLE_ACTION.LEAVE && isLastAdmin) {
    return (
      <StatusAlert
        variant={AlertVariant.INFO}
        className={cn("w-full", className)}
        title={t("leaveBlockedTitle")}
        description={t(
          isSoloAdmin
            ? "householdClosureUnavailable"
            : "transferAdminBeforeLeaving",
        )}
      />
    );
  }

  const close = () => {
    if (isPending) return;
    setIsOpen(false);
    statusAlert.hide();
  };

  const onConfirm = () => {
    statusAlert.hide();
    startTransition(async () => {
      const result = isRemoval
        ? await removeHouseholdMemberAction(member.id)
        : await leaveHouseholdAction();
      if (result.status === "success") {
        setIsOpen(false);
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: errorTitle,
        description: t(`errors.${result.code}`),
      });
    });
  };

  return (
    <>
      <Button
        variant={isRemoval ? ButtonVariant.DANGER : ButtonVariant.SECONDARY}
        className={cn("min-h-11 w-full", className)}
        data-testid={`together-${action}-member`}
        onPress={() => setIsOpen(true)}
        isDisabled={isPending}
      >
        {isRemoval ? t("removeAction") : t("leaveAction")}
      </Button>
      <Sheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
          else setIsOpen(true);
        }}
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {confirmTitle}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div className="flex flex-col gap-(--space-4)">
              <StatusAlert
                variant={AlertVariant.WARNING}
                title={confirmTitle}
                description={confirmBody}
              />
              <div className="flex flex-col gap-(--space-2)">
                <Text size="sm" className="font-semibold text-text-primary">
                  {t("impactTitle")}
                </Text>
                <Text size="sm" tone="secondary" className="text-pretty">
                  {t("impactSummary", impact)}
                </Text>
                {hasFollowUpObligations ? (
                  <Text size="sm" tone="secondary" className="text-pretty">
                    {t("obligationWarning")}
                  </Text>
                ) : null}
              </div>
            </div>
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("cancel")}
            primaryLabel={isPending ? submittingLabel : confirmLabel}
            onSecondary={close}
            onPrimary={onConfirm}
            primaryTestId={confirmTestId}
            primaryVariant={ButtonVariant.DANGER}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
