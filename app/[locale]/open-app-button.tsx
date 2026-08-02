"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";

export function OpenAppButton() {
  const router = useRouter();
  const t = useTranslations("buttons");

  return (
    <Button
      variant="primary"
      size="md"
      className="min-w-[10rem] px-(--space-6)"
      onPress={() => router.push("/welcome")}
    >
      {t("openApp")}
    </Button>
  );
}
