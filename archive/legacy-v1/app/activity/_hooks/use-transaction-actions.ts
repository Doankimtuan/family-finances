"use client";

import { useTransition, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/providers/i18n-provider";
import { toast } from "sonner";
import {
  updateTransactionAction,
  deleteTransactionAction,
} from "@/app/activity/actions";
import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/activity/action-types";
import { transactionKeys } from "@/lib/queries/keys";

export function useTransactionActions() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [updateState, setUpdateState] = useState<TransactionActionState>(
    initialTransactionActionState,
  );
  const [deleteState, setDeleteState] = useState<TransactionActionState>(
    initialTransactionActionState,
  );

  const updateTransaction = (
    formData: FormData,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      const result = await updateTransactionAction(updateState, formData);
      setUpdateState(result);
      if (result.status === "success") {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
        onSuccess?.();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  const deleteTransaction = (
    formData: FormData,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      const result = await deleteTransactionAction(deleteState, formData);
      setDeleteState(result);
      if (result.status === "success") {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
        onSuccess?.();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return {
    updateTransaction,
    deleteTransaction,
    isPending,
    updateError: updateState.status === "error" ? updateState.message : null,
    deleteError: deleteState.status === "error" ? deleteState.message : null,
  };
}
