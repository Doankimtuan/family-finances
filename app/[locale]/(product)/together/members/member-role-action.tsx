"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import { HOUSEHOLD_ROLE } from "@/modules/tenancy/application/tenancy-constants";
import { ActionSheetLayout, Sheet, SheetActionFooter } from "@/shared/patterns";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { cn } from "@/shared/utils/cn";
import { changeRoleAction } from "./actions";

export function MemberRoleAction({
  member,
  className,
}: {
  member: HouseholdMemberRow;
  className?: string;
}) {
  const t = useTranslations("together.members");
  const router = useRouter();
  const statusAlert = useStatusAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextRole =
    member.role === HOUSEHOLD_ROLE.ADMIN
      ? HOUSEHOLD_ROLE.PARTNER
      : HOUSEHOLD_ROLE.ADMIN;
  const nextRoleLabel =
    nextRole === HOUSEHOLD_ROLE.ADMIN ? t("makeAdmin") : t("makePartner");

  const close = () => {
    if (isPending) return;
    setIsOpen(false);
    statusAlert.hide();
  };

  const onConfirm = () => {
    statusAlert.hide();
    startTransition(async () => {
      const result = await changeRoleAction({
        membershipId: member.id,
        role: nextRole,
      });
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
        variant="secondary"
        className={cn("min-h-10 w-fit px-(--space-3) text-xs", className)}
        data-testid="together-change-role"
        onPress={() => setIsOpen(true)}
        isDisabled={isPending}
      >
        {nextRoleLabel}
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
              {t("confirmTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div className="flex flex-col gap-(--space-4)">
              <Text size="sm" tone="secondary" className="text-pretty">
                {t("confirmBody")}
              </Text>
              <StatusAlert
                variant={AlertVariant.INFO}
                title={nextRoleLabel}
                description={
                  member.displayName ?? member.email ?? t("thisMember")
                }
              />
            </div>
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("cancel")}
            primaryLabel={isPending ? t("saving") : t("confirm")}
            onSecondary={close}
            onPrimary={onConfirm}
            primaryTestId="together-confirm-role"
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
