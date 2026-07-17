/**
 * Reusable Import & Export types.
 *
 * This module is domain-independent: it describes a normalized row, a column
 * mapping, and the shape of import/export jobs. Any feature module can reuse
 * these types for its own import/export workflows.
 */

export type StandardField =
  | "date"
  | "description"
  | "merchant"
  | "debit"
  | "credit"
  | "amount"
  | "currency"
  | "balance"
  | "reference";

export const STANDARD_FIELDS: StandardField[] = [
  "date",
  "description",
  "merchant",
  "debit",
  "credit",
  "amount",
  "currency",
  "balance",
  "reference",
];

export const STANDARD_FIELD_LABELS: Record<StandardField, string> = {
  date: "Date",
  description: "Description",
  merchant: "Merchant",
  debit: "Debit",
  credit: "Credit",
  amount: "Amount",
  currency: "Currency",
  balance: "Balance",
  reference: "Reference #",
};

export interface RawRow {
  [header: string]: string;
}

export interface NormalizedRow {
  date?: string | null;
  description?: string;
  merchant?: string;
  debit?: number | null;
  credit?: number | null;
  amount?: number | null;
  currency?: string | null;
  balance?: number | null;
  reference?: string | null;
}

export interface ParsedRow {
  index: number;
  raw: RawRow;
  normalized: NormalizedRow;
  errors: string[];
  valid: boolean;
  skipped?: boolean;
}

export interface ParseResult {
  job_id?: string;
  headers: string[];
  rows: ParsedRow[];
  mapping: Record<string, string>;
  warnings: string[];
  total: number;
  valid: number;
}

export type ColumnMapping = Partial<Record<StandardField, string>>;

export type ImportMode = "import" | "export";
export type ImportStep =
  | "mode"
  | "source"
  | "upload"
  | "preview"
  | "mapping"
  | "configure"
  | "confirm"
  | "complete";

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  type?: string;
  category?: string;
}

export interface ImportHistoryItem {
  id: string;
  filename: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  imported_rows: number;
  error: string | null;
  created_at: string;
}

export interface ExportHistoryItem {
  id: string;
  dataset: string;
  format: string;
  row_count: number;
  status: string;
  created_at: string;
}

export interface MappingTemplate {
  id: string;
  name: string;
  mapping: ColumnMapping;
}
