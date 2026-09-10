"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { Card } from "@/shared/patterns/card";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { createInvitationAction } from "../../invite-actions";

export function InvitationForm() {
  const t = useTranslations("together.invitations");
  const statusAlert = useStatusAlert();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSend = () => {
    statusAlert.hide();
    if (!email.trim().includes("@")) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    startTransition(async () => {
      const result = await createInvitationAction({ email: email.trim() });
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("sendTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  };

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="invite-form">
      <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
        <StatusAlert
          variant={AlertVariant.INFO}
          title={t("inviteIntroTitle")}
          description={t("inviteIntroBody")}
        />
        <TextField
          id="invite-email"
          label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError ? t("emailError") : undefined}
          autoComplete="email"
        />
      </Card>
      <BottomActionBar>
        <Button
          variant="primary"
          className="min-h-12 w-full"
          data-testid="invite-send"
          onPress={onSend}
          isDisabled={isPending}
          isPending={isPending}
        >
          {isPending ? t("sending") : t("send")}
        </Button>
      </BottomActionBar>
    </div>
  );
}
