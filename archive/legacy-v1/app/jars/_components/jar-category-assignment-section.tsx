"use client";

import { JarCategoryAssignmentMatrix } from "./jar-category-assignment-matrix";
import { useCategoryAssignmentDraft } from "../_lib/hooks/use-category-assignment-draft";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  categories: { id: string; name: string }[];
  jars: { id: string; name: string }[];
  rules: Map<string, string>;
  householdId: string;
  returnTo: string;
};

export function JarCategoryAssignmentSection({
  categories,
  jars,
  rules,
  householdId,
  returnTo,
}: Props) {
  const { t } = useI18n();
  const initialRules = Array.from(rules.entries()).map(([categoryId, jarId]) => ({
    categoryId,
    jarId,
  }));

  const {
    draftRules,
    isDirty,
    isSaving,
    error,
    success,
    updateDraft,
    resetDraft,
    saveDraft,
  } = useCategoryAssignmentDraft(initialRules, householdId, returnTo);

  const handleAssign = (categoryId: string, jarId: string) => {
    updateDraft(categoryId, jarId);
  };

  const handleUnassign = (categoryId: string) => {
    updateDraft(categoryId, "");
  };

  const currentAssignments = Array.from(draftRules.entries())
    .filter(([_, jarId]) => jarId)
    .map(([categoryId, jarId]) => ({
      categoryId,
      jarId,
      lastUpdated: new Date().toISOString().split("T")[0],
    }));

  return (
    <div className="space-y-4">
      <JarCategoryAssignmentMatrix
        categories={categories}
        jars={jars}
        currentAssignments={currentAssignments}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />

      {isDirty && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={saveDraft}
            disabled={isSaving}
            className="rounded-xl"
          >
            {isSaving ? t("common.saving") : t("common.save_changes")}
          </Button>
          <Button
            onClick={resetDraft}
            disabled={isSaving}
            variant="outline"
            className="rounded-xl"
          >
            {t("common.reset")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-rose-50 px-4 py-2 text-sm text-rose-900">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          Rules saved successfully
        </div>
      )}
    </div>
  );
}
