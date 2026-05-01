"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Link as LinkIcon,
  Loader2,
  Mail,
  UserPlus,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ElementType,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { initialHouseholdActionState } from "@/app/household/action-types";
import {
  acceptInviteAction,
  inviteMemberAction,
} from "@/app/household/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormStatus } from "@/components/ui/form-status";
import { Label } from "@/components/ui/label";
import { RHFInput } from "@/components/ui/rhf-fields";
import { cn } from "@/lib/utils";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const acceptSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

type InviteValues = z.infer<typeof inviteSchema>;
type AcceptValues = z.infer<typeof acceptSchema>;

type OutgoingInvite = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
};

type IncomingInvite = {
  id: string;
  token: string;
  expires_at: string;
  households: { name: string } | null;
};

type Props = {
  origin: string;
  outgoingInvites: OutgoingInvite[];
  incomingInvites: IncomingInvite[];
  language: "vi" | "en";
};

function CopyButton({ text, vi }: { text: string; vi: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-all",
        copied
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary",
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          {vi ? "Đã sao chép" : "Copied"}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {vi ? "Sao chép" : "Copy"}
        </>
      )}
    </Button>
  );
}

export function InviteMemberSection({
  origin,
  outgoingInvites,
  incomingInvites,
  language,
}: Props) {
  const vi = language === "vi";

  // ── Invite form ─────────────────────────────────────────────────────────
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

  // ── Accept form ─────────────────────────────────────────────────────────
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

  return (
    <div className="space-y-6">
      {/* ── Send Invitation ─────────────────────────────────────────────── */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {vi ? "Mời thành viên" : "Invite member"}
            </Label>
            <p className="text-sm text-slate-600">
              {vi
                ? "Nhập email của người bạn muốn mời. Họ sẽ nhận được link để tham gia."
                : "Enter the email of the person you want to invite. They'll get a link to join."}
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
                  handleInviteSubmit(() => {
                    startInviteTransition(() =>
                      inviteAction(new FormData(e.currentTarget)),
                    );
                  })(e);
                }}
              >
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <RHFInput
                    name="email"
                    label={vi ? "Email người được mời" : "Invitee email"}
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
                    {vi ? "Gửi lời mời" : "Invite"}
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
                  <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    {vi ? "Link mời (gửi cho họ)" : "Invite link (share this)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 p-1.5 pl-3">
                  <p className="min-w-0 flex-1 truncate text-xs text-slate-500 font-mono">
                    {latestInviteLink}
                  </p>
                  <CopyButton text={latestInviteLink} vi={vi} />
                </div>
              </div>
            )}

            {outgoingInvites.length > 0 && (
              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {vi ? "Lời mời đang chờ" : "Pending invitations"}
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {outgoingInvites.map((invite) => {
                    const link = `${origin}/household?token=${invite.token}`;
                    return (
                      <Card
                        key={invite.id}
                        className="border-slate-100 bg-white shadow-xs"
                      >
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {invite.email}
                              </p>
                            </div>
                            <BadgeWithIcon
                              icon={Clock}
                              text={new Date(
                                invite.expires_at,
                              ).toLocaleDateString(vi ? "vi-VN" : "en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-100 p-1 pl-2">
                            <p className="min-w-0 flex-1 truncate text-[10px] text-slate-400 font-mono">
                              {link}
                            </p>
                            <CopyButton text={link} vi={vi} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Accept Invitation ───────────────────────────────────────────── */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {vi ? "Chấp nhận lời mời" : "Accept invitation"}
            </Label>
            <p className="text-sm text-slate-600">
              {vi
                ? "Nếu bạn nhận được link mời, dán token hoặc mở link để tham gia household."
                : "If you received an invite link, paste the token or open the link to join."}
            </p>
          </div>

          <div className="p-5 space-y-6">
            {incomingInvites.length > 0 && (
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {vi ? "Lời mời dành cho bạn" : "Invitations for you"}
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
                            {invite.households?.name ??
                              (vi
                                ? "Hộ gia đình không xác định"
                                : "Unknown household")}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500">
                            <Clock className="h-3 w-3" />
                            {vi ? "Hết hạn:" : "Expires:"}{" "}
                            {new Date(invite.expires_at).toLocaleDateString(
                              vi ? "vi-VN" : "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
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
                            ) : vi ? (
                              "Tham gia"
                            ) : (
                              "Join"
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
                  handleAcceptSubmit(() => {
                    startAcceptTransition(() =>
                      acceptAction(new FormData(e.currentTarget)),
                    );
                  })(e);
                }}
              >
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <RHFInput
                    name="token"
                    label={vi ? "Nhập token thủ công" : "Enter token manually"}
                    placeholder={
                      vi ? "Dán token vào đây..." : "Paste token here..."
                    }
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
                    {vi ? "Chấp nhận" : "Accept"}
                  </Button>
                </div>

                <FormStatus
                  message={acceptState.message}
                  status={acceptState.status}
                />
              </form>
            </FormProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BadgeWithIcon({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1">
      <Icon className="h-3 w-3 text-slate-400" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {text}
      </span>
    </div>
  );
}
