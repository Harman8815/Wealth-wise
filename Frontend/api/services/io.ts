/**
 * Import & Export API service for WealthWise.
 * Thin layer over the reusable backend import/export endpoints.
 */
import { apiClient } from "../client";
import type {
  ColumnMapping,
  ExportFilters,
  ExportFormat,
  ImportHistoryItem,
  ExportHistoryItem,
  MappingTemplate,
  ParseResult,
} from "@/lib/io/types";

export interface UploadResponse extends ParseResult {
  warnings: string[];
}

export interface CommitResponse {
  imported: number;
  skipped: number;
  total: number;
}

export const ioApi = {
  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post<UploadResponse>("/imports/upload/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  commitImport: async (params: {
    job_id: string;
    mapping: ColumnMapping;
    skip_invalid?: boolean;
    account_id?: string;
    save_template_as?: string;
  }) => {
    const response = await apiClient.post<CommitResponse>(
      `/imports/${params.job_id}/commit/`,
      {
        mapping: params.mapping,
        skip_invalid: params.skip_invalid ?? true,
        account_id: params.account_id,
        save_template_as: params.save_template_as,
      }
    );
    return response.data;
  },

  importHistory: async () => {
    const response = await apiClient.get<ImportHistoryItem[]>("/imports/history/");
    return response.data;
  },

  exportData: async (params: {
    format: ExportFormat;
    dataset?: string;
    title?: string;
    filters?: ExportFilters;
  }) => {
    const response = await apiClient.post("/exports/", params, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  exportHistory: async () => {
    const response = await apiClient.get<ExportHistoryItem[]>("/exports/history/");
    return response.data;
  },

  listMappingTemplates: async () => {
    const response = await apiClient.get<MappingTemplate[]>("/imports/mapping-templates/");
    return response.data;
  },

  saveMappingTemplate: async (name: string, mapping: ColumnMapping) => {
    const response = await apiClient.post<MappingTemplate>("/imports/mapping-templates/", {
      name,
      mapping,
    });
    return response.data;
  },

  deleteMappingTemplate: async (id: string) => {
    await apiClient.delete(`/imports/mapping-templates/${id}/`);
  },
};
