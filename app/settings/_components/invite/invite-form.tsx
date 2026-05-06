"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { initialHouseholdActionState } from "@/app/household/action-types";
import { inviteMemberAction } from "@/app/household/actions";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { Label } from "@/components/ui/label";
import { RHFInput } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { CopyButton } from "./copy-button";

const inviteSchema = z.object({
  email: z.string().email("validation.invalid_email"),
});

type InviteValues = z.infer<typeof inviteSchema>;

type OutgoingInvite = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
};

interface InviteFormProps {
  origin: string;
  outgoingInvites: OutgoingInvite[];
}

export function InviteForm({ origin, outgoingInvites }: InviteFormProps) {
  const { t } = useI18n();
  const [inviteState, inviteAction] = useActionState(
    inviteMemberAction,
    initialHouseholdActionState,
  );
  const [invitePending, startInviteTransition] = useTransition();
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null);

  const inviteMethods = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const { handleSubmit: handleInviteSubmit, reset: resetInvite } =
    inviteMethods;

  useEffect(() => {
    if (inviteState.status === "success") {
      const match = /Share token:\s*(\S+)/.exec(inviteState.message ?? "");
      const link = match?.[1] ? `${origin}/household?token=${match[1]}` : null;

      const timer = setTimeout(() => {
        if (link) setLatestInviteLink(link);
        resetInvite();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [inviteState, origin, resetInvite]);

  const onSubmit = handleInviteSubmit((data) => {
    const formData = new FormData();
    formData.append("email", data.email);
    startInviteTransition(() => inviteAction(formData));
  });

  return (
    <>
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          {t("settings.invite_member")}
        </Label>
        <p className="text-sm text-slate-600">
          {t("settings.invite_description")}
        </p>
      </div>

      <div className="p-5 space-y-5">
        <FormProvider {...inviteMethods}>
          <form
            className="space-y-4"
            noValidate
            action={inviteAction}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <RHFInput
                name="email"
                label={t("settings.invitee_email")}
                type="email"
                placeholder="partner@example.com"
                required
                className="bg-white flex-1"
                hideLabel
              />
              <Button
                type="submit"
                disabled={invitePending}
                className="w-full sm:w-auto shrink-0 gap-2 rounded-xl py-6 sm:py-2 px-6 shadow-sm"
              >
                {invitePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {t("settings.send_invite")}
              </Button>
            </div>

            <FormStatus
              message={inviteState.message}
              status={inviteState.status}
            />
          </form>
        </FormProvider>

        {latestInviteLink && (
          <div className="rounded-2xl border bg-primary/5 border-primary/20 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                {t("settings.invite_link")}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 p-1.5 pl-3">
              <p className="min-w-0 flex-1 truncate text-xs text-slate-500 font-mono">
                {latestInviteLink}
              </p>
              <CopyButton text={latestInviteLink} />
            </div>
          </div>
        )}

        {outgoingInvites.length > 0 && (
          <div className="space-y-3 pt-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t("settings.pending_invitations")}
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {outgoingInvites.map((invite) => {
                const link = `${origin}/household?token=${invite.token}`;
                return (
                  <div
                    key={invite.id}
                    className="rounded-xl border border-slate-100 bg-white shadow-xs p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {invite.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-100 p-1 pl-2">
                      <p className="min-w-0 flex-1 truncate text-[10px] text-slate-400 font-mono">
                        {link}
                      </p>
                      <CopyButton text={link} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
