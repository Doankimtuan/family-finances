"use client";

import { useActionState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { formatDate } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";

type QuantityRow = { id: string; as_of_date: string; quantity: number };
type PriceRow = { id: string; as_of_date: string; unit_price: number };

type QuantityTableProps = {
  assetId: string;
  rows: QuantityRow[];
  updateAction: (
    prev: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
};

type PriceTableProps = {
  assetId: string;
  rows: PriceRow[];
  updateAction: (
    prev: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
};

function EmptyRow({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={3} className="px-3 py-4 text-sm text-slate-500">
        {text}
      </td>
    </tr>
  );
}

export function QuantityHistoryTable({
  assetId,
  rows,
  updateAction,
}: QuantityTableProps) {
  const { locale, t } = useI18n();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("common.date")}
            </th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("assets.history.quantity")}
            </th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("common.action")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow
              text={t("assets.no_quantity_history")}
            />
          ) : (
            rows.map((row) => (
              <QuantityRowEditor
                key={row.id}
                assetId={assetId}
                row={row}
                updateAction={updateAction}
                locale={locale}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const quantityRowSchema = z.object({
  rowId: z.string(),
  assetId: z.string(),
  quantity: z.number().min(0, "Quantity must be non-negative"),
});

type QuantityRowFormValues = z.infer<typeof quantityRowSchema>;

function QuantityRowEditor({
  assetId,
  row,
  updateAction,
  locale,
}: {
  assetId: string;
  row: QuantityRow;
  updateAction: (
    prev: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
  locale: string;
}) {
  const { t } = useI18n();
  const [state, action, isPending] = useActionState<AssetActionState, FormData>(
    updateAction,
    initialAssetActionState,
  );

  const methods = useForm<QuantityRowFormValues>({
    resolver: zodResolver(quantityRowSchema),
    defaultValues: {
      rowId: row.id,
      assetId,
      quantity: row.quantity,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: QuantityRowFormValues) => {
    const formData = new FormData();
    formData.append("rowId", data.rowId);
    formData.append("assetId", data.assetId);
    formData.append("quantity", String(data.quantity));
    action(formData);
  };

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-700">
        {formatDate(row.as_of_date, locale)}
      </td>
      <td className="px-3 py-2">
        <FormProvider {...methods}>
          <form
            className="flex items-center gap-2"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <RHFInput
              name="quantity"
              label={t("assets.history.quantity")}
              hideLabel
              type="number"
              min="0"
              step="0.001"
              className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
            />
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {t("common.save")}
            </Button>
          </form>
        </FormProvider>
        {state.status === "error" && state.message ? (
          <p className="mt-1 text-xs text-rose-600">{state.message}</p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">
        {isPending ? t("common.updating") : ""}
      </td>
    </tr>
  );
}

export function PriceHistoryTable({
  assetId,
  rows,
  updateAction,
}: PriceTableProps) {
  const { locale, t } = useI18n();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("common.date")}
            </th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("assets.history.unit_price")}
            </th>
            <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("common.action")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow
              text={t("assets.no_price_history")}
            />
          ) : (
            rows.map((row) => (
              <PriceRowEditor
                key={row.id}
                assetId={assetId}
                row={row}
                updateAction={updateAction}
                locale={locale}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const priceRowSchema = z.object({
  rowId: z.string(),
  assetId: z.string(),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

type PriceRowFormValues = z.infer<typeof priceRowSchema>;

function PriceRowEditor({
  assetId,
  row,
  updateAction,
  locale,
}: {
  assetId: string;
  row: PriceRow;
  updateAction: (
    prev: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
  locale: string;
}) {
  const { t } = useI18n();
  const [state, action, isPending] = useActionState<AssetActionState, FormData>(
    updateAction,
    initialAssetActionState,
  );

  const methods = useForm<PriceRowFormValues>({
    resolver: zodResolver(priceRowSchema),
    defaultValues: {
      rowId: row.id,
      assetId,
      unitPrice: row.unit_price,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: PriceRowFormValues) => {
    const formData = new FormData();
    formData.append("rowId", data.rowId);
    formData.append("assetId", data.assetId);
    formData.append("unitPrice", String(data.unitPrice));
    action(formData);
  };

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-3 py-2 text-sm text-slate-700">
        {formatDate(row.as_of_date, locale)}
      </td>
      <td className="px-3 py-2">
        <FormProvider {...methods}>
          <form
            className="flex items-center gap-2"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="w-40">
              <RHFMoneyInput
                name="unitPrice"
                label={t("assets.history.unit_price")}
                hideLabel
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {t("common.save")}
            </Button>
          </form>
        </FormProvider>
        {state.status === "error" && state.message ? (
          <p className="mt-1 text-xs text-rose-600">{state.message}</p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">
        {isPending ? t("common.updating") : ""}
      </td>
    </tr>
  );
}
