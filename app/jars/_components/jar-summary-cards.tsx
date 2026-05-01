import { formatVndCompact } from "@/lib/dashboard/format";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {vi ? "Đã phân bổ" : "Allocated"}
          </Label>
          <p className="text-lg font-bold text-emerald-600">
            {formatVndCompact(totalAllocated, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {vi ? "Đã rút" : "Withdrawn"}
          </Label>
          <p className="text-lg font-bold text-amber-600">
            {formatVndCompact(totalWithdrawn, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {vi ? "Số dư hũ" : "Jar Net"}
          </Label>
          <p className="text-lg font-bold text-primary">
            {formatVndCompact(netBalance, locale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
            {vi ? "Đạt mục tiêu" : "Coverage"}
          </Label>
          <p className="text-lg font-bold">{Math.round(coveragePercent)}%</p>
        </CardContent>
      </Card>
    </section>
  );
}
