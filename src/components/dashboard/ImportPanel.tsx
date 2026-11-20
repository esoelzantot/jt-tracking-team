"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useI18n } from "@/lib/i18n";
import { parseWorkbook, type ImportReport } from "@/lib/importExcel";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ImportPanel({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const store = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const read = async (file: File) => {
    setDone(false);
    setFileName(file.name);
    try {
      setReport(parseWorkbook(await file.arrayBuffer(), store));
    } catch (e) {
      notify(`${t("error")}: ${(e as Error).message}`);
      setReport(null);
    }
  };

  const apply = async (replace: boolean) => {
    if (!report) return;
    if (replace && !confirm(t("confirmDelete"))) return;
    setBusy(true);
    try {
      await store.repo.bulkWrite(report.dataset, replace);
      setDone(true);
      notify(t("importDone"));
    } catch (e) {
      notify(`${t("error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportXlsx = () => {
    const agentName = (id: string | null) => (id ? store.agentById.get(id)?.name ?? id : "");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        store.clients.map((c) => ({
          "Client Name": c.name,
          "Client Code": c.code,
          Branch: c.branchId ? store.branchById.get(c.branchId)?.name ?? "" : "",
          Agent: agentName(c.agentId),
          "Agent ID": c.agentId ?? "",
          "Support Agent": agentName(c.supportAgentId),
          "Support Agent ID": c.supportAgentId ?? "",
          Notes: c.notes ?? "",
        })),
      ),
      "VIP Customers",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        store.branches.map((b) => ({
          Area: b.area,
          Branch: b.name,
          "Average shipment per day": b.avgShipmentsPerDay,
          "Total Customers": b.totalCustomers,
          Agents: b.agentIds.map(agentName).join(" / "),
          IDs: b.agentIds.join(" / "),
        })),
      ),
      "Branches",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        store.agents.map((a) => ({ Name: a.name, ID: a.id, Status: a.status, Area: a.area ?? "", "Cover Agent": agentName(a.coverAgentId), Phone: a.phone ?? "", Email: a.email ?? "" })),
      ),
      "Agents",
    );
    XLSX.writeFile(wb, `tracking-hub-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) read(f);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition",
            drag ? "border-jt bg-jt-50" : "border-line bg-surface hover:border-jt/50",
          )}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-jt text-white shadow-lg shadow-jt/30">
            <FileSpreadsheet className="size-8" />
          </div>
          <div className="font-extrabold">{fileName || t("dropFile")}</div>
          <div className="text-xs text-ink-3">VIP Customers · Branches</div>
        </button>
        <input ref={input} type="file" accept=".xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />

        {report && (
          <div className="card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">{t("importPreview")}</h3>
              {done && (
                <span className="flex items-center gap-1 text-sm font-bold text-ok">
                  <CheckCircle2 className="size-4" />
                  {t("importDone")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [t("clients"), report.stats.clients],
                [t("agents"), report.stats.agents],
                [t("branches"), report.stats.branches],
                [t("needsAssignment"), report.stats.unassigned],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-2xl bg-bg p-3">
                  <div className="ltr-nums text-2xl font-black">{v}</div>
                  <div className="text-xs font-bold text-ink-3">{l}</div>
                </div>
              ))}
            </div>
            {report.warnings.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-1 flex items-center gap-1.5 font-extrabold">
                  <AlertTriangle className="size-4" />
                  {t("warnings")}
                </div>
                <ul className="list-disc space-y-1 ps-5" dir="ltr">
                  {report.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => apply(false)} disabled={busy} className="btn btn-primary">
                <Upload className="size-4" />
                {t("importMerge")}
              </button>
              <button onClick={() => apply(true)} disabled={busy} className="btn btn-soft">
                {t("importReplace")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card h-fit space-y-3 p-5">
        <h3 className="font-extrabold">{t("export")}</h3>
        <p className="text-sm text-ink-2">
          {store.clients.length} {t("clients")} · {store.agents.length} {t("agents")} · {store.branches.length} {t("branches")}
        </p>
        <button onClick={exportXlsx} disabled={!store.clients.length} className="btn btn-soft w-full">
          <Download className="size-4" />
          {t("export")}
        </button>
      </div>
    </div>
  );
}
