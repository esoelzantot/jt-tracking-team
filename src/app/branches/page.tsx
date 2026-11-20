"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, ChevronDown, MapPin, Package, Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Picker } from "@/components/Picker";
import { NoDataState, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Agent } from "@/lib/types";
import { cn, fmt, normalize } from "@/lib/utils";

type Sort = "volume" | "customers" | "name";

export default function BranchesPage() {
  const { t, lang } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("all");
  const [sort, setSort] = useState<Sort>("volume");
  const [open, setOpen] = useState<string | null>(null);
  const areas = useMemo(() => [...new Set(store.branches.map((b) => b.area).filter(Boolean))], [store.branches]);
  const max = Math.max(1, ...store.branches.map((b) => b.avgShipmentsPerDay));

  const list = useMemo(() => {
    const nq = normalize(q);
    return store.branches
      .filter((b) => area === "all" || b.area === area)
      .filter((b) => !nq || normalize(b.name).includes(nq))
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : sort === "customers" ? b.totalCustomers - a.totalCustomers : b.avgShipmentsPerDay - a.avgShipmentsPerDay,
      );
  }, [store.branches, q, area, sort]);

  if (!store.loading && !store.branches.length) return <NoDataState />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">{t("branches")}</h1>
          <p className="text-sm text-ink-2">
            <span className="ltr-nums font-bold">{fmt(store.branches.length, lang)}</span> {t("branches")} ·{" "}
            <span className="ltr-nums font-bold">{fmt(store.branches.reduce((s, b) => s + b.avgShipmentsPerDay, 0), lang)}</span> {t("shipments")}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("search")}…`} className="input ps-9" />
          </div>
          <div className="w-52 shrink-0">
            <Picker
              value={sort}
              onChange={(v) => v && setSort(v as Sort)}
              searchable={false}
              minWidth={220}
              options={[
                { value: "volume", label: t("avgPerDay"), icon: Package },
                { value: "customers", label: t("totalCustomers"), icon: Users },
                { value: "name", label: "A–Z", icon: ArrowDownWideNarrow },
              ].map((o) => ({
                value: o.value,
                label: o.label,
                leading: (
                  <span className="flex size-7 items-center justify-center rounded-lg bg-jt-50 text-jt">
                    <o.icon className="size-3.5" />
                  </span>
                ),
              }))}
            />
          </div>
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

      <div className="card divide-y divide-line overflow-hidden">
        {list.map((b) => {
          const agents = b.agentIds.map((id) => store.agentById.get(id)).filter(Boolean) as Agent[];
          const clients = store.clients.filter((c) => c.branchId === b.id);
          const isOpen = open === b.id;
          return (
            <div key={b.id}>
              <button onClick={() => setOpen(isOpen ? null : b.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 text-start transition hover:bg-bg sm:grid-cols-[1.4fr_1fr_auto_auto]">
                <div className="min-w-0">
                  <div className="truncate font-extrabold">{b.name}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-3">
                    <MapPin className="size-3" />
                    {b.area || "—"}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                    <span className="flex items-center gap-1">
                      <Package className="size-3.5" />
                      <span className="ltr-nums">{fmt(b.avgShipmentsPerDay, lang)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      <span className="ltr-nums">{b.totalCustomers}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-jt to-pinky"
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.avgShipmentsPerDay / max) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {agents.slice(0, 4).map((a) => (
                    <AgentAvatar key={a.id} agent={a} size={34} showStatus={false} className="rounded-full ring-2 ring-white" />
                  ))}
                  {!agents.length && <span className="text-xs font-bold text-amber-700">{t("noAgent")}</span>}
                </div>
                <ChevronDown className={cn("hidden size-4 text-ink-3 transition sm:block", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-bg/60">
                    <div className="grid gap-4 p-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-xs font-extrabold uppercase text-ink-3">{t("agents")}</div>
                        {agents.map((a) => (
                          <Link key={a.id} href={`/agents/${encodeURIComponent(a.id)}`} className="flex items-center gap-3 rounded-xl bg-surface p-2.5 ring-1 ring-line hover:ring-jt/40">
                            <AgentAvatar agent={a} size={40} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold">{a.name}</div>
                              <div className="ltr-nums text-xs text-ink-3">#{a.id}</div>
                            </div>
                            <StatusBadge status={a.status} />
                          </Link>
                        ))}
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-extrabold uppercase text-ink-3">
                          {t("clients")} (<span className="ltr-nums">{clients.length}</span>)
                        </div>
                        <div className="scroll-thin flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
                          {clients.map((c) => (
                            <Link key={c.id} href={`/?q=${encodeURIComponent(c.code)}`} className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold ring-1 ring-line hover:text-jt hover:ring-jt/40">
                              {c.name}
                            </Link>
                          ))}
                          {!clients.length && <span className="text-sm text-ink-3">—</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
