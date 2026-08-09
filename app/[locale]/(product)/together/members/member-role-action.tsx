"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import { HOUSEHOLD_ROLE } from "@/modules/tenancy/application/tenancy-constants";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { changeRoleAction } from "./actions";
import type { ChangeRoleActionState } from "./actions";

type ChangeRoleErrorCode = Extract<
  ChangeRoleActionState,
  { status: "error" }
>["code"];

export function MemberRoleAction({ member }: { member: HouseholdMemberRow }) {
  const t = useTranslations("together.members");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<ChangeRoleErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextRole =
    member.role === HOUSEHOLD_ROLE.ADMIN
      ? HOUSEHOLD_ROLE.PARTNER
      : HOUSEHOLD_ROLE.ADMIN;

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await changeRoleAction({
        membershipId: member.id,
        role: nextRole,
      });
      if (result.status === "success") {
        setConfirming(false);
        router.refresh();
        return;
      }
      setError(result.code);
    });
  };

  if (!confirming) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 px-(--space-2) text-xs"
        data-testid="together-change-role"
        onPress={() => setConfirming(true)}
      >
        {nextRole === HOUSEHOLD_ROLE.ADMIN ? t("makeAdmin") : t("makePartner")}
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-(--space-2)">
      <StatusAlert
        variant="info"
        title={t("confirmTitle")}
        description={t("confirmBody")}
      />
      {error ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${error}`)}
        />
      ) : null}
      <Button
        variant="primary"
        className="w-full"
        isDisabled={isPending}
        onPress={onConfirm}
      >
        {isPending ? t("saving") : t("confirm")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => {
          setConfirming(false);
          setError(null);
        }}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
