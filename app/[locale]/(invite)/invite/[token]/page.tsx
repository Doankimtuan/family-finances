import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { routing } from "@/i18n/routing";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { getInvitationPreview } from "@/modules/tenancy/application/get-invitation-preview";
import { InviteAcceptScreen } from "./invite-accept-screen";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function InviteAcceptPage({ params }: Props) {
  const { locale: rawLocale, token } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const [user, previewResult] = await Promise.all([
    getSessionUser(),
    getInvitationPreview(token),
  ]);

  return (
    <InviteAcceptScreen
      token={token}
      preview={previewResult.ok ? previewResult.preview : null}
      isAuthenticated={Boolean(user)}
    />
  );
}
