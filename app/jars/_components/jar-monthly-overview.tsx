import { formatVndCompact } from "@/lib/dashboard/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { archiveJarDirectAction } from "@/app/jars/actions";

import { JarTargetForm } from "./jar-target-form";
import { JarAllocateWithdrawForm } from "./jar-allocate-withdraw-form";
import { JarEditForm } from "./jar-edit-form";

type JarRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
};

type OverviewRow = {
  jar_id: string;
  target_amount: number;
  allocated_amount: number;
  withdrawn_amount: number;
  net_amount: number;
  coverage_ratio: number;
  jar_coverage_ratio_percent: number | null;
};

type TargetRow = {
  jar_id: string;
  target_mode: "fixed" | "percent";
  target_value: number;
};

type Props = {
  jars: JarRow[];
  overviewMap: Map<string, OverviewRow>;
  targetMap: Map<string, TargetRow>;
  month: string;
  locale: string;
  vi: boolean;
};

export function JarMonthlyOverview({
  jars,
  overviewMap,
  targetMap,
  month,
  locale,
  vi,
}: Props) {
  if (jars.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {vi ? "Chưa có hũ nào. Hãy tạo hũ đầu tiên bên dưới." : "No jars yet. Create your first jar below."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jars.map((jar) => {
        const ov = overviewMap.get(jar.id);
        const target = targetMap.get(jar.id);
        const coverage = Math.round(Number(ov?.coverage_ratio ?? 0) * 100);
        const essentialsCoverage = Number(ov?.jar_coverage_ratio_percent);
        const showEssentialsWarning =
          jar.slug === "necessities"
          && Number.isFinite(essentialsCoverage)
          && essentialsCoverage < 100;

        return (
          <Card key={jar.id} className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-base">{jar.name}</h3>
                <div className="flex items-center gap-2">
                  {showEssentialsWarning ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      {vi ? "Thiếu quỹ thiết yếu" : "Essentials underfunded"}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{coverage}%</span>
                  <form action={archiveJarDirectAction}>
                    <input type="hidden" name="jarId" value={jar.id} />
                    <button
                      className="text-xs text-destructive hover:underline"
                      type="submit"
                    >
                      {vi ? "Lưu trữ" : "Archive"}
                    </button>
                  </form>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, coverage))}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <JarEditForm
                jarId={jar.id}
                defaultName={jar.name}
                defaultColor={jar.color}
                defaultIcon={jar.icon}
                vi={vi}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    {vi ? "Mục tiêu" : "Target"}
                  </p>
                  <p className="font-semibold">
                    {formatVndCompact(Number(ov?.target_amount ?? 0), locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    {vi ? "Phân bổ" : "Allocated"}
                  </p>
                  <p className="font-semibold text-emerald-600">
                    {formatVndCompact(Number(ov?.allocated_amount ?? 0), locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    {vi ? "Rút" : "Withdrawn"}
                  </p>
                  <p className="font-semibold text-amber-600">
                    {formatVndCompact(Number(ov?.withdrawn_amount ?? 0), locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    {vi ? "Số dư" : "Net"}
                  </p>
                  <p className="font-semibold">
                    {formatVndCompact(Number(ov?.net_amount ?? 0), locale)}
                  </p>
                </div>
              </div>

              <JarTargetForm
                jarId={jar.id}
                month={month}
                defaultMode={target?.target_mode ?? "fixed"}
                defaultValue={Number(target?.target_value ?? 0)}
                vi={vi}
              />

              <JarAllocateWithdrawForm jarId={jar.id} month={month} vi={vi} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
