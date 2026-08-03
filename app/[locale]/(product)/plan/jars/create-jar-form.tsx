"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  JarKind,
  JAR_KIND_VALUES,
  type JarKind as JarKindValue,
} from "@/modules/plan/application/client";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createJarAction } from "./actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
const KINDS = JAR_KIND_VALUES;

export function CreateJarForm() {
  const t = useTranslations("plan.jars");
  const router = useRouter();
  const nameId = useId();
  const kindId = useId();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<JarKindValue>(JarKind.SPENDING);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="jar-create-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          setErrorCode(null);
          setOpen(true);
        }}
      >
        {online ? t("create") : t("errors.offline")}
      </Button>
    );
  }

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await createJarAction({ name: name.trim(), kind });
      if (result.status === "success") {
        setOpen(false);
        setName("");
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="jar-create-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("create")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <TextField
        id={nameId}
        label={t("createNameLabel")}
        placeholder={t("createNamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="flex flex-col gap-(--space-2)" htmlFor={kindId}>
        <span className="text-sm font-medium text-text-primary">
          {t("createKindLabel")}
        </span>
        <select
          id={kindId}
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          value={kind}
          onChange={(e) => setKind(e.target.value as JarKind)}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`kinds.${k}`)}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="primary"
        className="w-full"
        data-testid="jar-create-submit"
        isDisabled={isPending || !online || name.trim().length < 2}
        onPress={onSubmit}
      >
        {t("createSubmit")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => setOpen(false)}
      >
        {t("createCancel")}
      </Button>
    </div>
  );
}
