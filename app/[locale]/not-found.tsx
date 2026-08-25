import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export default async function LocaleNotFound() {
  const tErrors = await getTranslations("errors");
  const tButtons = await getTranslations("buttons");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-(--space-4) px-(--space-6) text-center">
      <BrandMark variant="soft" size="md" />
      <Heading level={2}>{tErrors("notFound")}</Heading>
      <Text tone="secondary" size="sm" className="max-w-[16rem]">
        {tErrors("generic")}
      </Text>
      <Link
        href={APP_PATH.HOME}
        className="inline-flex min-h-11 items-center justify-center rounded-(--radius-control) bg-accent px-(--space-6) text-sm font-medium text-accent-fg transition-[background-color,transform] duration-(--duration-fast) ease-(--ease-standard) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        {tButtons("openApp")}
      </Link>
    </div>
  );
}
