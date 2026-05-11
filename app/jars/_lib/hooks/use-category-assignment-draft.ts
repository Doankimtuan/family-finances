"use client";

import { useState, useCallback, useTransition } from "react";

import { bulkUpsertJarCategoryRulesAction } from "@/app/jars/domain-actions";
import { objectToFormDataUnfiltered } from "../form-helpers";

type CategoryRule = {
  categoryId: string;
  jarId: string;
};

type DraftState = {
  rules: Map<string, string>; // categoryId -> jarId
  originalRules: Map<string, string>;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
};

/**
 * Hook for managing draft category-to-jar assignments with optimistic updates.
 * 
 * - Maintains local draft state separate from server state
 * - Supports optimistic UI updates
 * - Handles rollback on save failure
 * - Provides save function that calls bulkUpsertJarCategoryRulesAction
 */
export function useCategoryAssignmentDraft(initialRules: CategoryRule[], householdId: string, returnTo: string) {
  const [state, setState] = useState<DraftState>({
    rules: new Map(initialRules.map((r) => [r.categoryId, r.jarId])),
    originalRules: new Map(initialRules.map((r) => [r.categoryId, r.jarId])),
    isDirty: false,
    isSaving: false,
    error: null,
    success: false,
  });

  const [isPending, startTransition] = useTransition();

  const updateDraft = useCallback((categoryId: string, jarId: string) => {
    setState((prev) => {
      const newRules = new Map(prev.rules);
      newRules.set(categoryId, jarId);
      return {
        ...prev,
        rules: newRules,
        isDirty: true,
        error: null,
        success: false,
      };
    });
  }, []);

  const resetDraft = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rules: new Map(prev.originalRules),
      isDirty: false,
      error: null,
      success: false,
    }));
  }, []);

  const saveDraft = useCallback(async () => {
    if (!state.isDirty) return;

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    startTransition(async () => {
      try {
        const rules = Array.from(state.rules.entries()).map(([categoryId, jarId]) => ({
          categoryId,
          jarId,
        }));

        const formData = objectToFormDataUnfiltered({
          rulesJson: JSON.stringify(rules),
          returnTo,
        });

        await bulkUpsertJarCategoryRulesAction(formData);

        setState((prev) => ({
          ...prev,
          isSaving: false,
          isDirty: false,
          originalRules: new Map(state.rules),
          success: true,
          error: null,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          rules: new Map(prev.originalRules),
          isDirty: false,
          error: err instanceof Error ? err.message : "Failed to save category rules",
        }));
      }
    });
  }, [state.isDirty, state.rules, returnTo]);

  const getJarIdForCategory = useCallback((categoryId: string) => {
    return state.rules.get(categoryId);
  }, [state.rules]);

  return {
    draftRules: state.rules,
    isDirty: state.isDirty,
    isSaving: state.isSaving || isPending,
    error: state.error,
    success: state.success,
    updateDraft,
    resetDraft,
    saveDraft,
    getJarIdForCategory,
  };
}
