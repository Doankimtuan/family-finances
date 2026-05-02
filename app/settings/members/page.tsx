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
  const vi = language === "vi";

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

        {/* Current Members */}
        <Card className="border-violet-100 shadow-sm overflow-hidden">
          <CardHeader className="p-0">
            <div className="p-5 border-b border-violet-50 bg-violet-50/30">
              <SectionHeader
                label={vi ? "Thành viên" : "Members"}
                title={vi ? "Thành viên gia đình" : "Household Members"}
                description={
                  vi
                    ? "Danh sách những người có quyền truy cập vào hộ gia đình này."
                    : "People who have access to this shared household."
                }
                icon={<Users className="h-4 w-4 text-violet-600" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {Array.isArray(members) && members.length > 0 ? (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-lg font-bold text-primary">
                      {(m.profiles?.full_name ?? m.profiles?.email ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-900 truncate">
                          {m.profiles?.full_name ?? "—"}
                        </p>
                        {m.user_id === user.id && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-[10px] font-bold border-none uppercase tracking-widest px-2"
                          >
                            {vi ? "Bạn" : "You"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {m.profiles?.email ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <Shield className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {m.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">
                    {vi
                      ? "Chưa có thành viên nào trong hộ gia đình."
                      : "No members in this household yet."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invite Section (client component for copy/form) */}
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
