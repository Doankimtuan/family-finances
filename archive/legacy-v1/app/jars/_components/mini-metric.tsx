import type { ElementType } from "react";
import { Label } from "@/components/ui/label";

interface MiniMetricProps {
  icon: ElementType;
  label: string;
  value: string;
}

export function MiniMetric({ icon: Icon, label, value }: MiniMetricProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <Label className="text-xs font-medium cursor-default">{label}</Label>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
