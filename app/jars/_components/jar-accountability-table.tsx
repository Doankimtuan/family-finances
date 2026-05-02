import { formatVndCompact } from "@/lib/dashboard/format";
import { runJarReconciliationDirectAction } from "@/app/jars/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useI18n } from "@/lib/providers/i18n-provider";

type Row = {
  id: string;
  category_name: string;
  jar_name: string;
  actual_amount: number;
  allocated_amount: number;
  gap_amount: number;
};

type Props = {
  rows: Row[];
  month: string;
  locale: string;
  language: string;
};

export function JarAccountabilityTable({ rows, month, locale, language }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-muted-foreground font-normal">
          {t("jars.accountability.description")}
        </Label>
        <form action={runJarReconciliationDirectAction}>
          <input type="hidden" name="month" value={month} />
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="text-xs h-8"
          >
            {t("common.refresh")}
          </Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          {t("jars.accountability.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">{t("common.category")}</th>
                <th className="px-3 py-2 font-semibold">{t("common.jar")}</th>
                <th className="px-3 py-2 font-semibold">{t("jars.accountability.actual")}</th>
                <th className="px-3 py-2 font-semibold">{t("jars.summary.allocated")}</th>
                <th className="px-3 py-2 font-semibold">{t("jars.accountability.gap")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const gapClass =
                  row.gap_amount > 0
                    ? "text-destructive"
                    : row.gap_amount < 0
                      ? "text-emerald-600"
                      : "text-muted-foreground";

                return (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">{row.category_name}</td>
                    <td className="px-3 py-2">{row.jar_name}</td>
                    <td className="px-3 py-2 font-medium">
                      {formatVndCompact(row.actual_amount, locale)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {formatVndCompact(row.allocated_amount, locale)}
                    </td>
                    <td className={`px-3 py-2 font-semibold ${gapClass}`}>
                      {formatVndCompact(row.gap_amount, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
