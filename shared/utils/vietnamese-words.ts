/**
 * Utility for converting integer VND amounts into spoken Vietnamese words.
 * Used for real-time Vietnamese number pronunciation preview in ViNha CurrencyInput (Task 11).
 */

const DIGIT_WORDS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

function readGroupOfThree(group: number, showLeadingZero: boolean): string {
  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const units = group % 10;

  if (hundreds === 0 && tens === 0 && units === 0) return "";

  const words: string[] = [];

  if (hundreds > 0 || showLeadingZero) {
    words.push(`${DIGIT_WORDS[hundreds]} trăm`);
  }

  if (tens > 1) {
    words.push(`${DIGIT_WORDS[tens]} mươi`);
    if (units === 1) words.push("mốt");
    else if (units === 4) words.push("tư");
    else if (units === 5) words.push("lăm");
    else if (units > 0) words.push(DIGIT_WORDS[units]!);
  } else if (tens === 1) {
    words.push("mười");
    if (units === 5) words.push("lăm");
    else if (units > 0) words.push(DIGIT_WORDS[units]!);
  } else if (hundreds > 0 && units > 0) {
    words.push(`lẻ ${DIGIT_WORDS[units]!}`);
  } else if (hundreds === 0 && showLeadingZero && units > 0) {
    words.push(`lẻ ${DIGIT_WORDS[units]!}`);
  } else if (units > 0) {
    words.push(DIGIT_WORDS[units]!);
  }

  return words.join(" ");
}

/**
 * Converts a numeric VND value into a standard spoken Vietnamese text string.
 * Example: 25000000 -> "Hai mươi lăm triệu đồng"
 */
export function formatVietnameseCurrencyWords(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) {
    return "Không đồng";
  }

  const isNegative = amount < 0;
  const abs = Math.floor(Math.abs(amount));

  if (abs === 0) return "Không đồng";
  if (abs > 999_999_999_999_999) return "Số tiền quá lớn";

  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let num = abs;
  const groups: number[] = [];

  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]!;
    if (group === 0) continue;

    // Only show leading zero for hundreds if not the topmost group
    const showLeadingZero = i < groups.length - 1;
    const text = readGroupOfThree(group, showLeadingZero);
    if (text) {
      const scale = scales[i];
      parts.push(scale ? `${text} ${scale}` : text);
    }
  }

  const result = parts.join(" ").trim();
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  const prefix = isNegative ? "Âm " : "";

  return `${prefix}${capitalized} đồng`;
}
