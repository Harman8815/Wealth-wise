/**
 * Client-side file parsers for the reusable Import & Export module.
 *
 * Supports CSV (PapaParse), Excel (.xls/.xlsx via SheetJS), and PDF bank
 * statements (pdfjs-dist). The result is a domain-agnostic list of raw rows
 * plus detected headers; semantic meaning is applied by the mapping layer.
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const ALLOWED_EXTENSIONS = [".csv", ".xls", ".xlsx", ".pdf"] as const;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type SupportedFormat = "csv" | "xls" | "xlsx" | "pdf";

export function detectFormat(filename: string): SupportedFormat {
  const ext = "." + (filename.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
    throw new Error(
      `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`
    );
  }
  return ext.replace(".", "") as SupportedFormat;
}

export function validateFile(filename: string, size: number): SupportedFormat {
  if (size > MAX_FILE_BYTES) {
    throw new Error(
      `File too large (${(size / 1024).toFixed(0)} KB). Maximum allowed is ${MAX_FILE_BYTES / 1024} KB.`
    );
  }
  return detectFormat(filename);
}

export interface RawParseOutput {
  headers: string[];
  rows: Record<string, string>[];
  sheetNames?: string[];
  warnings: string[];
}

async function parseCsv(content: ArrayBuffer): Promise<RawParseOutput> {
  const text = new TextDecoder("utf-8").decode(content);
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      complete: (results: { meta: { fields?: string[] }; data: Record<string, unknown>[] }) => {
        const headers = results.meta.fields || [];
        resolve({
          headers,
          rows: results.data.map((r) =>
            Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
          ),
          warnings: [],
        });
      },
      error: (err: { message: string }) => reject(new Error(err.message)),
    });
  });
}

async function parseExcel(content: ArrayBuffer): Promise<RawParseOutput> {
  const wb = XLSX.read(content, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
  const filtered = matrix.filter((row) => row.some((c) => String(c ?? "").trim() !== ""));
  if (!filtered.length) {
    throw new Error("The selected worksheet appears to be empty.");
  }
  const headers = filtered[0].map((h) => String(h ?? "").trim());
  const rows = filtered.slice(1).map((raw) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      const val = raw[i];
      rec[h] = val === undefined || val === null ? "" : String(val);
    });
    return rec;
  });
  return {
    headers,
    rows,
    sheetNames: wb.SheetNames,
    warnings: [],
  };
}

async function parsePdf(content: ArrayBuffer): Promise<RawParseOutput> {
  // Dynamically import pdfjs so it stays out of the initial bundle.
  const pdfjs = await import("pdfjs-dist");
  // Use the legacy worker build to avoid worker-bundler configuration.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const buffer = new Uint8Array(content);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const rows: string[][] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content1 = await page.getTextContent();
    // Reconstruct lines from text items by tracking vertical position.
    const lineMap = new Map<number, string[]>();
    for (const item of content1.items as any[]) {
      if (typeof item.str !== "string") continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(item.str);
    }
    const lines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.join(" "));
    for (const line of lines) {
      if (/\d/.test(line) && /(\d[\d.,]*\.?\d*|\()/.test(line)) {
        rows.push([line]);
      }
    }
  }

  if (!rows.length) {
    throw new Error("Could not extract transaction lines from the PDF.");
  }

  const looksLikeHeader = rows[0].some((cell) =>
    /date|desc|particular|debit|credit|amount|balance|narration/i.test(cell)
  );
  const headers = looksLikeHeader
    ? rows[0].flatMap((c) => c.split(/\s{2,}|\t/).filter(Boolean)).map((h) => h.trim())
    : Array.from({ length: Math.max(...rows.map((r) => r.length)) }, (_, i) => `column_${i + 1}`);

  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const records = dataRows.map((raw) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = raw[i] ?? "";
    });
    return rec;
  });

  return {
    headers,
    rows: records,
    warnings: ["PDF parsing is best-effort; please review extracted rows."],
  };
}

export async function parseFile(filename: string, content: ArrayBuffer): Promise<RawParseOutput> {
  const fmt = detectFormat(filename);
  switch (fmt) {
    case "csv":
      return parseCsv(content);
    case "xls":
    case "xlsx":
      return parseExcel(content);
    case "pdf":
      return parsePdf(content);
    default:
      throw new Error(`Unsupported format: ${fmt}`);
  }
}
