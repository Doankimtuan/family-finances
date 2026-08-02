"use client";

import { useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { Link } from "@/i18n/navigation";

type Props = {
  q: string;
  type: string;
};

/**
 * Search + direction filter for money.transactions activity feed.
 */
export function TransactionsFilterBar({ q, type }: Props) {
  const t = useTranslations("money.transactionsPage");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const nextQ = String(data.get("q") ?? "").trim();
    const nextType = String(data.get("type") ?? "all");
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextType !== "all") params.set("type", nextType);
    const qs = params.toString();
    router.push(
      qs ? `${APP_PATH.MONEY_TRANSACTIONS}?${qs}` : APP_PATH.MONEY_TRANSACTIONS,
    );
  };

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-(--space-3)"
      data-testid="transactions-filter"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <TextField
        id="transactions-search"
        name="q"
        label={t("searchLabel")}
        defaultValue={q}
        placeholder={t("searchPlaceholder")}
        data-testid="transactions-search"
      />
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("filterLabel")}
        </legend>
        <div className="grid grid-cols-3 gap-(--space-2)">
          {(["all", "expense", "income"] as const).map((value) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-(--space-2) rounded-md border border-border-subtle bg-surface px-(--space-2) text-sm"
            >
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={type === value}
                className="size-4 accent-[var(--color-accent)]"
              />
              <Text size="sm">{t(`filters.${value}`)}</Text>
            </label>
          ))}
        </div>
      </fieldset>
      <Button variant="secondary" className="w-full" onPress={apply}>
        {t("applyFilter")}
      </Button>
      <Link
        href={APP_PATH.MONEY_ADD}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="transactions-add"
      >
        {t("add")}
      </Link>
    </form>
  );
}
