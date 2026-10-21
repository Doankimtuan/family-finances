import { SavingsEventKind } from "@/modules/savings/application/savings-constants";

export type SystemNoteKind =
  | "savings_deposit"
  | "savings_withdrawal"
  | "savings_interest"
  | "savings_tax"
  | "savings_penalty";

const SYSTEM_PREFIX_PATTERNS: ReadonlyArray<{
  kind: SystemNoteKind;
  regex: RegExp;
}> = [
  {
    kind: "savings_deposit",
    regex:
      /^(?:Gửi tiết kiệm|Tiền gửi tiết kiệm|Fund saving|Saving funded|Savings deposit)\s*:\s*(.*)$/i,
  },
  {
    kind: "savings_withdrawal",
    regex:
      /^(?:Rút trước hạn|Nhận tiền rút trước hạn|Rút tiết kiệm|Savings withdrawal)\s*:\s*(.*)$/i,
  },
  {
    kind: "savings_interest",
    regex:
      /^(?:Lãi tiết kiệm|Nhận lãi tiết kiệm|Lãi rút trước hạn|Savings interest)\s*:\s*(.*)$/i,
  },
  {
    kind: "savings_tax",
    regex:
      /^(?:Thuế lãi tiết kiệm|Thuế lãi rút trước hạn|Savings interest tax|Savings tax)\s*:\s*(.*)$/i,
  },
  {
    kind: "savings_penalty",
    regex:
      /^(?:Phí\/phạt rút trước hạn|Phí rút trước hạn|Savings penalty)\s*:\s*(.*)$/i,
  },
];

const EVENT_KIND_TO_SYSTEM_NOTE: Record<string, SystemNoteKind> = {
  [SavingsEventKind.PRINCIPAL_PLACEMENT]: "savings_deposit",
  [SavingsEventKind.PRINCIPAL_RETURN]: "savings_withdrawal",
  [SavingsEventKind.INTEREST]: "savings_interest",
  [SavingsEventKind.TAX]: "savings_tax",
  [SavingsEventKind.FEE]: "savings_penalty",
};

const EN_FALLBACKS: Record<
  SystemNoteKind,
  { withProduct: string; bare: string }
> = {
  savings_deposit: {
    withProduct: "Savings deposit: {product}",
    bare: "Savings deposit",
  },
  savings_withdrawal: {
    withProduct: "Savings withdrawal: {product}",
    bare: "Savings withdrawal",
  },
  savings_interest: {
    withProduct: "Savings interest: {product}",
    bare: "Savings interest",
  },
  savings_tax: {
    withProduct: "Savings interest tax: {product}",
    bare: "Savings interest tax",
  },
  savings_penalty: {
    withProduct: "Savings penalty: {product}",
    bare: "Savings penalty",
  },
};

const VI_FALLBACKS: Record<
  SystemNoteKind,
  { withProduct: string; bare: string }
> = {
  savings_deposit: {
    withProduct: "Gửi tiết kiệm: {product}",
    bare: "Gửi tiết kiệm",
  },
  savings_withdrawal: {
    withProduct: "Rút tiền tiết kiệm: {product}",
    bare: "Rút tiền tiết kiệm",
  },
  savings_interest: {
    withProduct: "Lãi tiết kiệm: {product}",
    bare: "Lãi tiết kiệm",
  },
  savings_tax: {
    withProduct: "Thuế lãi tiết kiệm: {product}",
    bare: "Thuế lãi tiết kiệm",
  },
  savings_penalty: {
    withProduct: "Phí rút trước hạn: {product}",
    bare: "Phí rút trước hạn",
  },
};

export type SystemNoteCatalogTranslator = (
  key: string,
  values?: Record<string, string>,
) => string;

export type LocalizeTransactionNoteOptions = {
  savingsEventKind?: string | null;
  tCatalog?: SystemNoteCatalogTranslator | unknown;
  locale?: string;
};

function formatSystemNote(
  kind: SystemNoteKind,
  product: string | null,
  tCatalog?: unknown,
  locale = "en",
): string {
  const isVi = locale.toLowerCase().startsWith("vi");
  const fallbacks = isVi ? VI_FALLBACKS[kind] : EN_FALLBACKS[kind];
  const translate =
    typeof tCatalog === "function"
      ? (tCatalog as (key: string, values?: Record<string, string>) => string)
      : null;

  if (product && product.trim().length > 0) {
    const trimmed = product.trim();
    if (translate) {
      try {
        const translated = translate(`systemNotes.${kind}`, {
          product: trimmed,
        });
        if (translated && !translated.startsWith("systemNotes.")) {
          return translated;
        }
      } catch {
        // Fall back to built-in dictionary
      }
    }
    return fallbacks.withProduct.replace("{product}", trimmed);
  }

  if (translate) {
    try {
      const translated = translate(`systemNotes.${kind}_bare`);
      if (translated && !translated.startsWith("systemNotes.")) {
        return translated;
      }
    } catch {
      // Fall back to built-in dictionary
    }
  }
  return fallbacks.bare;
}

/**
 * Localizes system-generated transaction descriptions at display time without rewriting
 * historical financial records or mutating user-entered notes.
 */
export function localizeTransactionNote(
  note: string | null | undefined,
  options?: LocalizeTransactionNoteOptions,
): string {
  const trimmedNote = note?.trim();
  const savingsEventKind = options?.savingsEventKind ?? null;
  const tCatalog = options?.tCatalog;
  const locale = options?.locale ?? "en";

  // 1. Check if note matches a known system-generated prefix (e.g. "Gửi tiết kiệm: Vietcombank")
  if (trimmedNote) {
    for (const { kind, regex } of SYSTEM_PREFIX_PATTERNS) {
      const match = trimmedNote.match(regex);
      if (match) {
        const product = match[1]?.trim() || null;
        return formatSystemNote(kind, product, tCatalog, locale);
      }
    }
  }

  // 2. Check if transaction has structured savings event metadata
  if (savingsEventKind && EVENT_KIND_TO_SYSTEM_NOTE[savingsEventKind]) {
    const kind = EVENT_KIND_TO_SYSTEM_NOTE[savingsEventKind];
    return formatSystemNote(kind, trimmedNote || null, tCatalog, locale);
  }

  // 3. User-entered notes and non-system descriptions pass through untouched
  return trimmedNote || "";
}
