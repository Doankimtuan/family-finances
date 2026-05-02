import { formatVndCompact } from "@/lib/dashboard/format";
import { deleteJarLedgerEntryDirectAction } from "@/app/jars/actions";
import { Button } from "@/components/ui/button";

import { useI18n } from "@/lib/providers/i18n-provider";

type ActivityItem = {
  id: string;
  jar_name: string;
  entry_date: string;
  entry_type: "allocate" | "withdraw" | "adjust";
  amount: number;
  note: string | null;
};

type Props = {
  items: ActivityItem[];
  month: string;
  locale: string;
  language: string;
};

export function JarActivityList({ items, month, locale, language }: Props) {
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {t("jars.activity.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border p-3 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {item.jar_name} · {t(`jars.entry.${item.entry_type}`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.entry_date}
              {item.note ? ` · ${item.note}` : ""}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-bold">
              {item.entry_type === "withdraw" ? "-" : "+"}
              {formatVndCompact(item.amount, locale)}
            </p>
            <form action={deleteJarLedgerEntryDirectAction}>
              <input type="hidden" name="entryId" value={item.id} />
              <input type="hidden" name="month" value={month} />
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {t("common.delete")}
              </Button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
