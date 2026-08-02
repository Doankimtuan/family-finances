"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { deleteAccountAction } from "./actions";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_ADAPTER_SIGNOUT_PATH,
  AUTH_LOCALE_WELCOME_SEGMENT,
} from "@/modules/tenancy/application/auth-constants";

type DeleteErrorCode =
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN;

/**
 * Sign-out + delete-account confirm UX for Together (ST-E02-006).
 */
export function AccountLifecycleCard() {
  const tAuth = useTranslations("auth.account");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<DeleteErrorCode | null>(null);

  const onDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.status === "success") {
        router.replace(`/${AUTH_LOCALE_WELCOME_SEGMENT}`);
        router.refresh();
        return;
      }
      setDeleteError(result.code);
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

        {!confirmDelete ? (
          <Button
            variant="danger"
            className="w-full"
            data-testid="delete-account"
            isDisabled={isPending}
            onPress={() => {
              setDeleteError(null);
              setConfirmDelete(true);
            }}
          >
            {tAuth("deleteAccount")}
          </Button>
        ) : (
          <div className="flex flex-col gap-(--space-3)">
            <StatusAlert
              variant="danger"
              title={tAuth("deleteConfirmTitle")}
              description={tAuth("deleteConfirmDescription")}
            />
            {deleteError ? (
              <StatusAlert
                variant="danger"
                title={tAuth("deleteErrorTitle")}
                description={tAuth(`errors.${deleteError}`)}
              />
            ) : null}
            <div className="flex flex-col gap-(--space-2)">
              <Button
                variant="danger"
                className="w-full"
                data-testid="delete-account-confirm"
                isDisabled={isPending}
                onPress={onDelete}
              >
                {isPending ? tAuth("deleteSubmitting") : tAuth("deleteConfirm")}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                isDisabled={isPending}
                onPress={() => {
                  setConfirmDelete(false);
                  setDeleteError(null);
                }}
              >
                {tAuth("deleteCancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
