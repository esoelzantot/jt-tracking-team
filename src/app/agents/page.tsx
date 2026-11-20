"use client";

import { motion } from "framer-motion";
import { Building2, Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { NoDataState, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn, fmt, normalize } from "@/lib/utils";

export default function AgentsPage() {
  const { t, lang } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("all");
  const areas = useMemo(() => [...new Set(store.agents.map((a) => a.area).filter(Boolean))] as string[], [store.agents]);

  const list = useMemo(() => {
    const nq = normalize(q);
    return store.agents
      .filter((a) => area === "all" || a.area === area)
      .filter((a) => !nq || normalize(a.name).includes(nq) || a.id.includes(nq))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [store.agents, q, area]);

  if (!store.loading && !store.agents.length) return <NoDataState />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">{t("agents")}</h1>
          <p className="text-sm text-ink-2">
            <span className="ltr-nums font-bold">{fmt(store.agents.length, lang)}</span> {t("agents")}
          </p>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("search")}…`} className="input ps-9" />
        </div>
      </div>

      <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["all", ...areas].map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={cn("btn !rounded-full !py-1.5 text-sm", area === a ? "btn-primary" : "bg-surface text-ink-2 ring-1 ring-line")}
          >
            {a === "all" ? t("filterAll") : a}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((a, i) => {
          const branches = store.branches.filter((b) => b.agentIds.includes(a.id));
          const clients = store.clientsByAgent.get(a.id) ?? [];
          const primaryCount = clients.filter((c) => c.agentId === a.id).length;
          const volume = branches.reduce((s, b) => s + b.avgShipmentsPerDay / Math.max(1, b.agentIds.length), 0);
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}>
              <Link
                href={`/agents/${encodeURIComponent(a.id)}`}
                className="card group relative block overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-br from-jt-50 to-transparent" />
                <div className="relative flex flex-col items-center text-center">
                  <AgentAvatar agent={a} size={96} className="transition group-hover:scale-105" />
                  <h3 className="mt-3 line-clamp-1 font-extrabold">{a.name}</h3>
                  <div className="ltr-nums text-xs font-bold text-ink-3">#{a.id}</div>
                  <StatusBadge status={a.status} className="mt-2" />
                </div>
                <div className="relative mt-4 grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-xl bg-bg py-2">
                    <div className="ltr-nums text-base font-black">{branches.length}</div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-ink-3">
                      <Building2 className="size-3" />
                      {t("branches")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-bg py-2">
                    <div className="ltr-nums text-base font-black">{primaryCount}</div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-ink-3">
                      <Users className="size-3" />
                      {t("clients")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-jt-50 py-2 text-jt-700">
                    <div className="ltr-nums text-base font-black">{fmt(Math.round(volume), lang)}</div>
                    <div className="text-[10px] font-bold">{t("perDay")}</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
