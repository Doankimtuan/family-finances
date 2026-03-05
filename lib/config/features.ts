function readBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) return defaultValue;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

export type FeatureKey =
  | "jars"
  | "cashflowForecast"
  | "insights"
  | "financialHealth";

export function getFeatureFlags() {
  return {
    jars: readBool(process.env.NEXT_PUBLIC_FEATURE_JARS_ENABLED, false),
    cashflowForecast: readBool(
      process.env.NEXT_PUBLIC_FEATURE_CASHFLOW_FORECAST_ENABLED,
      false,
    ),
    insights: readBool(process.env.NEXT_PUBLIC_FEATURE_INSIGHTS_ENABLED, false),
    financialHealth: readBool(
      process.env.NEXT_PUBLIC_FEATURE_FINANCIAL_HEALTH_ENABLED,
      false,
    ),
  } as const;
}

export function isFeatureEnabled(key: FeatureKey): boolean {
  return getFeatureFlags()[key];
}

export function isServerFeatureEnabled(key: FeatureKey): boolean {
  const privateVarMap: Record<FeatureKey, string | undefined> = {
    jars: process.env.FEATURE_JARS_ENABLED,
    cashflowForecast: process.env.FEATURE_CASHFLOW_FORECAST_ENABLED,
    insights: process.env.FEATURE_INSIGHTS_ENABLED,
    financialHealth: process.env.FEATURE_FINANCIAL_HEALTH_ENABLED,
  };

  const privateValue = privateVarMap[key];
  if (privateValue !== undefined) {
    return readBool(privateValue, false);
  }

  return isFeatureEnabled(key);
}
