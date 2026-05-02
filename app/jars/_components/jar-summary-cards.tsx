import { formatVndCompact } from "@/lib/dashboard/format";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  totalAllocated: number;
  totalWithdrawn: number;
  netBalance: number;
  coveragePercent: number;
  locale: string;
  language: string;
};

export function JarSummaryCards({
  totalAllocated,
  totalWithdrawn,
  netBalance,
  coveragePercent,
  locale,
  language,
}: Props) {
  const { t } = useI18n();

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {t("jars.summary.allocated")}
          </Label>
          <p className="text-lg font-bold text-emerald-600">
            {formatVndCompact(totalAllocated, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {t("jars.summary.withdrawn")}
          </Label>
          <p className="text-lg font-bold text-amber-600">
            {formatVndCompact(totalWithdrawn, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {t("jars.summary.net")}
          </Label>
          <p className="text-lg font-bold text-primary">
            {formatVndCompact(netBalance, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {t("jars.summary.coverage")}
          </Label>
          <p className="text-lg font-bold">{Math.round(coveragePercent)}%</p>
        </CardContent>
      </Card>
    </section>
  );
}
