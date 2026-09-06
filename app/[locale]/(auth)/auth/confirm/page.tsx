import { redirect } from "next/navigation";
import { ConfirmScreen } from "./confirm-screen";
import {
  AUTH_ADAPTER_CONFIRM_PATH,
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_CONFIRM_STATUS,
} from "@/modules/tenancy/application/auth-constants";

type Props = {
  searchParams: Promise<{
    status?: string;
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
    next?: string;
  }>;
};

/**
 * Locale confirm UI. Exchangeable OAuth/OTP params belong on `/auth/confirm`
 * (route handler). If they land here (misconfigured redirect / old link),
 * bounce to the adapter. Bare visits without status fail closed — never spin forever.
 */
export default async function AuthConfirmPage({ searchParams }: Props) {
  const params = await searchParams;

  const hasExchangePayload = Boolean(
    params.code ||
    (params.token_hash && params.type) ||
    params.error ||
    params.error_code ||
    params.error_description,
  );

  const isResolvedStatus =
    params.status === AUTH_CONFIRM_STATUS.ERROR ||
    params.status === AUTH_CONFIRM_STATUS.OK;

  if (hasExchangePayload && !isResolvedStatus) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value.length > 0) {
        qs.set(key, value);
      }
    }
    redirect(`${AUTH_ADAPTER_CONFIRM_PATH}?${qs.toString()}`);
  }

  const statusParam = params.status;
  const status =
    statusParam === AUTH_CONFIRM_STATUS.OK ||
    statusParam === AUTH_CONFIRM_STATUS.ERROR
      ? statusParam
      : AUTH_CONFIRM_STATUS.ERROR;
  const code =
    statusParam === AUTH_CONFIRM_STATUS.OK ||
    statusParam === AUTH_CONFIRM_STATUS.ERROR
      ? params.code
      : (params.code ?? AUTH_CONFIRM_ERROR_CODE.INVALID);

  return <ConfirmScreen status={status} code={code} />;
}
