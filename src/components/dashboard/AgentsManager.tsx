"use client";

import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Agent, AgentStatus } from "@/lib/types";
import { cn, coverageOf } from "@/lib/utils";
import { AgentSelect } from "./AgentSelect";
import { DistributeModal, type DistributeTarget } from "./DistributeModal";
import { Picker } from "@/components/Picker";

const blank: Agent = { id: "", name: "", gender: "female", hijab: true, status: "active", coverAgentId: null, phone: "", email: "", area: "" };

export function AgentsManager({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const store = useStore();
  const [editing, setEditing] = useState<(Agent & { originalId?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const areas = [...new Set(store.branches.map((b) => b.area).filter(Boolean))];

  const [distribute, setDistribute] = useState<DistributeTarget | null>(null);

  /** Clients of this agent that would have nobody available to handle them. */
  const uncoveredFor = (agentId: string, coverId: string | null | undefined) => {
    const cover = coverId ? store.agentById.get(coverId) : undefined;
    if (cover?.status === "active") return [];
    return store.clients.filter(
      (c) => c.agentId === agentId && !(c.supportAgentId && store.agentById.get(c.supportAgentId)?.status === "active"),
    );
  };
  const hasClients = (agentId: string) => store.clients.some((c) => c.agentId === agentId);

  const setStatus = async (a: Agent, status: AgentStatus) => {
    if (status === a.status) return;
    // Going away → distribute the agent's clients over other agents first.
    if (status !== "active" && hasClients(a.id)) {
      setDistribute({ agent: a, status });
      return;
    }
    await store.repo.upsert("agents", { ...a, status });
    notify(t("saved"));
  };

  const save = async () => {
    if (!editing) return;
    const id = editing.id.trim();
    if (!id || !editing.name.trim()) return notify(t("required"));
    setBusy(true);
    try {
      const { originalId, ...agent } = editing;
      const next: Agent = { ...agent, id, name: agent.name.trim() };
      if (originalId && originalId !== id) {
        // ID changed (e.g. replacing a temporary ID): move every reference to the new ID.
        delete next.tempId;
        const clients = store.clients
          .filter((c) => c.agentId === originalId || c.supportAgentId === originalId)
          .map((c) => ({ ...c, agentId: c.agentId === originalId ? id : c.agentId, supportAgentId: c.supportAgentId === originalId ? id : c.supportAgentId }));
        const branches = store.branches.filter((b) => b.agentIds.includes(originalId)).map((b) => ({ ...b, agentIds: b.agentIds.map((x) => (x === originalId ? id : x)) }));
        const agents = store.agents.filter((a) => a.coverAgentId === originalId).map((a) => ({ ...a, coverAgentId: id }));
        await store.repo.bulkWrite({ clients, branches, agents: [...agents, next] }, false);
        await store.repo.remove("agents", originalId);
      } else {
        await store.repo.upsert("agents", next);
      }
      notify(t("saved"));
      setEditing(null);
      // Just went away → open the distribution of their clients.
      const before = originalId ? store.agentById.get(originalId)?.status : "active";
      if (next.status !== "active" && before === "active" && hasClients(originalId ?? id)) {
        setDistribute({ agent: next, status: next.status });
      }
    } catch (e) {
      notify(`${t("error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const del = async (a: Agent) => {
    if (!confirm(t("confirmDelete"))) return;
    const clients = store.clients
      .filter((c) => c.agentId === a.id || c.supportAgentId === a.id)
      .map((c) => ({ ...c, agentId: c.agentId === a.id ? null : c.agentId, supportAgentId: c.supportAgentId === a.id ? null : c.supportAgentId }));
    const branches = store.branches.filter((b) => b.agentIds.includes(a.id)).map((b) => ({ ...b, agentIds: b.agentIds.filter((x) => x !== a.id) }));
    const agents = store.agents.filter((x) => x.coverAgentId === a.id).map((x) => ({ ...x, coverAgentId: null }));
    await store.repo.bulkWrite({ clients, branches, agents }, false);
    await store.repo.remove("agents", a.id);
    notify(t("saved"));
  };

  const statuses: AgentStatus[] = ["active", "leave", "off"];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...blank })} className="btn btn-primary">
          <Plus className="size-4" />
          {t("add")}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...store.agents]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => {
            const cov = coverageOf(a.id, store);
            const count = cov.total;
            const uncovered = a.status !== "active" ? uncoveredFor(a.id, a.coverAgentId) : [];
            return (
              <div key={a.id} className={cn("card p-4", uncovered.length > 0 && "ring-2 ring-warn/60")}>
                <div className="flex items-start gap-3">
                  <AgentAvatar agent={a} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{a.name}</div>
                    <div className="ltr-nums text-xs text-ink-3">
                      #{a.id} · {count} {t("clients")}
                    </div>
                    {a.tempId && <div className="mt-1 text-[11px] font-bold text-amber-700">{t("tempId")}</div>}
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => setEditing({ ...a, originalId: a.id })} className="btn btn-ghost !p-2" aria-label={t("edit")}>
                      <Pencil className="size-4" />
                    </button>
                    <button onClick={() => del(a)} className="btn btn-ghost !p-2 hover:!text-jt" aria-label={t("delete")}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-bold text-ink-3">{t("quickStatus")}</div>
                <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl bg-bg p-1">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(a, s)}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold transition",
                        a.status === s
                          ? s === "active"
                            ? "bg-ok text-white"
                            : s === "leave"
                              ? "bg-warn text-white"
                              : "bg-ink-3 text-white"
                          : "text-ink-2 hover:bg-surface",
                      )}
                    >
                      {s === "active" ? t("active") : s === "leave" ? t("onLeave") : t("off")}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="shrink-0 font-bold text-ink-3">{t("supportShort")}:</span>
                  {cov.groups.length === 1 ? (
                    <span className="flex min-w-0 items-center gap-1.5 font-bold">
                      <AgentAvatar agent={cov.groups[0].agent} size={22} showStatus={false} />
                      <span className="truncate">{cov.groups[0].agent.name}</span>
                    </span>
                  ) : cov.groups.length > 1 ? (
                    <span className="flex min-w-0 items-center gap-1.5 font-bold">
                      <span className="flex shrink-0 -space-x-1.5 rtl:space-x-reverse">
                        {cov.groups.slice(0, 4).map((g) => (
                          <AgentAvatar key={g.agent.id} agent={g.agent} size={22} showStatus={false} className="rounded-full ring-2 ring-surface" />
                        ))}
                      </span>
                      <span className="truncate">
                        {t("splitAcross")} <span className="ltr-nums">{cov.groups.length}</span> {t("agentsWord")}
                      </span>
                    </span>
                  ) : (
                    <span className={cn("font-bold", a.status !== "active" ? "text-amber-700" : "text-ink-3")}>—</span>
                  )}
                  {a.status !== "active" && count > 0 && uncovered.length === 0 && (
                    <button onClick={() => setDistribute({ agent: a, status: a.status })} className="ms-auto shrink-0 font-bold text-jt hover:underline">
                      {t("editDistribution")}
                    </button>
                  )}
                </div>
                {a.status !== "active" && uncovered.length > 0 && (
                  <button
                    onClick={() => setDistribute({ agent: a, status: a.status })}
                    className="mt-3 flex w-full items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-start text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
                  >
                    <AlertTriangle className="size-4 shrink-0" />
                    <span className="flex-1">
                      <span className="ltr-nums">{uncovered.length}</span> {t("coverageWarn")}
                    </span>
                    <span className="text-jt">{t("setCover")}</span>
                  </button>
                )}
              </div>
            );
          })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.originalId ? `${t("edit")} · ${editing.name}` : `${t("add")} · ${t("agents")}`}
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
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl bg-bg p-3">
              <AgentAvatar agent={{ ...editing, id: editing.originalId || editing.id || "new" }} size={72} />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div>
                  <label className="label">{t("gender")}</label>
                  <Picker
                    value={editing.gender}
                    onChange={(v) => v && setEditing({ ...editing, gender: v as Agent["gender"] })}
                    searchable={false}
                    minWidth={190}
                    options={(["female", "male"] as const).map((g) => ({
                      value: g,
                      label: t(g),
                      leading: <AgentAvatar agent={{ name: t(g), gender: g, status: "active" }} size={28} showStatus={false} />,
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("agentName")} *</label>
                <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("agentId")} *</label>
                <input className="input ltr-nums" dir="ltr" value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("phone")}</label>
                <input className="input ltr-nums" dir="ltr" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("email")}</label>
                <input className="input" dir="ltr" type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <label className="label">{t("area")}</label>
                <input className="input" list="areas" value={editing.area ?? ""} onChange={(e) => setEditing({ ...editing, area: e.target.value })} />
                <datalist id="areas">
                  {areas.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">{t("status")}</label>
                <Picker
                  value={editing.status}
                  onChange={(v) => v && setEditing({ ...editing, status: v as AgentStatus })}
                  searchable={false}
                  minWidth={200}
                  options={(
                    [
                      ["active", t("active"), "bg-ok"],
                      ["leave", t("onLeave"), "bg-warn"],
                      ["off", t("off"), "bg-ink-3"],
                    ] as const
                  ).map(([v, label, dot]) => ({
                    value: v,
                    label,
                    leading: (
                      <span className="flex size-7 items-center justify-center rounded-full bg-bg">
                        <span className={cn("size-2.5 rounded-full", dot)} />
                      </span>
                    ),
                  }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">{t("coverAgent")}</label>
                <AgentSelect value={editing.coverAgentId} onChange={(v) => setEditing({ ...editing, coverAgentId: v })} exclude={editing.originalId ?? editing.id} />
                <p className="mt-1 text-xs text-ink-3">{t("coverAgentHint")}</p>
                {(() => {
                  if (editing.status === "active" || !editing.originalId) return null;
                  const n = uncoveredFor(editing.originalId, editing.coverAgentId).length;
                  if (!n) return null;
                  const cover = editing.coverAgentId ? store.agentById.get(editing.coverAgentId) : undefined;
                  return (
                    <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>
                        {cover ? (
                          t("coverUnavailable")
                        ) : (
                          <>
                            <span className="ltr-nums">{n}</span> {t("coverageBody")}
                          </>
                        )}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <DistributeModal target={distribute} onClose={() => setDistribute(null)} notify={notify} />
    </div>
  );
}
