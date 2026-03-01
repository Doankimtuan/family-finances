import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { SettingsNav } from "../_components/settings-nav";
import { InviteMemberSection } from "../_components/invite-member-section";

export const metadata = {
  title: "Members | Settings | Family Finances",
};

function getOriginFromHeaders(headerList: Headers): string {
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "family-finances-iota.vercel.app";
  return `${protocol}://${host}`;
}

export default async function SettingsMembersPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  // Fetch current members
  const membersResult = await supabase
    .from("household_members")
    .select("id, user_id, role, joined_at, profiles!user_id(full_name, email)")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });

  // Fetch pending outgoing invitations
  const pendingInvites = await supabase
    .from("household_invitations")
    .select("id, email, token, expires_at")
    .eq("household_id", householdId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch pending invites for THIS user's email (incoming)
  const incomingInvites = await supabase
    .from("household_invitations")
    .select("id, token, expires_at, households!household_id(name)")
    .eq("email", user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requestHeaders = await headers();
  const origin = getOriginFromHeaders(requestHeaders);

  type MemberRow = {
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
  };

  type InviteRow = {
    id: string;
    email: string;
    token: string;
    expires_at: string;
  };

  type IncomingInviteRow = {
    id: string;
    token: string;
    expires_at: string;
    households: { name: string } | null;
  };

  const members = ((membersResult.data as unknown) ?? []) as MemberRow[];
  const outgoingInvites = (pendingInvites.data ?? []) as unknown as InviteRow[];
  const incoming = ((incomingInvites.data as unknown) ??
    []) as IncomingInviteRow[];

  return (
    <AppShell
      header={
        <AppHeader title={`${t(language, "settings.title")} · Thành viên`} />
      }
      footer={<BottomTabBar />}
    >
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/members" />

        {/* Current Members */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {language === "vi" ? "Thành viên hiện tại" : "Current Members"}
              </p>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(m.profiles?.full_name ?? m.profiles?.email ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {m.profiles?.full_name ?? "—"}
                        {m.user_id === user.id && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {language === "vi" ? "Bạn" : "You"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.profiles?.email ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border rounded-full px-2 py-0.5">
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Invite Section (client component for copy/form) */}
        <InviteMemberSection
          origin={origin}
          outgoingInvites={outgoingInvites}
          incomingInvites={incoming}
          language={language}
        />
      </section>
    </AppShell>
  );
}
