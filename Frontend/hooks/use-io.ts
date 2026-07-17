/**
 * Import & Export React Query hooks.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ioApi } from "@/api/services/io";
import { queryKeys } from "@/api/query-client";
import type { ColumnMapping, ExportFilters, ExportFormat } from "@/lib/io/types";

export const useImportHistory = () =>
  useQuery({
    queryKey: [...queryKeys.io.imports],
    queryFn: ioApi.importHistory,
  });

export const useExportHistory = () =>
  useQuery({
    queryKey: [...queryKeys.io.exports],
    queryFn: ioApi.exportHistory,
  });

export const useMappingTemplates = () =>
  useQuery({
    queryKey: [...queryKeys.io.templates],
    queryFn: ioApi.listMappingTemplates,
  });

export const useUploadImport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => ioApi.uploadFile(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.io.imports });
    },
  });
};

export const useCommitImport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      job_id: string;
      mapping: ColumnMapping;
      skip_invalid?: boolean;
      account_id?: string;
      save_template_as?: string;
    }) => ioApi.commitImport(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.io.imports });
    },
  });
};

export const useExportData = () =>
  useMutation({
    mutationFn: (params: {
      format: ExportFormat;
      dataset?: string;
      title?: string;
      filters?: ExportFilters;
    }) => ioApi.exportData(params),
  });

export const useSaveMappingTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; mapping: ColumnMapping }) =>
      ioApi.saveMappingTemplate(params.name, params.mapping),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.io.templates });
    },
  });
};
