"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Text } from "@/shared/ui/text";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { invitePath } from "@/modules/tenancy/application/tenancy-constants";
import {
  revokeInvitationAction,
  type RevokeInvitationActionState,
} from "../invite-actions";

type RevokeErrorCode = Extract<
  RevokeInvitationActionState,
  { status: "error" }
>["code"];

function inviteShareUrl(locale: string, token: string): string {
  const path = `/${locale}${invitePath(token)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function InvitationsPanel({
  initialInvitations,
}: {
  initialInvitations: PendingInvitation[];
}) {
  const t = useTranslations("together.invitations");
  const locale = useLocale();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<RevokeErrorCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const onCopy = async (id: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="together-invitations"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("pendingTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

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
            return (
              <li key={invite.id}>
                <Card className="gap-(--space-3) p-(--space-4)">
                  <div className="flex flex-col gap-(--space-1)">
                    <Text size="sm" className="font-medium text-text-primary">
                      {invite.email}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {t("expires", {
                        date: new Date(invite.expiresAt).toLocaleDateString(
                          locale,
                        ),
                      })}
                    </Text>
                  </div>
                  <div className="flex flex-col gap-(--space-2)">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onPress={() => void onCopy(invite.id, link)}
                    >
                      {copiedId === invite.id ? t("copied") : t("copyLink")}
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
