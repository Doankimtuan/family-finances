"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { AlertVariant } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { deleteAccountAction } from "./actions";
import { DeleteAccountConfirmSheet } from "./delete-account-confirm-sheet";
import { useStatusAlert } from "@/providers/status-alert-provider";
import {
  AUTH_ADAPTER_SIGNOUT_PATH,
  AUTH_LOCALE_WELCOME_SEGMENT,
} from "@/modules/tenancy/application/auth-constants";

/**
 * Sign-out + delete-account confirm UX for Together (ST-E02-006).
 */
export function AccountLifecycleCard() {
  const tAuth = useTranslations("auth.account");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const statusAlert = useStatusAlert();

  const closeDeleteConfirm = () => {
    if (isPending) return;
    setIsDeleteConfirmOpen(false);
    statusAlert.hide();
  };

  const onDelete = () => {
    if (isPending) return;
    statusAlert.hide();
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.status === "success") {
        setIsDeleteConfirmOpen(false);
        router.replace(`/${AUTH_LOCALE_WELCOME_SEGMENT}`);
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: tAuth("deleteErrorTitle"),
        description: tAuth(`errors.${result.code}`),
      });
    });
  };

  return (
    <Card className="gap-0 overflow-hidden p-0" data-testid="account-lifecycle">
      <div className="flex flex-col gap-(--space-4) p-(--space-4)">
        <div className="flex flex-col gap-(--space-1)">
          <Text size="sm" className="font-semibold text-text-primary">
            {tAuth("title")}
          </Text>
          <Text size="sm" tone="secondary">
            {tAuth("subtitle")}
          </Text>
        </div>

        <form action={AUTH_ADAPTER_SIGNOUT_PATH} method="post">
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            data-testid="sign-out"
            isDisabled={isPending}
          >
            {tAuth("signOut")}
          </Button>
        </form>

        <div className="h-px w-full bg-divider" role="separator" aria-hidden />

        <Button
          variant="danger"
          className="w-full"
          data-testid="delete-account"
          isDisabled={isPending}
          onPress={() => {
            statusAlert.hide();
            setIsDeleteConfirmOpen(true);
          }}
        >
          {tAuth("deleteAccount")}
        </Button>
      </div>
      <DeleteAccountConfirmSheet
        isOpen={isDeleteConfirmOpen}
        isPending={isPending}
        onClose={closeDeleteConfirm}
        onConfirm={onDelete}
      />
    </Card>
  );
}
