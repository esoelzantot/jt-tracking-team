"use client";

import { motion } from "framer-motion";
import { Building2, Check, Eraser, Shuffle, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Agent, AgentStatus, Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgentSelect } from "./AgentSelect";

export interface DistributeTarget {
  agent: Agent;
  status: AgentStatus;
}

/**
 * When an agent goes on leave / off, their clients are spread over other agents:
 * every client gets its own support agent (manually or with "distribute evenly").
 */
export function DistributeModal({
  target,
  onClose,
  notify,
}: {
  target: DistributeTarget | null;
  onClose: () => void;
  notify: (m: string) => void;
}) {
  const { t } = useI18n();
  const store = useStore();
  const [assign, setAssign] = useState<Record<string, string | null>>({});
  const [pool, setPool] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const agentId = target?.agent.id;
  const clients = useMemo(
    () =>
      agentId
        ? store.clients
            .filter((c) => c.agentId === agentId)
            .sort((a, b) => (a.branchId ?? "").localeCompare(b.branchId ?? "") || a.name.localeCompare(b.name))
        : [],
    [store.clients, agentId],
  );
  const myBranchIds = useMemo(
    () => new Set(store.branches.filter((b) => agentId && b.agentIds.includes(agentId)).map((b) => b.id)),
    [store.branches, agentId],
  );
  // candidate agents: active, not this agent; same-branch agents first
  const candidates = useMemo(() => {
    const sameBranch = new Set(store.branches.filter((b) => myBranchIds.has(b.id)).flatMap((b) => b.agentIds));
    return store.agents
      .filter((a) => a.id !== agentId && a.status === "active")
      .sort((a, b) => Number(!sameBranch.has(a.id)) - Number(!sameBranch.has(b.id)) || a.name.localeCompare(b.name))
      .map((a) => ({ agent: a, suggested: sameBranch.has(a.id) }));
  }, [store.agents, store.branches, myBranchIds, agentId]);

  // init state whenever a new target opens
  useEffect(() => {
    if (!target) return;
    const init: Record<string, string | null> = {};
    for (const c of store.clients) if (c.agentId === target.agent.id) init[c.id] = c.supportAgentId;
    setAssign(init);
    setPool(new Set(candidates.filter((c) => c.suggested).map((c) => c.agent.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.agent.id]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of Object.values(assign)) if (v) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  }, [assign]);
  const assigned = clients.filter((c) => assign[c.id]).length;

  const distribute = () => {
    if (!pool.size) return notify(t("pickAgents"));
    const load = new Map([...pool].map((id) => [id, 0]));
    const next: Record<string, string | null> = { ...assign };
    for (const c of clients) {
      const branch = c.branchId ? store.branchById.get(c.branchId) : undefined;
      const sameBranch = [...pool].filter((id) => branch?.agentIds.includes(id));
      const options = sameBranch.length ? sameBranch : [...pool];
      const pick = options.reduce((best, id) => (load.get(id)! < load.get(best)! ? id : best), options[0]);
      next[c.id] = pick;
      load.set(pick, load.get(pick)! + 1);
    }
    setAssign(next);
  };

  const save = async (withAssignments: boolean) => {
    if (!target) return;
    setBusy(true);
    try {
      if (withAssignments) {
        const changed: Client[] = clients.filter((c) => (assign[c.id] ?? null) !== c.supportAgentId).map((c) => ({ ...c, supportAgentId: assign[c.id] ?? null }));
        if (changed.length) await store.repo.bulkWrite({ clients: changed, agents: [], branches: [] }, false);
      }
      await store.repo.upsert("agents", { ...target.agent, status: target.status });
      notify(t("saved"));
      onClose();
    } catch (e) {
      notify(`${t("error")}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  let lastBranch: string | null | undefined;

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      wide
      title={t("distributeTitle")}
      footer={
        <>
          <button onClick={() => save(false)} disabled={busy} className="btn btn-ghost">
            {t("skipForNow")}
          </button>
          <button onClick={() => save(true)} disabled={busy} className="btn btn-primary">
            <Check className="size-4" />
            {t("saveDistribution")}
          </button>
        </>
      }
    >
      {target && (
        <div className="space-y-5">
          {/* who is going away */}
          <div className="surface-glow relative overflow-hidden rounded-2xl p-4">
            <div className="relative flex items-center gap-3">
              <AgentAvatar agent={{ ...target.agent, status: target.status }} size={56} className="rounded-full ring-2 ring-white/40" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-black">{target.agent.name}</div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold ring-1 ring-white/20">
                  <span className={cn("size-1.5 rounded-full", target.status === "leave" ? "bg-warn" : "bg-white/60")} />
                  {target.status === "leave" ? t("onLeave") : t("off")}
                </div>
              </div>
              <div className="text-center">
                <div className="ltr-nums text-3xl font-black leading-none">{clients.length}</div>
                <div className="text-[11px] font-bold text-white/80">{t("clients")}</div>
              </div>
            </div>
            <p className="relative mt-3 text-xs font-semibold text-white/85">{t("distributeBody")}</p>
          </div>

          {/* pool + distribute */}
          <section className="rounded-2xl bg-bg p-3.5">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-extrabold">
                <Users className="size-4 text-jt" />
                {t("distributePool")}
                <span className="ltr-nums rounded-full bg-surface px-1.5 text-xs text-ink-2 ring-1 ring-line">{pool.size}</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setAssign(Object.fromEntries(clients.map((c) => [c.id, null])))} className="btn btn-ghost !px-2.5 !py-1.5 text-xs">
                  <Eraser className="size-3.5" />
                  {t("clearAll")}
                </button>
                <button onClick={distribute} className="btn btn-primary !py-1.5 text-xs">
                  <Shuffle className="size-3.5" />
                  {t("distributeEven")}
                </button>
              </div>
            </div>
            <div className="scroll-thin flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
              {candidates.map(({ agent: a, suggested }) => {
                const on = pool.has(a.id);
                const n = counts.get(a.id) ?? 0;
                return (
                  <motion.button
                    key={a.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setPool((p) => {
                        const s = new Set(p);
                        if (s.has(a.id)) s.delete(a.id);
                        else s.add(a.id);
                        return s;
                      })
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full py-1 pe-2.5 ps-1 text-xs font-bold transition",
                      on ? "bg-jt text-white shadow-md shadow-jt/25" : "bg-surface text-ink-2 ring-1 ring-line hover:ring-jt/40",
                    )}
                  >
                    <AgentAvatar agent={a} size={24} showStatus={false} />
                    <span className="max-w-[130px] truncate">{a.name}</span>
                    {suggested && !on && <Building2 className="size-3 text-jt" />}
                    {n > 0 && (
                      <span className={cn("ltr-nums rounded-full px-1.5 text-[10px]", on ? "bg-white/25" : "bg-jt-50 text-jt-700")}>{n}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] font-semibold text-ink-3">{t("distributeHint")}</p>
          </section>

          {/* progress */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
              <span className="text-ink-2">
                <span className="ltr-nums text-ink">
                  {assigned}/{clients.length}
                </span>{" "}
                {t("assignedOf")}
              </span>
              <span className="ltr-nums text-jt">{clients.length ? Math.round((assigned / clients.length) * 100) : 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-jt to-pinky"
                animate={{ width: `${clients.length ? (assigned / clients.length) * 100 : 0}%` }}
                transition={{ type: "spring", damping: 24, stiffness: 200 }}
              />
            </div>
          </div>

          {/* per-client assignment */}
          <ul className="space-y-1.5">
            {clients.map((c) => {
              const branch = c.branchId ? store.branchById.get(c.branchId) : undefined;
              const header = c.branchId !== lastBranch;
              lastBranch = c.branchId;
              const done = !!assign[c.id];
              return (
                <li key={c.id}>
                  {header && (
                    <div className="mb-1.5 mt-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink-3 first:mt-0">
                      <Building2 className="size-3.5 text-jt" />
                      <span dir="ltr">{branch?.name ?? "—"}</span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "grid grid-cols-1 items-center gap-2 rounded-2xl p-2 ring-1 transition sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
                      done ? "bg-surface ring-line" : "bg-amber-50/60 ring-amber-200",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                          done ? "bg-jt text-white" : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {done ? <Check className="size-4" /> : c.name.trim()[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold">{c.name}</div>
                        <div className="ltr-nums text-[11px] font-bold text-ink-3">{c.code}</div>
                      </div>
                    </div>
                    <AgentSelect
                      size="sm"
                      value={assign[c.id] ?? null}
                      onChange={(v) => setAssign((s) => ({ ...s, [c.id]: v }))}
                      exclude={target.agent.id}
                      preferIds={branch?.agentIds.filter((id) => store.agentById.get(id)?.status === "active")}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
