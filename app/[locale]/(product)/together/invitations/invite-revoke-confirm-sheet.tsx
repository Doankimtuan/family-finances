"use client";

import { useTranslations } from "next-intl";
import { ActionSheetLayout, Sheet, SheetActionFooter } from "@/shared/patterns";
import { Text } from "@/shared/ui/text";
import { ButtonVariant } from "@/shared/ui/button";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";

type Props = {
  invitation: PendingInvitation | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function InviteRevokeConfirmSheet({
  invitation,
  isPending,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("together.invitations");
  const isOpen = invitation !== null;

  const close = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (next) return;
        close();
      }}
    >
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
            {t("revokeConfirmTitle")}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <div className="flex flex-col gap-(--space-3)">
            {invitation ? (
              <Text
                size="sm"
                className="min-w-0 break-words font-semibold text-text-primary"
                data-testid="invite-revoke-target"
              >
                {invitation.email}
              </Text>
            ) : null}
            <Text size="sm" tone="secondary" className="text-pretty">
              {t("revokeConfirmDescription")}
            </Text>
          </div>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("revokeCancel")}
          primaryLabel={isPending ? t("revokeSubmitting") : t("revokeConfirm")}
          onSecondary={close}
          onPrimary={onConfirm}
          primaryTestId="invite-revoke-confirm"
          primaryVariant={ButtonVariant.DANGER}
          isPending={isPending}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
