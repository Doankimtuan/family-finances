"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  AUTH_PRIMARY_ACTION_CLASS_NAME,
  AuthScreenShell,
  BrandMark,
} from "@/shared/patterns";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
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
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<AcceptScreenErrorCode | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  if (!preview) {
    return (
      <AuthScreenShell testId="invite-accept" align="center">
        <InviteIdentity brand={tCommon("brand")} />
        <StatusAlert
          variant={AlertVariant.DANGER}
          title={t("notFoundTitle")}
          description={t("errors.not_found")}
        />
        <Button
          variant="primary"
          className={AUTH_PRIMARY_ACTION_CLASS_NAME}
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
    <AuthScreenShell testId="invite-accept" align="center" busy={isPending}>
      <InviteIdentity brand={tCommon("brand")} />

      <header className="flex flex-col gap-(--space-2)">
        <Text size="xs" weight="medium" tone="secondary">
          {t("invitationLabel")}
        </Text>
        <Heading level={1} className="text-2xl leading-tight tracking-tight">
          {t("title")}
        </Heading>
        <Text weight="semibold" className="text-pretty text-text-primary">
          {preview.householdName}
        </Text>
        <Text size="sm" tone="secondary">
          {t("forEmail", { email: preview.inviteEmail })}
        </Text>
        {!blocked ? (
          <Text size="sm" tone="secondary" className="text-pretty">
            {t("joinDescription")}
          </Text>
        ) : null}
      </header>

      {blocked ? (
        <StatusAlert
          variant={AlertVariant.WARNING}
          title={blockedTitle}
          description={blockedDescription}
        />
      ) : null}

      {errorCode ? (
        <StatusAlert
          variant={AlertVariant.DANGER}
          title={t("actionErrorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {!isAuthenticated ? (
        <Link
          href={loginHrefWithNext(invitePath(token))}
          className={cn(
            AUTH_PRIMARY_ACTION_CLASS_NAME,
            "inline-flex items-center justify-center rounded-(--radius-control) bg-accent px-(--space-4) text-accent-fg shadow-(--elevation-1)",
            "transition-[background-color,transform] duration-(--duration-fast) ease-(--ease-standard)",
            "hover:-translate-y-px active:scale-(--press-scale)",
            "motion-reduce:transition-none motion-reduce:active:scale-100",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          )}
        >
          {t("signIn")}
        </Link>
      ) : blocked ? (
        <Button
          variant="primary"
          className={AUTH_PRIMARY_ACTION_CLASS_NAME}
          onPress={() => router.replace(APP_PATH.TOGETHER)}
        >
          {t("goTogether")}
        </Button>
      ) : (
        <div className="flex flex-col gap-(--space-2)">
          <Button
            variant="primary"
            className={AUTH_PRIMARY_ACTION_CLASS_NAME}
            data-testid="invite-accept"
            isDisabled={isPending}
            isPending={isPending}
            onPress={onAccept}
          >
            {isPending ? t("accepting") : t("accept")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 w-full"
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

function InviteIdentity({ brand }: { brand: string }) {
  return (
    <div className="flex items-center gap-(--space-2)">
      <BrandMark variant="soft" size="sm" decorative />
      <Text size="sm" weight="semibold" className="text-text-primary">
        {brand}
      </Text>
    </div>
  );
}
