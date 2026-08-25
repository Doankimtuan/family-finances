"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { deleteAccountAction } from "./actions";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusAlert = useStatusAlert();
  const motionPolicy = useMotionPolicy({ essential: true });
  const confirmationMotion = {
    initial: {
      opacity: 0,
      y: motionPolicy.reducedMotion ? 0 : motionTokens.distance.xs,
    },
    animate: { opacity: 1, y: 0 },
    exit: {
      opacity: 0,
      y: motionPolicy.reducedMotion ? 0 : -motionTokens.distance.xs,
    },
  };
  const confirmationTransition = motionPolicy.reducedMotion
    ? { duration: motionTokens.duration.fast }
    : springs.gentle;

  const onDelete = () => {
    statusAlert.hide();
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.status === "success") {
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

        <AnimatePresence initial={false} mode="wait">
          {!confirmDelete ? (
            <motion.div
              key="delete-action"
              {...confirmationMotion}
              transition={confirmationTransition}
            >
              <Button
                variant="danger"
                className="w-full"
                data-testid="delete-account"
                isDisabled={isPending}
                onPress={() => {
                  statusAlert.hide();
                  setConfirmDelete(true);
                }}
              >
                {tAuth("deleteAccount")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="delete-confirmation"
              {...confirmationMotion}
              transition={confirmationTransition}
              className="flex flex-col gap-(--space-3)"
            >
              <StatusAlert
                variant={AlertVariant.DANGER}
                title={tAuth("deleteConfirmTitle")}
                description={tAuth("deleteConfirmDescription")}
              />
              <div className="flex flex-col gap-(--space-2)">
                <Button
                  variant="danger"
                  className="w-full"
                  data-testid="delete-account-confirm"
                  isDisabled={isPending}
                  onPress={onDelete}
                >
                  {isPending
                    ? tAuth("deleteSubmitting")
                    : tAuth("deleteConfirm")}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  isDisabled={isPending}
                  onPress={() => {
                    setConfirmDelete(false);
                    statusAlert.hide();
                  }}
                >
                  {tAuth("deleteCancel")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
