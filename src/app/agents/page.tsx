"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Building2, LifeBuoy, Search, Users } from "lucide-react";
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((a, i) => {
          const branches = store.branches.filter((b) => b.agentIds.includes(a.id));
          const primaryCount = store.clients.filter((c) => c.agentId === a.id).length;
          const cover = a.coverAgentId ? store.agentById.get(a.coverAgentId) : undefined;
          const away = a.status !== "active";
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.45), type: "spring", damping: 22, stiffness: 220 }}
              className="min-w-0"
            >
              <Link
                href={`/agents/${encodeURIComponent(a.id)}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface shadow-[var(--shadow-card)] ring-1 ring-line transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] hover:ring-jt/30"
              >
                {/* red banner */}
                <div className="surface-glow relative h-24 overflow-hidden">
                  <div className="absolute -end-10 -top-12 size-36 rounded-full border-[14px] border-white/10 transition duration-500 group-hover:scale-125" />
                  <div className="absolute -end-2 top-10 size-16 rounded-full border-[6px] border-white/10 transition duration-500 group-hover:translate-x-2" />
                  <span className="ltr-nums pointer-events-none absolute -bottom-3 start-28 select-none text-5xl font-black tracking-tighter text-white/10">
                    {a.id.replace(/\D/g, "").slice(-4) || "J&T"}
                  </span>
                  <StatusBadge status={a.status} className="absolute end-3 top-3 shadow-sm" />
                </div>

                <div className="relative flex flex-1 flex-col px-5">
                  <div className="-mt-11 flex items-end justify-between">
                    <div className="rounded-full bg-surface p-1 shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-3deg]">
                      <AgentAvatar agent={a} size={84} />
                    </div>
                    <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-jt-50 text-jt transition duration-300 group-hover:bg-jt group-hover:text-white">
                      <ArrowUpRight className="size-5 rtl:-scale-x-100" />
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-1 text-lg font-black group-hover:text-jt">{a.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-3">
                    <span className="ltr-nums">#{a.id}</span>
                    {a.area && (
                      <>
                        <span className="size-1 rounded-full bg-line" />
                        <span className="truncate">{a.area}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 rounded-2xl bg-bg py-3">
                    <div className="flex flex-col items-center border-e border-line">
                      <span className="ltr-nums text-2xl font-black leading-none">{primaryCount}</span>
                      <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-ink-3">
                        <Users className="size-3" />
                        {t("clients")}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="ltr-nums text-2xl font-black leading-none">{branches.length}</span>
                      <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-ink-3">
                        <Building2 className="size-3" />
                        {t("branches")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
                    {branches.slice(0, 2).map((b) => (
                      <span key={b.id} dir="ltr" className="max-w-[48%] truncate rounded-md bg-jt-50 px-2 py-0.5 text-[11px] font-bold text-jt-700">
                        {b.name}
                      </span>
                    ))}
                    {branches.length > 2 && (
                      <span className="ltr-nums rounded-md bg-bg px-2 py-0.5 text-[11px] font-bold text-ink-2">+{branches.length - 2}</span>
                    )}
                  </div>
                </div>

                {/* coverage footer */}
                <div
                  className={cn(
                    "mt-4 flex items-center gap-2 border-t px-5 py-3 text-xs font-bold",
                    away && !cover ? "border-amber-200 bg-amber-50 text-amber-800" : "border-line text-ink-3",
                  )}
                >
                  {cover ? (
                    <>
                      <LifeBuoy className="size-3.5 shrink-0 text-jt" />
                      <span className="shrink-0">{t("coverAgent")}:</span>
                      <AgentAvatar agent={cover} size={22} showStatus={false} />
                      <span className="truncate text-ink">{cover.name}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className={cn("size-3.5 shrink-0", away ? "text-amber-600" : "text-ink-3")} />
                      {t("noCoverSet")}
                    </>
                  )}
                </div>

                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left rtl:origin-right scale-x-0 bg-jt transition-transform duration-500 group-hover:scale-x-100" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
