"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { createInvitationAction } from "../../invite-actions";

export function InvitationForm() {
  const t = useTranslations("together.invitations");
  const tValidation = useTranslations("validation");
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
      <TextField
        id="invite-email"
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
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
    </div>
  );
}
