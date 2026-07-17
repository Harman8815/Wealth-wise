/**
 * Standalone Import & Export Wizard.
 *
 * Reusable flow:
 *   Import:  mode → upload (client parse) → mapping → preview → confirm → complete
 *   Export:  mode → configure (format/filters) → confirm → complete
 *
 * The wizard delegates parsing/mapping/validation to the reusable `lib/io`
 * library and persistence to the backend `io` API. It does not know about the
 * finance domain beyond sensible transaction defaults.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Wizard, type WizardStep } from "./wizard/Wizard";
import { FileDropzone, SelectedFile } from "./FileDropzone";
import { MappingStep } from "./MappingStep";
import { PreviewTable } from "./PreviewTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

import { parseFile, detectFormat } from "@/lib/io/parser";
import {
  autoDetectMapping,
  buildParsedRows,
  normalizeRow,
} from "@/lib/io/mapping";
import {
  STANDARD_FIELD_LABELS,
  type ColumnMapping,
  type ExportFormat,
  type ImportMode,
  type ParsedRow,
} from "@/lib/io/types";
import {
  useUploadImport,
  useCommitImport,
  useExportData,
  useSaveMappingTemplate,
} from "@/hooks";

const EXPORT_FORMATS: ExportFormat[] = ["csv", "xlsx", "pdf", "json"];

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function ImportExportWizard({ onClose }: { onClose?: () => void }) {
  const toast = useToast();
  const uploadMutation = useUploadImport();
  const commitMutation = useCommitImport();
  const exportMutation = useExportData();
  const saveTemplate = useSaveMappingTemplate();

  const [mode, setMode] = useState<ImportMode>("import");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [skipInvalid, setSkipInvalid] = useState(true);

  // Export config
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (rawRows.length && Object.keys(mapping).length) {
      const { rows: parsed } = buildParsedRows(rawRows, mapping);
      setRows(parsed);
    }
  }, [rawRows, mapping]);

  const handleFile = async (f: File) => {
    setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const result = await parseFile(f.name, buf);
      setHeaders(result.headers);
      setRawRows(result.rows);
      setWarnings(result.warnings);
      setMapping(autoDetectMapping(result.headers));
      setJobId(null);
    } catch (e: any) {
      setFile(null);
      toast.toast({ title: "Could not read file", description: e.message, variant: "destructive" });
    }
  };

  const handleToggleSkip = (index: number, skipped: boolean) => {
    setRows((prev) => prev.map((r) => (r.index === index ? { ...r, skipped } : r)));
  };

  // ---- Step definitions ----
  const importSteps: WizardStep[] = [
    {
      id: "mode",
      title: "Choose action",
      description: "Import data from a file, or export existing data.",
      content: <ModeStep mode={mode} onMode={setMode} />,
      canAdvance: () => true,
    },
    {
      id: "upload",
      title: "Upload file",
      description: "Select a CSV, Excel, or PDF bank statement.",
      content: (
        <div>
          <FileDropzone onFile={handleFile} disabled={!!file} />
          {file && <SelectedFile file={file} onClear={() => { setFile(null); setRawRows([]); setJobId(null); }} />}
          {warnings.map((w) => (
            <p key={w} className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {w}
            </p>
          ))}
        </div>
      ),
      canAdvance: () => rawRows.length > 0,
      blockedHint: "Upload a file to continue.",
    },
    {
      id: "mapping",
      title: "Map columns",
      description: "Connect your file's columns to WealthWise fields.",
      content: <MappingStep headers={headers} mapping={mapping} onChange={setMapping} />,
      canAdvance: () => !!mapping.date && (mapping.amount !== undefined || mapping.debit !== undefined || mapping.credit !== undefined),
      blockedHint: "Map at least Date and Amount.",
    },
    {
      id: "preview",
      title: "Preview & validate",
      description: "Review parsed rows. Invalid rows are flagged.",
      content: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-green-600">Valid: {rows.filter((r) => r.valid && !r.skipped).length}</span>
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-600">Invalid: {rows.filter((r) => !r.valid).length}</span>
            <span className="rounded-full bg-slate-500/10 px-3 py-1 text-muted-foreground">Skipped: {rows.filter((r) => r.skipped).length}</span>
          </div>
          <PreviewTable rows={rows} mapping={mapping} onToggleSkip={handleToggleSkip} />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={skipInvalid} onCheckedChange={setSkipInvalid} />
            Skip invalid rows on import
          </label>
        </div>
      ),
      canAdvance: () => rows.some((r) => r.valid && !r.skipped),
      blockedHint: "No valid rows to import.",
    },
    {
      id: "confirm",
      title: "Confirm & import",
      description: "Send the validated rows to the server.",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {rows.filter((r) => r.valid && !r.skipped).length} row(s) will be imported as transactions.
            Duplicates and invalid rows are skipped.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Save mapping as template (optional)</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. My Bank Statement"
            />
          </div>
        </div>
      ),
      canAdvance: () => true,
    },
  ];

  const exportSteps: WizardStep[] = [
    {
      id: "mode",
      title: "Choose action",
      description: "Import data from a file, or export existing data.",
      content: <ModeStep mode={mode} onMode={setMode} />,
      canAdvance: () => true,
    },
    {
      id: "configure",
      title: "Configure export",
      description: "Pick a format and optional filters.",
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">Exports all transactions in the active project.</p>
        </div>
      ),
      canAdvance: () => true,
    },
    {
      id: "confirm",
      title: "Confirm & export",
      description: "Generate and download the file.",
      content: (
        <p className="text-sm text-muted-foreground">
          Your transactions will be exported as <b>{exportFormat.toUpperCase()}</b> and downloaded
          automatically.
        </p>
      ),
      canAdvance: () => true,
    },
  ];

  const steps = mode === "import" ? importSteps : exportSteps;

  const handleFinish = async () => {
    if (mode === "import") {
      // Server-side: upload to get a job, then commit with the (possibly edited) mapping.
      if (!file) throw new Error("No file selected.");
      const uploadRes = jobId
        ? { job_id: jobId }
        : await uploadMutation.mutateAsync(file);
      const id = uploadRes.job_id ?? '';
      setJobId(id);
      const result = await commitMutation.mutateAsync({
        job_id: id,
        mapping,
        skip_invalid: skipInvalid,
        save_template_as: templateName || undefined,
      });
      if (templateName) saveTemplate.mutate({ name: templateName, mapping });
      toast.toast({
        title: "Import complete",
        description: `${result.imported} transaction(s) imported, ${result.skipped} skipped.`,
      });
    } else {
      const blob = await exportMutation.mutateAsync({
        format: exportFormat,
        dataset: "transactions",
        title: "WealthWise Transactions",
      });
      const ext = exportFormat === "xlsx" ? "xlsx" : exportFormat;
      downloadBlob(blob, `transactions.${ext}`);
      toast.toast({ title: "Export ready", description: `Downloaded transactions.${ext}` });
    }
  };

  const handleCancel = () => onClose?.();

  return (
    <Wizard
      steps={steps}
      onCancel={handleCancel}
      completeLabel={mode === "import" ? "Import" : "Export"}
      onFinish={handleFinish}
    />
  );
}

function ModeStep({ mode, onMode }: { mode: ImportMode; onMode: (m: ImportMode) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ModeCard
        active={mode === "import"}
        icon={<Upload className="h-6 w-6" />}
        title="Import"
        description="Bring in data from CSV, Excel, or PDF bank statements."
        onClick={() => onMode("import")}
      />
      <ModeCard
        active={mode === "export"}
        icon={<Download className="h-6 w-6" />}
        title="Export"
        description="Download your transactions in CSV, Excel, PDF, or JSON."
        onClick={() => onMode("export")}
      />
    </div>
  );
}

function ModeCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors " +
        (active
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-200 hover:border-blue-400 dark:border-slate-700")
      }
    >
      <span className="text-blue-500">{icon}</span>
      <span className="text-base font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  );
}
