import type { ElementType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SummaryCardProps {
  title: string;
  value: string;
  helper: string;
}

export function SummaryCard({ title, value, helper }: SummaryCardProps) {
  return (
    <Card className="border-border/60 bg-white/90">
      <CardContent className="p-4">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          {title}
        </Label>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  );
}
