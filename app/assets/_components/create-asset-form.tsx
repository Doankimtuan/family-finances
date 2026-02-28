"use client";

import { useActionState, useTransition, useEffect } from "react";

import { createAssetAction } from "@/app/assets/actions";
import { toast } from "sonner";
import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateAssetForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<AssetActionState, FormData>(
    createAssetAction,
    initialAssetActionState,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="name">{t("assets.name")}</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={t("assets.placeholder_name")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="assetClass">{t("assets.class")}</Label>
          <Select name="assetClass" defaultValue="gold">
            <SelectTrigger
              id="assetClass"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue placeholder={t("assets.class")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">{t("assets.class.gold")}</SelectItem>
              <SelectItem value="mutual_fund">
                {t("assets.class.mutual_fund")}
              </SelectItem>
              <SelectItem value="real_estate">
                {t("assets.class.real_estate")}
              </SelectItem>
              <SelectItem value="savings_deposit">
                {t("assets.class.savings_deposit")}
              </SelectItem>
              <SelectItem value="stock">{t("assets.class.stock")}</SelectItem>
              <SelectItem value="crypto">{t("assets.class.crypto")}</SelectItem>
              <SelectItem value="other">{t("assets.class.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="unitLabel">{t("assets.unit_label")}</Label>
          <Input
            id="unitLabel"
            name="unitLabel"
            defaultValue={t("assets.placeholder_unit")
              ?.split(",")[0]
              ?.replace("e.g. ", "")
              ?.replace("VD: ", "")}
            placeholder={t("assets.placeholder_unit")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="quantity">{t("assets.quantity")}</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.001"
            defaultValue="1"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="unitPrice">{t("assets.unit_price")}</Label>
          <MoneyInput
            id="unitPrice"
            name="unitPrice"
            defaultValue={0}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="isLiquid">{t("assets.liquidity")}</Label>
        <Select name="isLiquid" defaultValue="true">
          <SelectTrigger
            id="isLiquid"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
          >
            <SelectValue placeholder={t("assets.liquidity")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t("assets.liquid")}</SelectItem>
            <SelectItem value="false">{t("assets.illiquid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending} className="w-full rounded-xl">
        {isPending ? t("assets.saving") : t("assets.create")}
      </Button>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
