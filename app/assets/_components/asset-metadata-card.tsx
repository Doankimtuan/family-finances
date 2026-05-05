import { Card, CardContent } from "@/components/ui/card";
import type { AssetClassConfig } from "@/lib/assets/class-config";

type AssetMetadataCardProps = {
  classConfig: AssetClassConfig;
  assetMetadata: Record<string, unknown>;
  riskLabel: string | null;
  t: (key: string) => string;
};

export function AssetMetadataCard({
  classConfig,
  assetMetadata,
  riskLabel,
  t,
}: AssetMetadataCardProps) {
  if (
    classConfig.metadataFields.length === 0 ||
    Object.keys(assetMetadata).length === 0
  ) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-800">
          {t("assets.details_title")}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {classConfig.metadataFields.map((field) => {
            const val = assetMetadata[field.key];
            if (val === undefined || val === null || val === "") return null;
            let display = String(val);
            if (field.type === "select" && field.options) {
              const opt = field.options.find((o) => o.value === val);
              if (opt) display = t(opt.labelKey);
            }
            if (field.type === "boolean") {
              display =
                val === true || val === "true"
                  ? t("common.yes")
                  : t("common.no");
            }
            return (
              <div key={field.key}>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {t(field.labelKey)}
                </p>
                <p className="text-sm text-slate-800 mt-0.5">{display}</p>
              </div>
            );
          })}
        </div>
        {riskLabel && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {t("assets.risk_level")}
            </p>
            <p className="text-sm text-slate-800 mt-0.5">{riskLabel}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
