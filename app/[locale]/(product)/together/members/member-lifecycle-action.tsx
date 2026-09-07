"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import type { MembershipImpactSummary } from "@/modules/tenancy/application/membership-lifecycle";
import { ActionSheetLayout, Sheet } from "@/shared/patterns";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { cn } from "@/shared/utils/cn";
import { leaveHouseholdAction, removeHouseholdMemberAction } from "./actions";

type Props = {
  action: "leave" | "remove";
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
  const isRemoval = action === "remove";

  if (action === "leave" && isLastAdmin) {
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
        title: t("errorTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  };

  return (
    <>
      <Button
        variant={isRemoval ? "danger" : "secondary"}
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
              {isRemoval ? t("removeConfirmTitle") : t("leaveConfirmTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div className="flex flex-col gap-(--space-4)">
              <StatusAlert
                variant={AlertVariant.WARNING}
                title={
                  isRemoval ? t("removeConfirmTitle") : t("leaveConfirmTitle")
                }
                description={
                  isRemoval
                    ? t("removeConfirmBody", { name: memberName })
                    : t("leaveConfirmBody", { name: memberName })
                }
              />
              <div className="flex flex-col gap-(--space-2)">
                <Text size="sm" className="font-semibold text-text-primary">
                  {t("impactTitle")}
                </Text>
                <Text size="sm" tone="secondary" className="text-pretty">
                  {t("impactSummary", impact)}
                </Text>
                {impact.loans + impact.liabilities + impact.savings > 0 ? (
                  <Text size="sm" tone="secondary" className="text-pretty">
                    {t("obligationWarning")}
                  </Text>
                ) : null}
              </div>
            </div>
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button
              variant="secondary"
              fullWidth
              className="min-w-0 flex-1 shadow-none"
              isDisabled={isPending}
              onPress={close}
            >
              {t("cancel")}
            </Button>
            <Button
              variant={isRemoval ? "danger" : "primary"}
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending}
              isPending={isPending}
              onPress={onConfirm}
            >
              {isPending ? t("saving") : t("confirmLifecycle")}
            </Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
