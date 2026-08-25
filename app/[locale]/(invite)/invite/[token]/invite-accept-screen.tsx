"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { Card } from "@/shared/patterns/card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
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

/** Invite accept deep-link UI with explicit consent and terminal states. */
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
          title={t("notFoundTitle")}
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

  const isExpired =
    preview.isExpired || preview.status === INVITATION_STATUS.EXPIRED;
  const blocked = isExpired || preview.status !== INVITATION_STATUS.PENDING;
  const blockedTitle = isExpired ? t("expiredTitle") : t("inactiveTitle");
  const blockedDescription = isExpired
    ? t("expiredDescription")
    : t("inactiveDescription");

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
      <Card tone="hero" className="gap-(--space-4) p-(--space-4)">
        <div className="flex items-start gap-(--space-3)">
          <IconContainer tone="primary" size="md">
            <AppIcon icon={NAVIGATION_ICONS.together} size="lg" emphasized />
          </IconContainer>
          <div className="min-w-0">
            <Text size="xs" className="text-hero-muted">
              {t("invitationLabel")}
            </Text>
            <Heading
              level={1}
              className="mt-1 text-xl tracking-tight text-hero-fg"
            >
              {t("title")}
            </Heading>
          </div>
        </div>
        <div className="border-t border-white/15 pt-(--space-3)">
          <Text className="font-semibold text-hero-fg text-pretty">
            {preview.householdName}
          </Text>
          <Text size="sm" className="mt-1 text-hero-muted">
            {t("forEmail", { email: preview.inviteEmail })}
          </Text>
          {!blocked ? (
            <Text
              size="sm"
              className="mt-(--space-3) text-hero-muted text-pretty"
            >
              {t("joinDescription")}
            </Text>
          ) : null}
        </div>
      </Card>

      {blocked ? (
        <StatusAlert
          variant="warning"
          title={blockedTitle}
          description={blockedDescription}
        />
      ) : null}

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("actionErrorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {!isAuthenticated ? (
        <Link
          href={loginHrefWithNext(invitePath(token))}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg shadow-[var(--elevation-1)] transition-[background-color,transform] duration-(--duration-fast) hover:-translate-y-px active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
            className="min-h-12 w-full"
            data-testid="invite-accept"
            isDisabled={isPending}
            isPending={isPending}
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
