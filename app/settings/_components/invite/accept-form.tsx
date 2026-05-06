"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, Loader2, UserPlus } from "lucide-react";
import { useActionState, useEffect, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { initialHouseholdActionState } from "@/app/household/action-types";
import { acceptInviteAction } from "@/app/household/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormStatus } from "@/components/ui/form-status";
import { Label } from "@/components/ui/label";
import { RHFInput } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";

const acceptSchema = z.object({
  token: z.string().min(1, "validation.token_required"),
});

type AcceptValues = z.infer<typeof acceptSchema>;

type IncomingInvite = {
  id: string;
  token: string;
  expires_at: string;
  households: { name: string } | null;
};

interface AcceptFormProps {
  incomingInvites: IncomingInvite[];
}

export function AcceptForm({ incomingInvites }: AcceptFormProps) {
  const { t } = useI18n();
  const [acceptState, acceptAction] = useActionState(
    acceptInviteAction,
    initialHouseholdActionState,
  );
  const [acceptPending, startAcceptTransition] = useTransition();

  const acceptMethods = useForm<AcceptValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { token: "" },
  });

  const { handleSubmit: handleAcceptSubmit, reset: resetAccept } =
    acceptMethods;

  useEffect(() => {
    if (acceptState.status === "success") {
      const timer = setTimeout(() => {
        resetAccept();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [acceptState.status, resetAccept]);

  const onSubmit = handleAcceptSubmit((data) => {
    const formData = new FormData();
    formData.append("token", data.token);
    startAcceptTransition(() => acceptAction(formData));
  });

  return (
    <>
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          {t("settings.accept_invitation")}
        </Label>
        <p className="text-sm text-slate-600">
          {t("settings.accept_description")}
        </p>
      </div>

      <div className="p-5 space-y-6">
        {incomingInvites.length > 0 && (
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t("settings.invitations_for_you")}
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {incomingInvites.map((invite) => (
                <Card
                  key={invite.id}
                  className="border-emerald-100 bg-emerald-50/30 shadow-xs group hover:border-emerald-200 transition-all"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {invite.households?.name ?? t("settings.unknown_household")}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500">
                        <Clock className="h-3 w-3" />
                        {t("settings.expires")}{" "}
                        {new Date(invite.expires_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <form
                      action={acceptAction}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData();
                        fd.set("token", invite.token);
                        startAcceptTransition(() => acceptAction(fd));
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        disabled={acceptPending}
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm px-4"
                      >
                        {acceptPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("settings.join")
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <FormProvider {...acceptMethods}>
          <form
            className="space-y-4"
            noValidate
            action={acceptAction}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <RHFInput
                name="token"
                label={t("settings.enter_token")}
                placeholder={t("settings.paste_token")}
                required
                hideLabel
                className="bg-white flex-1 font-mono text-xs"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={acceptPending}
                className="w-full sm:w-auto shrink-0 gap-2 rounded-xl py-6 sm:py-2 px-6 border-slate-200 hover:bg-slate-50"
              >
                {acceptPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {t("settings.accept")}
              </Button>
            </div>

            <FormStatus
              message={acceptState.message}
              status={acceptState.status}
            />
          </form>
        </FormProvider>
      </div>
    </>
  );
}
