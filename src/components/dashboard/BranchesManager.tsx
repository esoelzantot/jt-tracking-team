"use client";

import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Agent, Branch } from "@/lib/types";
import { fmt, normalize, slugify } from "@/lib/utils";
import { AgentSelect } from "./AgentSelect";

const blank: Branch = { id: "", name: "", area: "", avgShipmentsPerDay: 0, totalCustomers: 0, agentIds: [] };

export function BranchesManager({ notify }: { notify: (m: string) => void }) {
  const { t, lang } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<(Branch & { isNew?: boolean }) | null>(null);
  const [busy, setBusy] = useState(false);
  const areas = [...new Set(store.branches.map((b) => b.area).filter(Boolean))];

  const list = useMemo(
    () => store.branches.filter((b) => !q || normalize(b.name).includes(normalize(q))).sort((a, b) => a.name.localeCompare(b.name)),
    [store.branches, q],
  );

  const save = async () => {
    if (!editing?.name.trim()) return notify(t("required"));
    setBusy(true);
    try {
      const { isNew, ...b } = editing;
      const id = isNew ? slugify(b.name) : b.id;
      if (isNew && store.branchById.has(id)) return notify(`${b.name} ✕`);
      await store.repo.upsert("branches", { ...b, id, name: b.name.trim() });
      notify(t("saved"));
      setEditing(null);
    } catch (e) {
      notify(`${t("error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const del = async (b: Branch) => {
    if (!confirm(t("confirmDelete"))) return;
    const clients = store.clients.filter((c) => c.branchId === b.id).map((c) => ({ ...c, branchId: null }));
    await store.repo.bulkWrite({ clients, agents: [], branches: [] }, false);
    await store.repo.remove("branches", b.id);
    notify(t("saved"));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("search")}…`} className="input ps-9" />
        </div>
        <button onClick={() => setEditing({ ...blank, isNew: true })} className="btn btn-primary">
          <Plus className="size-4" />
          {t("add")}
        </button>
      </div>
      <div className="card overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-bg text-xs font-extrabold uppercase text-ink-3">
              <tr>
                <th className="px-3 py-3 text-start">{t("branchName")}</th>
                <th className="px-3 py-3 text-start">{t("area")}</th>
                <th className="px-3 py-3 text-start">{t("avgPerDay")}</th>
                <th className="px-3 py-3 text-start">{t("totalCustomers")}</th>
                <th className="px-3 py-3 text-start">{t("agents")}</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((b) => (
                <tr key={b.id} className="hover:bg-bg/70">
                  <td className="px-3 py-2.5 font-bold">{b.name}</td>
                  <td className="px-3 py-2.5 text-ink-2">{b.area || "—"}</td>
                  <td className="ltr-nums px-3 py-2.5">{fmt(b.avgShipmentsPerDay, lang)}</td>
                  <td className="ltr-nums px-3 py-2.5">{b.totalCustomers}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {b.agentIds.map((id) => store.agentById.get(id)).filter(Boolean).map((a) => (
                        <AgentAvatar key={a!.id} agent={a!} size={28} showStatus={false} className="rounded-full ring-2 ring-white" />
                      ))}
                      {!b.agentIds.length && <span className="text-xs font-bold text-amber-700">{t("noAgent")}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing({ ...b })} className="btn btn-ghost !p-2" aria-label={t("edit")}>
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => del(b)} className="btn btn-ghost !p-2 hover:!text-jt" aria-label={t("delete")}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? `${t("add")} · ${t("branches")}` : `${t("edit")} · ${editing?.name ?? ""}`}
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
            <div className="sm:col-span-2">
              <label className="label">{t("branchName")} *</label>
              <input className="input" dir="ltr" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} disabled={!editing.isNew} />
            </div>
            <div>
              <label className="label">{t("area")}</label>
              <input className="input" list="branch-areas" value={editing.area} onChange={(e) => setEditing({ ...editing, area: e.target.value })} />
              <datalist id="branch-areas">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">{t("avgPerDay")}</label>
                <input type="number" min={0} className="input ltr-nums" value={editing.avgShipmentsPerDay} onChange={(e) => setEditing({ ...editing, avgShipmentsPerDay: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">{t("totalCustomers")}</label>
                <input type="number" min={0} className="input ltr-nums" value={editing.totalCustomers} onChange={(e) => setEditing({ ...editing, totalCustomers: Number(e.target.value) })} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("agents")}</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {editing.agentIds.map((id) => {
                  const a = store.agentById.get(id) as Agent | undefined;
                  return (
                    <span key={id} className="flex items-center gap-1.5 rounded-full bg-jt-50 py-1 pe-1.5 ps-1 text-xs font-bold text-jt-700">
                      {a && <AgentAvatar agent={a} size={22} showStatus={false} />}
                      {a?.name ?? id}
                      <button onClick={() => setEditing({ ...editing, agentIds: editing.agentIds.filter((x) => x !== id) })} className="rounded-full p-0.5 hover:bg-jt-100" aria-label="Remove">
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <AgentSelect
                value={null}
                onChange={(v) => v && !editing.agentIds.includes(v) && setEditing({ ...editing, agentIds: [...editing.agentIds, v] })}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
