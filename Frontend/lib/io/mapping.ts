/**
 * Column mapping + validation for the reusable Import & Export module.
 *
 * Maps arbitrary source headers onto standard fields (auto-detected), then
 * normalizes and validates each parsed row so the user can preview problems
 * before committing an import.
 */
import type {
  ColumnMapping,
  NormalizedRow,
  ParsedRow,
  RawRow,
  StandardField,
} from "./types";
import { STANDARD_FIELDS, STANDARD_FIELD_LABELS } from "./types";

const ALIASES: Record<StandardField, string[]> = {
  date: ["date", "txn date", "transaction date", "posted", "value date", "time"],
  description: ["description", "desc", "particulars", "particular", "narration", "details", "remark", "remarks"],
  merchant: ["merchant", "payee", "beneficiary", "party", "name"],
  debit: ["debit", "withdrawal", "withdraw", "dr", "expense", "paid", "spent"],
  credit: ["credit", "deposit", "cr", "income", "received", "refund"],
  amount: ["amount", "amt", "value", "sum", "total"],
  currency: ["currency", "ccy", "cur"],
  balance: ["balance", "running balance", "closing balance", "bal"],
  reference: ["reference", "ref", "ref no", "ref number", "cheque", "chq", "txn id", "transaction id"],
};

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalized = headers.map((h) => ({ original: h, key: h.toLowerCase().trim() }));

  for (const field of STANDARD_FIELDS) {
    for (const alias of ALIASES[field]) {
      const match = normalized.find(
        (h) => h.key === alias || h.key.startsWith(alias) || h.key.endsWith(alias)
      );
      if (match && !(Object.values(mapping) as string[]).includes(match.original)) {
        mapping[field] = match.original;
        break;
      }
    }
  }
  return mapping;
}

export function unmatchedHeaders(
  headers: string[],
  mapping: ColumnMapping
): string[] {
  const used = new Set(Object.values(mapping));
  return headers.filter((h) => !used.has(h));
}

const DATE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{1,2}-\d{1,2}-\d{4}$/,
  /^\d{1,2}\.\d{1,2}\.\d{4}$/,
  /^\d{4}\d{2}\d{2}$/,
];

export function normalizeDate(value: string | null | undefined): string | null {
  if (!value || !String(value).trim()) return null;
  let text = String(value).trim();
  if (text.includes("T")) text = text.split("T")[0];
  if (DATE_FORMATS.some((re) => re.test(text))) {
    // Normalize to ISO; try common separators.
    const m1 = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m1) return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
    const m2 = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m2) return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
    const m3 = text.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m3) return `${m3[1]}-${m3[2]}-${m3[3]}`;
  }
  // Last resort: let the Date parser try (returns null on failure).
  const d = new Date(text);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function normalizeAmount(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  let text = String(value).trim();
  if (!text) return null;
  text = text.replace(/[₹$€£¥,\s]/g, "");
  const negative = text.startsWith("(") && text.endsWith(")");
  text = text.replace(/[()]/g, "");
  const num = Number(text);
  if (isNaN(num)) return null;
  return negative ? -num : num;
}

export function normalizeRow(raw: RawRow, mapping: ColumnMapping): NormalizedRow {
  const get = (f: StandardField) => (mapping[f] ? (raw[mapping[f]!] ?? "") : "");
  const amount = normalizeAmount(get("amount"));
  const debit = normalizeAmount(get("debit"));
  const credit = normalizeAmount(get("credit"));
  let finalAmount = amount;
  if (finalAmount == null) {
    if (debit != null) finalAmount = -Math.abs(debit);
    else if (credit != null) finalAmount = Math.abs(credit);
  }
  return {
    date: normalizeDate(get("date")),
    description: get("description").trim(),
    merchant: get("merchant").trim(),
    debit,
    credit,
    amount: finalAmount,
    currency: get("currency").trim().toUpperCase() || null,
    balance: normalizeAmount(get("balance")),
    reference: get("reference").trim() || null,
  };
}

export function validateRow(normalized: NormalizedRow): string[] {
  const errors: string[] = [];
  if (!normalized.date) errors.push("Missing or unrecognized date.");
  if (normalized.amount == null || isNaN(normalized.amount)) {
    errors.push("Missing or invalid amount.");
  }
  return errors;
}

export function buildParsedRows(
  rawRows: RawRow[],
  mapping: ColumnMapping
): { rows: ParsedRow[]; duplicates: number } {
  const seen = new Set<string>();
  let duplicates = 0;
  const rows: ParsedRow[] = rawRows.map((raw, index) => {
    const normalized = normalizeRow(raw, mapping);
    const errors = validateRow(normalized);
    const key = `${normalized.date}|${normalized.description}|${normalized.amount}`;
    if (normalized.date && key in Object.fromEntries([...seen].map((k) => [k, 1]))) {
      errors.push("Duplicate of an earlier row.");
      duplicates++;
    }
    seen.add(key);
    return {
      index,
      raw,
      normalized,
      errors,
      valid: errors.length === 0,
    };
  });
  return { rows, duplicates };
}

export const MAPPING_FIELD_LABELS = STANDARD_FIELD_LABELS;
export type { StandardField };
