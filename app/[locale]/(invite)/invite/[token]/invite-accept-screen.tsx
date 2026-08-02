"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import type { InvitationPreview } from "@/modules/tenancy/application/get-invitation-preview";
import {
  APP_PATH,
  invitePath,
  loginHrefWithNext,
  INVITATION_STATUS,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  acceptInvitationAction,
  declineInvitationAction,
  type AcceptInvitationActionState,
  type DeclineInvitationActionState,
} from "@/app/[locale]/(product)/together/invite-actions";

type AcceptScreenErrorCode =
  AcceptInvitationActionState["code"] | DeclineInvitationActionState["code"];

/**
 * Invite accept deep-link UI (together.invite-accept).
 */
export function InviteAcceptScreen({
  token,
  preview,
  isAuthenticated,
}: {
  token: string;
  preview: InvitationPreview | null;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("together.accept");
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<AcceptScreenErrorCode | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  if (!preview) {
    return (
      <AuthScreenShell testId="invite-accept" centered>
        <StatusAlert
          variant="danger"
          title={t("title")}
          description={t("errors.not_found")}
        />
        <Button
          variant="primary"
          className="w-full"
          onPress={() => router.replace(APP_PATH.WELCOME)}
        >
          {t("goHome")}
        </Button>
      </AuthScreenShell>
    );
  }

  const blocked =
    preview.isExpired ||
    preview.status === INVITATION_STATUS.EXPIRED ||
    preview.status !== INVITATION_STATUS.PENDING;

  const onAccept = () => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      // Success redirects inside the server action.
      setErrorCode(result.code);
    });
  };

  const onDecline = () => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await declineInvitationAction(token);
      // Success redirects inside the server action.
      setErrorCode(result.code);
    });
  };

  return (
    <AuthScreenShell testId="invite-accept" centered>
      <Heading level={1} className="text-xl tracking-tight">
        {t("title")}
      </Heading>
      <Text size="sm" className="font-semibold text-text-primary">
        {preview.householdName}
      </Text>
      <Text size="sm" tone="secondary">
        {t("forEmail", { email: preview.inviteEmail })}
      </Text>

      {blocked ? (
        <StatusAlert
          variant="warning"
          title={t("expiredTitle")}
          description={t("expiredDescription")}
        />
      ) : null}

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("title")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {!isAuthenticated ? (
        <Link
          href={loginHrefWithNext(invitePath(token))}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg"
        >
          {t("signIn")}
        </Link>
      ) : blocked ? (
        <Button
          variant="primary"
          className="w-full"
          onPress={() => router.replace(APP_PATH.TOGETHER)}
        >
          {t("goTogether")}
        </Button>
      ) : (
        <div className="flex flex-col gap-(--space-2)">
          <Button
            variant="primary"
            className="w-full"
            data-testid="invite-accept"
            isDisabled={isPending}
            onPress={onAccept}
          >
            {isPending ? t("accepting") : t("accept")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="invite-decline"
            isDisabled={isPending}
            onPress={onDecline}
          >
            {isPending ? t("declining") : t("decline")}
          </Button>
        </div>
      )}
    </AuthScreenShell>
  );
}
