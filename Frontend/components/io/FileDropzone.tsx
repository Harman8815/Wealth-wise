/**
 * Reusable drag-and-drop file uploader used by the Import/Export module.
 */
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, validateFile } from "@/lib/io/parser";

interface FileDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFile, disabled }: FileDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      if (rejected.length) {
        setError("That file type is not supported.");
        return;
      }
      const file = accepted[0];
      if (!file) return;
      try {
        validateFile(file.name, file.size);
        onFile(file);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-3 h-10 w-10 text-blue-500" />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Drop the file here…" : "Drag & drop a file, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports CSV, Excel (.xls/.xlsx) and PDF bank statements · max {MAX_FILE_BYTES / 1024 / 1024} MB
        </p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface SelectedFileProps {
  file: File;
  onClear: () => void;
}

export function SelectedFile({ file, onClear }: SelectedFileProps) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClear} aria-label="Remove file">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
