/**
 * Dedicated Import & Export page.
 * Hosts the reusable wizard plus import/export history.
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportExportWizard } from "@/components/io/ImportExportWizard";
import { useImportHistory, useExportHistory } from "@/hooks";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";

function Statusbadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "text-green-600 border-green-600/40"
      : status === "failed"
        ? "text-red-600 border-red-600/40"
        : "text-amber-600 border-amber-600/40";
  return (
    <Badge variant="outline" className={tone}>
      {status}
    </Badge>
  );
}

function HistoryPanel() {
  const imports = useImportHistory();
  const exports = useExportHistory();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="h-4 w-4" /> Import history
          </CardTitle>
          <CardDescription>Recent file imports for this project.</CardDescription>
        </CardHeader>
        <CardContent>
          {imports.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !imports.data?.length ? (
            <p className="text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            <ScrollArea className="h-64">
              <ul className="space-y-2">
                {imports.data.map((job) => (
                  <li key={job.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{job.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.total_rows} rows · {job.imported_rows} imported ·{" "}
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Statusbadge status={job.status} />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpFromLine className="h-4 w-4" /> Export history
          </CardTitle>
          <CardDescription>Recent data exports for this project.</CardDescription>
        </CardHeader>
        <CardContent>
          {exports.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !exports.data?.length ? (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            <ScrollArea className="h-64">
              <ul className="space-y-2">
                {exports.data.map((job) => (
                  <li key={job.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium capitalize">
                        {job.dataset} · {job.format.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.row_count} rows ·{" "}
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Statusbadge status={job.status} />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImportExportPage() {
  const [tab, setTab] = useState<"wizard" | "history">("wizard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <History className="h-7 w-7 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Import &amp; Export</h1>
          <p className="text-sm text-muted-foreground">
            Move your financial data in and out of WealthWise.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "wizard" | "history")}>
        <TabsList className="mb-4">
          <TabsTrigger value="wizard">Wizard</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="wizard">
          <ImportExportWizard onClose={() => setTab("history")} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
