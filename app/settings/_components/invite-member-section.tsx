"use client";

import {
  useActionState,
  useTransition,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Copy,
  Check,
  Mail,
  Loader2,
  UserPlus,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  inviteMemberAction,
  acceptInviteAction,
} from "@/app/household/actions";
import {
  initialHouseholdActionState,
  type HouseholdActionState,
} from "@/app/household/action-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all",
        copied
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Đã sao chép
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
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
  const [inviteState, inviteAction] = useActionState<
    HouseholdActionState,
    FormData
  >(inviteMemberAction, initialHouseholdActionState);
  const [invitePending, startInviteTransition] = useTransition();
  const inviteFormRef = useRef<HTMLFormElement>(null);

  // Extract token from success message for display
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null);
  const prevInviteStatus = useRef(inviteState.status);

  useEffect(() => {
    if (
      inviteState.status === "success" &&
      inviteState.status !== prevInviteStatus.current
    ) {
      // Extract token from success message: "Invitation created. Share token: <token>"
      const match = /Share token:\s*(\S+)/.exec(inviteState.message ?? "");
      if (match?.[1]) {
        const link = `${origin}/household?token=${match[1]}`;
        queueMicrotask(() => setLatestInviteLink(link));
      }
      inviteFormRef.current?.reset();
    }
    prevInviteStatus.current = inviteState.status;
  }, [inviteState, origin]);

  // ── Accept form ─────────────────────────────────────────────────────────
  const [acceptState, acceptAction] = useActionState<
    HouseholdActionState,
    FormData
  >(acceptInviteAction, initialHouseholdActionState);
  const [acceptPending, startAcceptTransition] = useTransition();

  return (
    <>
      {/* ── Send Invitation ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {vi ? "Mời thành viên" : "Invite member"}
            </p>
            <p className="text-sm text-muted-foreground">
              {vi
                ? "Nhập email của người bạn muốn mời. Họ sẽ nhận được link để tham gia."
                : "Enter the email of the person you want to invite. They'll get a link to join."}
            </p>
          </div>

          <form
            ref={inviteFormRef}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startInviteTransition(() => inviteAction(fd));
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-bold">
                {vi ? "Email người được mời" : "Invitee email"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="partner@example.com"
                  className="flex-1 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={invitePending}
                  className="shrink-0 gap-2 rounded-xl"
                >
                  {invitePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {vi ? "Gửi lời mời" : "Invite"}
                </Button>
              </div>
            </div>

            {inviteState.status === "error" && inviteState.message && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-sm text-rose-700 dark:text-rose-400">
                  {inviteState.message}
                </p>
              </div>
            )}

            {inviteState.status === "success" && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {vi ? "Đã tạo lời mời thành công!" : "Invitation created!"}
                </p>
              </div>
            )}
          </form>

          {/* Latest invite link */}
          {latestInviteLink && (
            <div className="rounded-xl border bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                <p className="text-xs font-bold text-violet-700 dark:text-violet-400">
                  {vi ? "Link mời (gửi cho họ)" : "Invite link (share this)"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate rounded-lg bg-background border px-2.5 py-1.5 text-xs text-muted-foreground font-mono">
                  {latestInviteLink}
                </p>
                <CopyButton text={latestInviteLink} />
              </div>
            </div>
          )}

          {/* Pending outgoing invites */}
          {outgoingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {vi ? "Lời mời đang chờ" : "Pending invitations"}
              </p>
              <ul className="space-y-2">
                {outgoingInvites.map((invite) => {
                  const link = `${origin}/household?token=${invite.token}`;
                  return (
                    <li
                      key={invite.id}
                      className="rounded-xl border bg-muted/30 px-3 py-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <p className="text-sm font-semibold text-foreground truncate">
                            {invite.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(invite.expires_at).toLocaleDateString(
                            vi ? "vi-VN" : "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate rounded-lg bg-background border px-2 py-1 text-[10px] text-muted-foreground font-mono">
                          {link}
                        </p>
                        <CopyButton text={link} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Accept Invitation ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {vi ? "Chấp nhận lời mời" : "Accept invitation"}
            </p>
            <p className="text-sm text-muted-foreground">
              {vi
                ? "Nếu bạn nhận được link mời, dán token hoặc mở link để tham gia household."
                : "If you received an invite link, paste the token or open the link to join."}
            </p>
          </div>

          {/* Incoming invites (auto-listed) */}
          {incomingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {vi ? "Lời mời dành cho bạn" : "Invitations for you"}
              </p>
              <ul className="space-y-2">
                {incomingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-3"
                  >
                    <UserPlus className="h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {invite.households?.name ?? "Unknown household"}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {vi ? "Hết hạn:" : "Expires:"}{" "}
                        {new Date(invite.expires_at).toLocaleDateString(
                          vi ? "vi-VN" : "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    </div>
                    <form
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
                        className="rounded-xl bg-amber-500 text-white hover:bg-amber-600 shrink-0"
                      >
                        {acceptPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : vi ? (
                          "Tham gia"
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manual token input */}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startAcceptTransition(() => acceptAction(fd));
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="invite-token" className="text-xs font-bold">
                {vi ? "Nhập token thủ công" : "Enter token manually"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="invite-token"
                  name="token"
                  type="text"
                  placeholder={
                    vi ? "Dán token vào đây..." : "Paste token here..."
                  }
                  className="flex-1 rounded-xl font-mono text-xs"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={acceptPending}
                  className="shrink-0 gap-2 rounded-xl"
                >
                  {acceptPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {vi ? "Chấp nhận" : "Accept"}
                </Button>
              </div>
            </div>

            {acceptState.status === "error" && acceptState.message && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-sm text-rose-700 dark:text-rose-400">
                  {acceptState.message}
                </p>
              </div>
            )}

            {acceptState.status === "success" && acceptState.message && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {vi
                    ? "Đã tham gia household thành công!"
                    : "Successfully joined the household!"}
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
