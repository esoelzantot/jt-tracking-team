"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Building2, Package, UserX, Users } from "lucide-react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/utils";

export function Overview({ go }: { go: (tab: string, filter?: string) => void }) {
  const { t, lang } = useI18n();
  const store = useStore();
  const unassigned = store.clients.filter((c) => !c.agentId).length;
  const away = store.agents.filter((a) => a.status !== "active");
  const awayNoCover = away.filter((a) => {
    const cover = a.coverAgentId ? store.agentById.get(a.coverAgentId) : undefined;
    return !cover || cover.status !== "active";
  });
  const volume = store.branches.reduce((s, b) => s + b.avgShipmentsPerDay, 0);
  const top = [...store.branches].sort((a, b) => b.avgShipmentsPerDay - a.avgShipmentsPerDay).slice(0, 8);
  const maxTop = Math.max(1, ...top.map((b) => b.avgShipmentsPerDay));
  const workload = store.agents
    .map((a) => ({ a, n: store.clients.filter((c) => c.agentId === a.id).length }))
    .sort((x, y) => y.n - x.n);
  const maxLoad = Math.max(1, ...workload.map((w) => w.n));

  const kpis = [
    { label: t("clients"), value: store.clients.length, icon: Users },
    { label: t("agents"), value: store.agents.length, icon: Users },
    { label: t("branches"), value: store.branches.length, icon: Building2 },
    { label: t("avgPerDay"), value: volume, icon: Package },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-3">{k.label}</span>
              <k.icon className="size-4 text-jt" />
            </div>
            <div className="ltr-nums mt-2 text-3xl font-black">{fmt(k.value, lang)}</div>
          </motion.div>
        ))}
      </div>

      {/* action items */}
      <div className="grid gap-3 md:grid-cols-2">
        <button onClick={() => go("clients", "unassigned")} className="card flex items-center gap-4 p-4 text-start transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <UserX className="size-6" />
          </div>
          <div className="flex-1">
            <div className="ltr-nums text-2xl font-black">{unassigned}</div>
            <div className="text-sm font-bold text-ink-2">{t("needsAssignment")}</div>
          </div>
          <span className="btn btn-soft">{t("assign")}</span>
        </button>
        <button onClick={() => go("agents")} className="card flex items-center gap-4 p-4 text-start transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-jt-50 text-jt">
            <AlertTriangle className="size-6" />
          </div>
          <div className="flex-1">
            <div className="ltr-nums text-2xl font-black">
              {awayNoCover.length} <span className="text-sm font-bold text-ink-3">/ {away.length}</span>
            </div>
            <div className="text-sm font-bold text-ink-2">
              {t("noSupport")} / {t("agentsAway")}
            </div>
          </div>
          <span className="btn btn-soft">{t("edit")}</span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-extrabold">{t("topBranches")}</h3>
          <ul className="space-y-3">
            {top.map((b, i) => (
              <li key={b.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate font-bold">{b.name}</span>
                  <span className="ltr-nums shrink-0 text-xs font-bold text-ink-2">{fmt(b.avgShipmentsPerDay, lang)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-jt to-pinky"
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.avgShipmentsPerDay / maxTop) * 100}%` }}
                    transition={{ delay: i * 0.05, duration: 0.7 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-extrabold">{t("workload")}</h3>
          <ul className="scroll-thin max-h-[340px] space-y-2.5 overflow-y-auto pe-1">
            {workload.map(({ a, n }) => (
              <li key={a.id} className="flex items-center gap-3">
                <AgentAvatar agent={a} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-bold">{a.name}</span>
                    {a.status !== "active" && <StatusBadge status={a.status} />}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(n / maxLoad) * 100}%` }} />
                  </div>
                </div>
                <span className="ltr-nums w-8 text-end text-sm font-black">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
