import { describe, expect, it } from "vitest";
import { localizeTransactionNote } from "@/shared/i18n/localize-transaction-note";
import { SavingsEventKind } from "@/modules/savings/application/savings-constants";
import enCatalog from "@/messages/en/catalog.json";
import viCatalog from "@/messages/vi/catalog.json";

function makeTranslator(catalog: typeof enCatalog) {
  return (key: string, values?: Record<string, string>) => {
    const [section, subkey] = key.split(".");
    if (section === "systemNotes" && subkey) {
      let template =
        (catalog.systemNotes as Record<string, string>)[subkey] ?? key;
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          template = template.replace(`{${k}}`, v);
        }
      }
      return template;
    }
    return key;
  };
}

const tCatalogEn = makeTranslator(enCatalog);
const tCatalogVi = makeTranslator(viCatalog);

describe("localizeTransactionNote (F5 display-time localization)", () => {
  it("translates persisted Vietnamese savings deposit to English in English locale", () => {
    const rawNote = "Gửi tiết kiệm: Vietcombank";
    const resultEn = localizeTransactionNote(rawNote, {
      tCatalog: tCatalogEn,
      locale: "en",
    });
    expect(resultEn).toBe("Savings deposit: Vietcombank");
  });

  it("keeps Vietnamese savings deposit in Vietnamese locale", () => {
    const rawNote = "Gửi tiết kiệm: Vietcombank";
    const resultVi = localizeTransactionNote(rawNote, {
      tCatalog: tCatalogVi,
      locale: "vi",
    });
    expect(resultVi).toBe("Gửi tiết kiệm: Vietcombank");
  });

  it("handles alternative system prefixes (Tiền gửi tiết kiệm, Fund saving)", () => {
    expect(
      localizeTransactionNote("Tiền gửi tiết kiệm: MB Bank", {
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings deposit: MB Bank");

    expect(
      localizeTransactionNote("Fund saving: Techcombank", {
        tCatalog: tCatalogVi,
        locale: "vi",
      }),
    ).toBe("Gửi tiết kiệm: Techcombank");
  });

  it("translates savings withdrawal and early settlement notes", () => {
    expect(
      localizeTransactionNote("Rút trước hạn: VIB", {
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings withdrawal: VIB");

    expect(
      localizeTransactionNote("Nhận tiền rút trước hạn: ACB", {
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings withdrawal: ACB");

    expect(
      localizeTransactionNote("Savings withdrawal: BIDV", {
        tCatalog: tCatalogVi,
        locale: "vi",
      }),
    ).toBe("Rút tiền tiết kiệm: BIDV");
  });

  it("translates savings interest, tax, and penalty notes", () => {
    expect(
      localizeTransactionNote("Lãi tiết kiệm: VietinBank", {
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings interest: VietinBank");

    expect(
      localizeTransactionNote("Thuế lãi tiết kiệm: Vietcombank", {
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings interest tax: Vietcombank");

    expect(
      localizeTransactionNote("Phí/phạt rút trước hạn: VPBank", {
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings penalty: VPBank");
  });

  it("uses structured savingsEventKind when note is bare or missing", () => {
    expect(
      localizeTransactionNote(null, {
        savingsEventKind: SavingsEventKind.PRINCIPAL_PLACEMENT,
        tCatalog: tCatalogEn,
        locale: "en",
      }),
    ).toBe("Savings deposit");

    expect(
      localizeTransactionNote(null, {
        savingsEventKind: SavingsEventKind.PRINCIPAL_PLACEMENT,
        tCatalog: tCatalogVi,
        locale: "vi",
      }),
    ).toBe("Gửi tiết kiệm");
  });

  it("never translates user-entered transaction notes", () => {
    const userNotes = [
      "Coffee with team",
      "Ăn trưa văn phòng",
      "Mua sách cho con",
      "Tiền thưởng dự án Q3",
      "Transfer to savings account for mom",
    ];

    for (const note of userNotes) {
      expect(
        localizeTransactionNote(note, {
          tCatalog: tCatalogEn,
          locale: "en",
        }),
      ).toBe(note);

      expect(
        localizeTransactionNote(note, {
          tCatalog: tCatalogVi,
          locale: "vi",
        }),
      ).toBe(note);
    }
  });

  it("works reliably even without tCatalog using built-in fallbacks", () => {
    expect(
      localizeTransactionNote("Gửi tiết kiệm: OCB", { locale: "en" }),
    ).toBe("Savings deposit: OCB");

    expect(
      localizeTransactionNote("Gửi tiết kiệm: OCB", { locale: "vi" }),
    ).toBe("Gửi tiết kiệm: OCB");
  });
});
