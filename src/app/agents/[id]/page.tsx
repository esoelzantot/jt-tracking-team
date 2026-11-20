"use client";

import { ArrowLeft, ArrowRight, Building2, LifeBuoy, Mail, Package, Phone, Search, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentChip } from "@/components/AgentChip";
import { CopyButton, EmptyState, Stat, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn, fmt, normalize } from "@/lib/utils";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const agentId = decodeURIComponent(id);
  const { t, lang, dir } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"primary" | "support">("primary");
  const agent = store.agentById.get(agentId);

  const branches = useMemo(() => store.branches.filter((b) => b.agentIds.includes(agentId)), [store.branches, agentId]);
  const all = useMemo(() => store.clientsByAgent.get(agentId) ?? [], [store.clientsByAgent, agentId]);
  const primary = all.filter((c) => c.agentId === agentId);
  // support = explicit support on the client + every client of agents this person covers by default
  const coveredAgents = store.agents.filter((a) => a.coverAgentId === agentId);
  const support = useMemo(() => {
    const set = new Map(all.filter((c) => c.supportAgentId === agentId).map((c) => [c.id, c]));
    for (const a of coveredAgents)
      for (const c of store.clients) if (c.agentId === a.id && !c.supportAgentId) set.set(c.id, c);
    return [...set.values()];
  }, [all, coveredAgents, store.clients, agentId]);

  const list = (tab === "primary" ? primary : support).filter(
    (c) => !q || normalize(c.name).includes(normalize(q)) || c.code.toLowerCase().includes(q.toLowerCase()),
  );
  const cover = agent?.coverAgentId ? store.agentById.get(agent.coverAgentId) : undefined;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (store.loading) return <div className="card h-96 animate-pulse" />;
  if (!agent)
    return (
      <EmptyState
        title="404"
        action={
          <Link href="/agents" className="btn btn-primary">
            {t("back")}
          </Link>
        }
      />
    );

  const volume = branches.reduce((s, b) => s + b.avgShipmentsPerDay, 0);

  return (
    <div className="space-y-5">
      <Link href="/agents" className="btn btn-ghost !px-2">
        <Back className="size-4" />
        {t("agents")}
      </Link>

      <section className="speed-stripes relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-8">
        <div className="absolute -end-20 -top-20 size-64 rounded-full bg-jt/40 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <AgentAvatar agent={agent} size={128} className="rounded-full ring-4 ring-white/15" />
          <div className="flex-1 text-center sm:text-start">
            <StatusBadge status={agent.status} />
            <h1 className="mt-2 text-3xl font-black">{agent.name}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
              <span className="ltr-nums rounded-lg bg-white/10 px-2.5 py-1 font-bold">#{agent.id}</span>
              <CopyButton value={agent.id} label={t("copy")} className="text-white/70 hover:!bg-white/10 hover:!text-white" />
              {agent.area && <span className="rounded-lg bg-jt px-2.5 py-1 text-xs font-bold">{agent.area}</span>}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="btn bg-white/10 text-white hover:bg-white/20">
                  <Phone className="size-4" />
                  <span className="ltr-nums">{agent.phone}</span>
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="btn bg-white/10 text-white hover:bg-white/20">
                  <Mail className="size-4" />
                  {agent.email}
                </a>
              )}
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-1">
            <Stat label={t("branches")} value={branches.length} icon={<Building2 className="size-3.5" />} accent />
            <Stat label={t("clients")} value={primary.length} icon={<Users className="size-3.5" />} accent />
            <Stat label={t("avgPerDay")} value={fmt(volume, lang)} icon={<Package className="size-3.5" />} accent />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-xl bg-bg p-1">
              {(["primary", "support"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-bold", tab === k ? "bg-surface text-jt shadow-sm" : "text-ink-2")}
                >
                  {k === "primary" ? t("asPrimary") : t("asSupport")}{" "}
                  <span className="ltr-nums text-xs opacity-70">({k === "primary" ? primary.length : support.length})</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-60">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("search")}…`} className="input !py-2 ps-9" />
            </div>
          </div>
          <ul className="scroll-thin max-h-[560px] divide-y divide-line overflow-y-auto">
            {list.map((c) => (
              <li key={c.id}>
                <Link href={`/?q=${encodeURIComponent(c.code)}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-jt-50">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-jt-50 text-sm font-black text-jt">
                    {c.name.trim()[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{c.name}</div>
                    <div className="ltr-nums text-xs text-ink-3">{c.code}</div>
                  </div>
                  <span className="hidden truncate text-xs font-semibold text-ink-2 sm:block">
                    {c.branchId ? store.branchById.get(c.branchId)?.name : ""}
                  </span>
                </Link>
              </li>
            ))}
            {!list.length && <li className="p-8 text-center text-sm text-ink-3">—</li>}
          </ul>
        </div>

        <div className="space-y-5">
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-extrabold">
              <LifeBuoy className="size-4 text-jt" />
              {t("coverAgent")}
            </div>
            {cover ? <AgentChip agent={cover} /> : <p className="text-sm text-ink-3">—</p>}
            {coveredAgents.length > 0 && (
              <>
                <div className="mb-2 mt-4 text-xs font-bold text-ink-2">{t("backups")}</div>
                <div className="flex flex-wrap gap-2">
                  {coveredAgents.map((a) => (
                    <Link key={a.id} href={`/agents/${encodeURIComponent(a.id)}`} className="flex items-center gap-2 rounded-full border border-line py-1 pe-3 ps-1 text-xs font-bold hover:border-jt/40">
                      <AgentAvatar agent={a} size={24} showStatus={false} />
                      {a.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-extrabold">
              <Building2 className="size-4 text-jt" />
              {t("branches")}
            </div>
            <ul className="space-y-2">
              {branches
                .slice()
                .sort((a, b) => b.avgShipmentsPerDay - a.avgShipmentsPerDay)
                .map((b) => {
                  const max = Math.max(...branches.map((x) => x.avgShipmentsPerDay), 1);
                  return (
                    <li key={b.id} className="rounded-xl bg-bg p-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-bold">{b.name}</span>
                        <span className="ltr-nums shrink-0 text-xs font-bold text-ink-2">
                          {fmt(b.avgShipmentsPerDay, lang)} {t("perDay")}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-jt" style={{ width: `${(b.avgShipmentsPerDay / max) * 100}%` }} />
                      </div>
                      {b.agentIds.length > 1 && (
                        <div className="mt-1.5 text-[11px] font-semibold text-amber-700">
                          {t("sharedBranch").replace(":", "")} ({b.agentIds.length})
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
