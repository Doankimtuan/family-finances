import { headers } from "next/headers";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { t } from "@/lib/i18n/dictionary";
import { getSettingsDataContext } from "@/lib/server/settings-data";
import { Shield, Users } from "lucide-react";

import { InviteMemberSection } from "../_components/invite-member-section";
import { SettingsNav } from "../_components/settings-nav";

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
  const { user, language, members, pendingInvites, incomingInvites } =
    await getSettingsDataContext(false, false, false, true);

  const requestHeaders = await headers();
  const origin = getOriginFromHeaders(requestHeaders);

  return (
    <AppShell
      header={
        <AppHeader
          title={`${t(language, "settings.title")} / ${t(language, "settings.members")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SettingsNav currentPath="/settings/members" />

        <Card className="border-violet-100 shadow-sm overflow-hidden">
          <CardHeader className="p-0">
            <div className="p-5 border-b border-violet-50 bg-violet-50/30">
              <SectionHeader
                label={t(language, "settings.members_label")}
                title={t(language, "settings.household_members")}
                description={t(language, "settings.members_description")}
                icon={<Users className="h-4 w-4 text-violet-600" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!members || members.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                {t(language, "settings.no_members")}
              </p>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                        {(member.user_id.slice(0, 2).toUpperCase())}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {member.user_id === user.id
                            ? t(language, "settings.you")
                            : member.profiles?.full_name || "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(member.joined_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {member.user_id === user.id && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-[10px] font-bold border-none uppercase tracking-widest px-2"
                      >
                        {t(language, "settings.you")}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <Shield className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {member.role}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <InviteMemberSection
          origin={origin}
          outgoingInvites={pendingInvites || []}
          incomingInvites={incomingInvites || []}
          language={language}
        />
      </div>
    </AppShell>
  );
}
