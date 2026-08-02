"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";

export function OpenAppButton() {
  const router = useRouter();
  const t = useTranslations("buttons");

  return (
    <Button
      variant="primary"
      size="md"
      className="min-w-40] px-(--space-6)"
      onPress={() => router.push(APP_PATH.WELCOME)}
    >
      {t("openApp")}
    </Button>
  );
}
