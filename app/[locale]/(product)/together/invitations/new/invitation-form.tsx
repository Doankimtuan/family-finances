"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import {
  createInvitationAction,
  type CreateInvitationActionState,
} from "../../invite-actions";

type CreateErrorCode = Extract<
  CreateInvitationActionState,
  { status: "error" }
>["code"];

export function InvitationForm() {
  const t = useTranslations("together.invitations");
  const tValidation = useTranslations("validation");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [errorCode, setErrorCode] = useState<CreateErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSend = () => {
    setErrorCode(null);
    if (!email.trim().includes("@")) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    startTransition(async () => {
      const result = await createInvitationAction({ email: email.trim() });
      setErrorCode(result.code);
    });
  };

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="invite-form">
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("sendTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
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
