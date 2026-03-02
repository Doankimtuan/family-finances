import { formatVndCompact } from "@/lib/dashboard/format";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  totalAllocated: number;
  totalWithdrawn: number;
  netBalance: number;
  coveragePercent: number;
  locale: string;
  vi: boolean;
};

export function JarSummaryCards({
  totalAllocated,
  totalWithdrawn,
  netBalance,
  coveragePercent,
  locale,
  vi,
}: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            {vi ? "Đã phân bổ" : "Allocated"}
          </p>
          <p className="text-lg font-bold text-emerald-600">
            {formatVndCompact(totalAllocated, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            {vi ? "Đã rút" : "Withdrawn"}
          </p>
          <p className="text-lg font-bold text-amber-600">
            {formatVndCompact(totalWithdrawn, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            {vi ? "Số dư hũ" : "Jar Net"}
          </p>
          <p className="text-lg font-bold text-primary">
            {formatVndCompact(netBalance, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            {vi ? "Đạt mục tiêu" : "Coverage"}
          </p>
          <p className="text-lg font-bold">{Math.round(coveragePercent)}%</p>
        </CardContent>
      </Card>
    </section>
  );
}
