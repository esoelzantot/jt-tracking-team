"use client";

import { Pencil, Plus, Search, Trash2, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { buildIndex } from "@/lib/search";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgentSelect } from "./AgentSelect";

const PAGE = 50;
const blank: Client = { id: "", code: "", name: "", branchId: null, agentId: null, supportAgentId: null, notes: "" };

export function ClientsManager({ notify, initialFilter }: { notify: (m: string) => void; initialFilter?: "unassigned" }) {
  const { t } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [onlyUnassigned, setOnlyUnassigned] = useState(initialFilter === "unassigned");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Client | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulkAgent, setBulkAgent] = useState<string | null>(null);
  const [bulkField, setBulkField] = useState<"agentId" | "supportAgentId">("agentId");
  const [busy, setBusy] = useState(false);

  const search = useMemo(() => buildIndex(store.clients), [store.clients]);
  const list = useMemo(() => {
    let l = q ? search(q, 5000) : [...store.clients].sort((a, b) => a.name.localeCompare(b.name));
    if (branch !== "all") l = l.filter((c) => c.branchId === branch);
    if (onlyUnassigned) l = l.filter((c) => !c.agentId);
    return l;
  }, [q, search, store.clients, branch, onlyUnassigned]);
  const shown = list.slice(0, page * PAGE);
  const branchesSorted = [...store.branches].sort((a, b) => a.name.localeCompare(b.name));

  const save = async () => {
    if (!editing) return;
    const code = editing.code.trim().toUpperCase();
    if (!code || !editing.name.trim()) return notify(t("required"));
    setBusy(true);
    try {
      if (!isNew && editing.id !== code) await store.repo.remove("clients", editing.id);
      await store.repo.upsert("clients", { ...editing, id: code, code, name: editing.name.trim() });
      notify(t("saved"));
      setEditing(null);
    } catch (e) {
      notify(`${t("error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const del = async (c: Client) => {
    if (!confirm(t("confirmDelete"))) return;
    await store.repo.remove("clients", c.id);
    notify(t("saved"));
  };

  const bulk = async () => {
    setBusy(true);
    try {
      const chosen = store.clients.filter((c) => sel.has(c.id)).map((c) => ({ ...c, [bulkField]: bulkAgent }));
      await store.repo.bulkWrite({ clients: chosen, agents: [], branches: [] }, false);
      setSel(new Set());
      notify(t("saved"));
    } finally {
      setBusy(false);
    }
  };

  const allShownSelected = shown.length > 0 && shown.every((c) => sel.has(c.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("searchPlaceholder")} className="input ps-9" />
        </div>
        <select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }} className="input lg:!w-56">
          <option value="all">{t("pickupBranch")}: {t("filterAll")}</option>
          {branchesSorted.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button onClick={() => setOnlyUnassigned((v) => !v)} className={cn("btn", onlyUnassigned ? "btn-primary" : "bg-surface text-ink-2 ring-1 ring-line")}>
          <UserX className="size-4" />
          {t("needsAssignment")}
        </button>
        <button onClick={() => { setEditing({ ...blank }); setIsNew(true); }} className="btn btn-primary">
          <Plus className="size-4" />
          {t("add")}
        </button>
      </div>

      {sel.size > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-jt-50 p-3 text-ink ring-1 ring-jt/20 sm:flex-row sm:items-center">
          <span className="text-sm font-bold">
            <span className="ltr-nums">{sel.size}</span> {t("selected")}
          </span>
          <select value={bulkField} onChange={(e) => setBulkField(e.target.value as typeof bulkField)} className="input !w-auto">
            <option value="agentId">{t("accountManager")}</option>
            <option value="supportAgentId">{t("supportAgent")}</option>
          </select>
          <AgentSelect value={bulkAgent} onChange={setBulkAgent} className="input sm:!w-72" />
          <button onClick={bulk} disabled={busy} className="btn btn-primary">
            {t("assign")}
          </button>
          <button onClick={() => setSel(new Set())} className="btn btn-ghost sm:ms-auto">
            {t("cancel")}
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-bg text-start text-xs font-extrabold uppercase text-ink-3">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    className="accent-jt"
                    checked={allShownSelected}
                    onChange={() => setSel(allShownSelected ? new Set() : new Set(shown.map((c) => c.id)))}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3 text-start">{t("clientName")}</th>
                <th className="px-3 py-3 text-start">{t("clientCode")}</th>
                <th className="px-3 py-3 text-start">{t("pickupBranch")}</th>
                <th className="px-3 py-3 text-start">{t("accountManager")}</th>
                <th className="px-3 py-3 text-start">{t("supportAgent")}</th>
                <th className="w-24 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((c) => {
                const a = c.agentId ? store.agentById.get(c.agentId) : undefined;
                const s = c.supportAgentId ? store.agentById.get(c.supportAgentId) : undefined;
                return (
                  <tr key={c.id} className={cn("transition hover:bg-bg/70", sel.has(c.id) && "bg-jt-50/60")}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="accent-jt"
                        checked={sel.has(c.id)}
                        onChange={() => setSel((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                        aria-label={`Select ${c.name}`}
                      />
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 font-bold">{c.name}</td>
                    <td className="ltr-nums px-3 py-2.5 text-ink-2">{c.code}</td>
                    <td className="px-3 py-2.5 text-ink-2">{c.branchId ? store.branchById.get(c.branchId)?.name : "—"}</td>
                    <td className="px-3 py-2.5">
                      {a ? (
                        <span className="flex items-center gap-2">
                          <AgentAvatar agent={a} size={26} />
                          <span className="max-w-[140px] truncate">{a.name}</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{t("needsAssignment")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {s ? (
                        <span className="flex items-center gap-2">
                          <AgentAvatar agent={s} size={26} />
                          <span className="max-w-[140px] truncate">{s.name}</span>
                        </span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing({ ...c }); setIsNew(false); }} className="btn btn-ghost !p-2" aria-label={t("edit")}>
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => del(c)} className="btn btn-ghost !p-2 hover:!text-jt" aria-label={t("delete")}>
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length < list.length && (
          <div className="border-t border-line p-3 text-center">
            <button onClick={() => setPage((p) => p + 1)} className="btn btn-soft">
              + {list.length - shown.length}
            </button>
          </div>
        )}
        {!list.length && <div className="p-8 text-center text-sm text-ink-3">{t("noResults")}</div>}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? `${t("add")} · ${t("clients")}` : `${t("edit")} · ${editing?.name ?? ""}`}
        footer={
          <>
            <button onClick={() => setEditing(null)} className="btn btn-ghost">
              {t("cancel")}
            </button>
            <button onClick={save} disabled={busy} className="btn btn-primary">
              {t("save")}
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t("clientName")} *</label>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("clientCode")} *</label>
              <input className="input ltr-nums" dir="ltr" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="J0086…" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("pickupBranch")}</label>
              <select className="input" value={editing.branchId ?? ""} onChange={(e) => setEditing({ ...editing, branchId: e.target.value || null })}>
                <option value="">{t("none")}</option>
                {branchesSorted.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("accountManager")}</label>
              <AgentSelect
                value={editing.agentId}
                onChange={(v) => setEditing({ ...editing, agentId: v })}
                preferIds={editing.branchId ? store.branchById.get(editing.branchId)?.agentIds : []}
              />
            </div>
            <div>
              <label className="label">{t("supportAgent")}</label>
              <AgentSelect value={editing.supportAgentId} onChange={(v) => setEditing({ ...editing, supportAgentId: v })} exclude={editing.agentId} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("notes")}</label>
              <textarea className="input min-h-20" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
