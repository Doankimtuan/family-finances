import {
  RecommendationReasonCode,
  MaturityWarningCode,
  type RecommendationReasonCode as ReasonCode,
} from "./savings-constants";
import type {
  PackageRecommendation,
  MaturityWarning,
  SavingPackage,
} from "./savings-types";

export type RecommendPackagesInput = {
  currentPackageName: string;
  currentDurationDays: number;
  currentRate: number;
  preferredPackageId: string | null;
  catalog: SavingPackage[];
};

export type RecommendPackagesResult = {
  recommendations: PackageRecommendation[];
  warnings: MaturityWarning[];
  preferredPackageActive: boolean;
  preferredPackage: SavingPackage | null;
};

/**
 * Informational package recommendation engine.
 * Never switches packages automatically.
 */
export function recommendPackages(
  input: RecommendPackagesInput,
): RecommendPackagesResult {
  const active = input.catalog.filter(
    (p) => p.isActive && p.renewableAvailable,
  );
  const warnings: MaturityWarning[] = [];

  let preferredPackage: SavingPackage | null = null;
  let preferredPackageActive = true;

  if (input.preferredPackageId) {
    preferredPackage =
      input.catalog.find((p) => p.id === input.preferredPackageId) ?? null;
    if (!preferredPackage || !preferredPackage.isActive) {
      preferredPackageActive = false;
      warnings.push({ code: MaturityWarningCode.PACKAGE_UNAVAILABLE });
      preferredPackage = null;
    } else {
      if (
        Math.abs(preferredPackage.annualInterestRate - input.currentRate) >
        0.0001
      ) {
        warnings.push({ code: MaturityWarningCode.RATE_CHANGED });
      }
    }
  }

  const scored = active.map((pkg) => {
    const rateDifference = pkg.annualInterestRate - input.currentRate;
    const durationDeltaDays = pkg.durationDays - input.currentDurationDays;
    let reasonCode: ReasonCode = RecommendationReasonCode.HIGHER_RETURN;
    if (rateDifference > 0 && durationDeltaDays <= 0) {
      reasonCode = RecommendationReasonCode.BETTER_LIQUIDITY;
    } else if (rateDifference > 0 && durationDeltaDays > 0) {
      reasonCode = RecommendationReasonCode.LONGER_DURATION;
    } else if (rateDifference > 0) {
      reasonCode = RecommendationReasonCode.HIGHER_RETURN;
    } else if (durationDeltaDays < 0) {
      reasonCode = RecommendationReasonCode.BETTER_LIQUIDITY;
    } else {
      reasonCode = RecommendationReasonCode.LONGER_DURATION;
    }

    const score =
      rateDifference * 10 +
      (durationDeltaDays < 0 ? 0.5 : 0) +
      (pkg.id === input.preferredPackageId ? 5 : 0);

    const recommendation: PackageRecommendation = {
      packageId: pkg.id,
      packageName: pkg.packageName,
      durationDays: pkg.durationDays,
      annualRate: pkg.annualInterestRate,
      rateDifference,
      durationDeltaDays,
      reasonCode,
    };
    return { score, recommendation };
  });

  scored.sort((a, b) => b.score - a.score);

  if (!preferredPackageActive && active.length > 0) {
    // Ensure top alternatives carry unavailable reason context on first item
    if (scored[0]) {
      scored[0].recommendation = {
        ...scored[0].recommendation,
        reasonCode: RecommendationReasonCode.PACKAGE_UNAVAILABLE,
      };
    }
  }

  return {
    recommendations: scored.slice(0, 5).map((s) => s.recommendation),
    warnings,
    preferredPackageActive,
    preferredPackage,
  };
}
