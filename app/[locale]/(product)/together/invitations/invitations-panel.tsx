"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { invitePath } from "@/modules/tenancy/application/tenancy-constants";
import {
  createInvitationAction,
  revokeInvitationAction,
  type CreateInvitationActionState,
  type RevokeInvitationActionState,
} from "../invite-actions";

type InvitationsPanelErrorCode =
  | Extract<CreateInvitationActionState, { status: "error" }>["code"]
  | Extract<RevokeInvitationActionState, { status: "error" }>["code"];

function inviteShareUrl(locale: string, token: string): string {
  const path = `/${locale}${invitePath(token)}`;
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

/**
 * Send + list + revoke pending invitations (together.invitations).
 */
export function InvitationsPanel({
  initialInvitations,
}: {
  initialInvitations: PendingInvitation[];
}) {
  const t = useTranslations("together.invitations");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [errorCode, setErrorCode] = useState<InvitationsPanelErrorCode | null>(
    null,
  );
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSend = () => {
    setErrorCode(null);
    setCreatedLink(null);
    setCopied(false);
    if (!email.trim().includes("@")) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    startTransition(async () => {
      const result = await createInvitationAction({ email: email.trim() });
      if (result.status === "success") {
        setCreatedLink(inviteShareUrl(locale, result.token));
        setEmail("");
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  const onRevoke = (id: string) => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await revokeInvitationAction(id);
      if (result.status === "success") {
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  const onCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="together-invitations"
    >
      <SectionHeader title={t("sendTitle")} />

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("sendTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {createdLink ? (
        <StatusAlert
          variant="success"
          title={t("createdTitle")}
          description={t("createdDescription")}
        />
      ) : null}

      {createdLink ? (
        <Card className="gap-(--space-3) p-(--space-4)">
          <Text size="sm" className="break-all text-text-secondary">
            {createdLink}
          </Text>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="invite-copy-link"
            onPress={() => void onCopy(createdLink)}
          >
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </Card>
      ) : null}

      <TextField
        id="invite-email"
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError ? tValidation("required") : undefined}
        autoComplete="email"
      />
      <Button
        variant="primary"
        className="w-full"
        data-testid="invite-send"
        onPress={onSend}
        isDisabled={isPending}
      >
        {isPending ? t("sending") : t("send")}
      </Button>

      <SectionHeader title={t("pendingTitle")} />

      {initialInvitations.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="flex-none py-(--space-6)"
        />
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {initialInvitations.map((invite) => {
            const link = inviteShareUrl(locale, invite.token);
            const expiresLabel = t("expires", {
              date: new Date(invite.expiresAt).toLocaleDateString(locale),
            });
            return (
              <li key={invite.id}>
                <Card className="gap-(--space-3) p-(--space-4)">
                  <div className="flex flex-col gap-(--space-1)">
                    <Text size="sm" className="font-medium text-text-primary">
                      {invite.email}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {expiresLabel}
                    </Text>
                  </div>
                  <div className="flex flex-col gap-(--space-2)">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onPress={() => void onCopy(link)}
                    >
                      {t("copyLink")}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      data-testid="invite-revoke"
                      isDisabled={isPending}
                      onPress={() => onRevoke(invite.id)}
                    >
                      {t("revoke")}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
