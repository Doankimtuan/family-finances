"use client";

import { useTranslations } from "next-intl";
import { ActionSheetLayout, Sheet, SheetActionFooter } from "@/shared/patterns";
import { Text } from "@/shared/ui/text";
import { ButtonVariant } from "@/shared/ui/button";

type Props = {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteAccountConfirmSheet({
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: Props) {
  const tAuth = useTranslations("auth.account");

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
            {tAuth("deleteConfirmTitle")}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <Text size="sm" tone="secondary" className="text-pretty">
            {tAuth("deleteConfirmDescription")}
          </Text>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={tAuth("deleteCancel")}
          primaryLabel={
            isPending ? tAuth("deleteSubmitting") : tAuth("deleteConfirm")
          }
          onSecondary={close}
          onPrimary={onConfirm}
          primaryTestId="delete-account-confirm"
          primaryVariant={ButtonVariant.DANGER}
          isPending={isPending}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
