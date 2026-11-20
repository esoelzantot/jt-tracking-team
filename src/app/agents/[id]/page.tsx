"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { CopyButton, EmptyState, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Agent, Client } from "@/lib/types";
import { cn, coverageOf, hashString, normalize } from "@/lib/utils";

/** Animated number that counts up from 0. */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="ltr-nums">{n}</span>;
}

/** Decorative barcode generated from the agent ID. */
function Barcode({ value }: { value: string }) {
  const bars = useMemo(() => {
    const out: { x: number; w: number }[] = [];
    let x = 0;
    const seed = hashString(value);
    for (let i = 0; i < 46; i++) {
      const w = 1 + (((seed >>> (i % 28)) + value.charCodeAt(i % value.length)) % 3);
      if (i % 2 === 0) out.push({ x, w });
      x += w + 1;
    }
    return { out, width: x };
  }, [value]);
  return (
    <svg viewBox={`0 0 ${bars.width} 24`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      {bars.out.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="24" fill="currentColor" />
      ))}
    </svg>
  );
}

const MONO = ["from-jt to-jt-700", "from-[#F0566A] to-jt-600", "from-[#FF8A7A] to-jt", "from-jt-600 to-[#8E1C27]"];

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const agentId = decodeURIComponent(id);
  const { t, dir } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"primary" | "support">("primary");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const agent = store.agentById.get(agentId);

  const branches = useMemo(() => store.branches.filter((b) => b.agentIds.includes(agentId)), [store.branches, agentId]);
  const primary = useMemo(() => store.clients.filter((c) => c.agentId === agentId), [store.clients, agentId]);
  const coveredAgents = useMemo(() => store.agents.filter((a) => a.coverAgentId === agentId), [store.agents, agentId]);
  // support = clients that name this agent as support + clients of agents this person covers by default
  const support = useMemo(() => {
    const set = new Map<string, Client>();
    for (const c of store.clients) {
      if (c.supportAgentId === agentId) set.set(c.id, c);
      else if (!c.supportAgentId && coveredAgents.some((a) => a.id === c.agentId)) set.set(c.id, c);
    }
    return [...set.values()];
  }, [store.clients, coveredAgents, agentId]);

  const source = tab === "primary" ? primary : support;
  const branchCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of source) if (c.branchId) m.set(c.branchId, (m.get(c.branchId) ?? 0) + 1);
    return m;
  }, [source]);
  // sidebar: this agent's branches + any other branch their clients come from
  const sideBranches = useMemo(() => {
    const ids = new Set([...branches.map((b) => b.id), ...branchCounts.keys()]);
    return [...ids]
      .map((bid) => store.branchById.get(bid))
      .filter((b): b is NonNullable<typeof b> => Boolean(b))
      .sort((a, b) => (branchCounts.get(b.id) ?? 0) - (branchCounts.get(a.id) ?? 0) || a.name.localeCompare(b.name));
  }, [branches, branchCounts, store.branchById]);

  const list = source
    .filter((c) => branchFilter === "all" || c.branchId === branchFilter)
    .filter((c) => !q || normalize(c.name).includes(normalize(q)) || c.code.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cov = useMemo(() => coverageOf(agentId, store), [agentId, store]);
  // agents whose clients this agent backs up (per-client support or default cover), with counts
  const coversFor = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of support) if (c.agentId) m.set(c.agentId, (m.get(c.agentId) ?? 0) + 1);
    return [...m.entries()].map(([id, n]) => ({ agent: store.agentById.get(id), n })).filter((x) => x.agent) as { agent: Agent; n: number }[];
  }, [support, store.agentById]);
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const Flow = dir === "rtl" ? ArrowLeft : ArrowRight;

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

  const away = agent.status !== "active";
  const coverOk = cov.groups.some((g) => g.agent.status === "active") && cov.uncovered === 0;
  const single = cov.groups.length === 1 && cov.uncovered === 0 ? cov.groups[0].agent : null;
  const maxCount = Math.max(1, ...sideBranches.map((b) => branchCounts.get(b.id) ?? 0));

  return (
    <div className="space-y-6">
      <Link href="/agents" className="btn btn-ghost !px-2">
        <Back className="size-4" />
        {t("agents")}
      </Link>

      {away && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ring-1",
            coverOk ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-jt-50 text-jt-700 ring-jt/20",
          )}
        >
          <AlertTriangle className="size-5 shrink-0" />
          <span>
            {agent.name} {coverOk ? t("awayBanner") : t("awayNoCover")}
          </span>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- HERO */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Employee badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: dir === "rtl" ? 1.5 : -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 160 }}
          className="relative min-w-0"
        >
          <div className="card relative overflow-hidden !rounded-[1.75rem]">
            <div className="surface-glow relative h-28">
              <div className="absolute left-1/2 top-3 h-2 w-14 -translate-x-1/2 rounded-full bg-white/40" />
              <Image
                src="/brand/logo-square.jpg"
                alt="J&T Express"
                width={36}
                height={36}
                className="absolute start-4 top-4 size-9 rounded-lg ring-2 ring-white/40"
              />
              <span className="absolute end-4 top-5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold text-white backdrop-blur">
                {t("employeeBadge")}
              </span>
            </div>
            <div className="-mt-16 flex flex-col items-center px-5 pb-5 text-center">
              <div className="rounded-full bg-surface p-1.5 shadow-xl">
                <AgentAvatar agent={agent} size={124} />
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight">{agent.name}</h1>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="ltr-nums rounded-lg bg-bg px-2.5 py-1 text-sm font-black">#{agent.id}</span>
                <CopyButton value={agent.id} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <StatusBadge status={agent.status} />
                {agent.area && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-jt-50 px-2.5 py-0.5 text-xs font-bold text-jt-700 ring-1 ring-jt/15">
                    <MapPin className="size-3" />
                    {agent.area}
                  </span>
                )}
              </div>
              {(agent.phone || agent.email) && (
                <div className="mt-4 grid w-full grid-cols-2 gap-2">
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className={cn("btn btn-soft", !agent.email && "col-span-2")}>
                      <Phone className="size-4" />
                      <span className="ltr-nums truncate">{agent.phone}</span>
                    </a>
                  )}
                  {agent.email && (
                    <a href={`mailto:${agent.email}`} className={cn("btn btn-soft", !agent.phone && "col-span-2")}>
                      <Mail className="size-4" />
                      <span className="truncate">{agent.email}</span>
                    </a>
                  )}
                </div>
              )}
              <div className="mt-5 w-full border-t border-dashed border-line pt-4 text-ink">
                <Barcode value={agent.id} />
                <div className="ltr-nums mt-1 text-[10px] font-bold tracking-[0.4em] text-ink-3">{agent.id}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portfolio panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="surface-glow relative flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] p-6 shadow-[var(--shadow-lift)] sm:p-8"
        >
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white ring-1 ring-white/20">
              <ShieldCheck className="size-3.5" />
              {t("portfolio")}
            </div>
            <p className="mt-2 text-sm text-white/80">{t("portfolioSub")}</p>
          </div>

          <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch rounded-2xl bg-white/10 py-5 ring-1 ring-white/15">
            {[
              { label: t("primaryClients"), value: primary.length, icon: Users },
              { label: t("supportClients"), value: support.length, icon: LifeBuoy },
              { label: t("branches"), value: branches.length, icon: Building2 },
            ].flatMap((s, i) => [
              ...(i ? [<div key={`d${i}`} className="divider-glow" />] : []),
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex flex-col items-center px-2 text-center"
              >
                <s.icon className="mb-2 size-4 text-white/85" />
                <span className="text-3xl font-black leading-none text-white sm:text-5xl">
                  <CountUp value={s.value} />
                </span>
                <div className="mt-2 text-xs font-bold text-white/80 sm:text-sm">{s.label}</div>
                <span className="mt-3 h-0.5 w-7 rounded-full bg-white/70" />
              </motion.div>,
            ])}
          </div>

          {/* Coverage: who takes over when this agent is away */}
          <div className="relative mt-auto pt-5">
            <div className="rounded-2xl bg-surface p-4 text-ink shadow-xl shadow-black/10">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-ink-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-jt-50 text-jt">
                  <LifeBuoy className="size-4" />
                </span>
                {t("ifAway")}
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                {/* from */}
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-bg p-2.5">
                  <AgentAvatar agent={agent} size={42} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold">{agent.name}</div>
                    <StatusBadge status={agent.status} className="mt-0.5" />
                  </div>
                </div>

                {/* connector */}
                <div className="flex items-center justify-center">
                  <span className="relative flex size-9 items-center justify-center rounded-full bg-jt text-white shadow-md shadow-jt/30">
                    {cov.groups.length > 0 && <span className="absolute inset-0 animate-ping rounded-full bg-jt/30" style={{ animationDuration: "2.2s" }} />}
                    <Flow className="relative hidden size-4 sm:block" />
                    <ArrowDown className="relative size-4 sm:hidden" />
                  </span>
                </div>

                {/* to */}
                {single ? (
                  <Link
                    href={`/agents/${encodeURIComponent(single.id)}`}
                    className="group flex min-w-0 items-center gap-2.5 rounded-xl bg-jt-50 p-2.5 ring-1 ring-jt/20 transition hover:ring-jt/50"
                  >
                    <AgentAvatar agent={single} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold group-hover:text-jt">{single.name}</div>
                      <div className="ltr-nums text-[11px] font-bold text-ink-3">#{single.id}</div>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-jt/60 transition group-hover:text-jt rtl:-scale-x-100" />
                  </Link>
                ) : cov.groups.length > 0 ? (
                  <div className="min-w-0 rounded-xl bg-jt-50 p-2.5 ring-1 ring-jt/20">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-jt-700">
                        {t("splitAcross")} <span className="ltr-nums">{cov.groups.length}</span> {t("agentsWord")}
                      </span>
                      <span className="flex -space-x-2 rtl:space-x-reverse">
                        {cov.groups.slice(0, 4).map((g) => (
                          <AgentAvatar key={g.agent.id} agent={g.agent} size={22} showStatus={false} className="rounded-full ring-2 ring-jt-50" />
                        ))}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {cov.groups.slice(0, 4).map((g) => (
                        <li key={g.agent.id}>
                          <Link
                            href={`/agents/${encodeURIComponent(g.agent.id)}`}
                            className="group flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-surface"
                          >
                            <AgentAvatar agent={g.agent} size={26} />
                            <span className="min-w-0 flex-1 truncate text-xs font-extrabold group-hover:text-jt">{g.agent.name}</span>
                            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-surface">
                              <span className="block h-full rounded-full bg-jt" style={{ width: `${(g.count / Math.max(1, cov.total)) * 100}%` }} />
                            </span>
                            <span className="ltr-nums min-w-5 text-end text-xs font-black">{g.count}</span>
                          </Link>
                        </li>
                      ))}
                      {cov.groups.length > 4 && (
                        <li className="px-1 text-[11px] font-bold text-ink-3">
                          +<span className="ltr-nums">{cov.groups.length - 4}</span> {t("more")}
                        </li>
                      )}
                      {cov.uncovered > 0 && (
                        <li className="flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-50 px-1.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                          <AlertTriangle className="size-3.5" />
                          <span className="ltr-nums">{cov.uncovered}</span> {t("withoutSupport")}
                          <Link href="/dashboard?tab=agents" className="ms-auto text-jt hover:underline">
                            {t("setCover")}
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-dashed border-warn/60 bg-amber-50 p-2.5">
                    <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <AlertTriangle className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-amber-800">{t("noCoverSet")}</div>
                      <Link href="/dashboard?tab=agents" className="text-[11px] font-bold text-jt hover:underline">
                        {t("setCover")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {coversFor.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-xs font-bold text-ink-3">{t("coversFor")}:</span>
                  {coversFor.map(({ agent: a, n }) => (
                    <Link
                      key={a.id}
                      href={`/agents/${encodeURIComponent(a.id)}`}
                      className="flex items-center gap-1.5 rounded-full bg-bg py-0.5 pe-1 ps-0.5 text-xs font-bold ring-1 ring-line hover:ring-jt/40"
                    >
                      <AgentAvatar agent={a} size={24} showStatus={false} />
                      {a.name}
                      <span className="ltr-nums rounded-full bg-jt-50 px-1.5 text-[10px] text-jt-700">{n}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------------- BODY: sidebar + clients */}
      <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_1fr]">
        {/* Branches sidebar */}
        <aside className="card min-w-0 overflow-hidden lg:sticky lg:top-20">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-jt-50 text-jt">
              <Building2 className="size-4" />
            </div>
            <span className="font-extrabold">{t("branches")}</span>
            <span className="ltr-nums ms-auto rounded-full bg-bg px-2 text-xs font-bold text-ink-2">{sideBranches.length}</span>
          </div>
          <nav className="scroll-thin max-h-64 space-y-1 overflow-y-auto p-2 lg:max-h-[calc(100dvh-12rem)]">
            {[{ id: "all", name: t("allBranches"), count: source.length, shared: false }, ...sideBranches.map((b) => ({ id: b.id, name: b.name, count: branchCounts.get(b.id) ?? 0, shared: b.agentIds.length > 1 }))].map(
              (b) => {
                const active = branchFilter === b.id;
                const isAll = b.id === "all";
                return (
                  <button
                    key={b.id}
                    onClick={() => setBranchFilter(active && !isAll ? "all" : b.id)}
                    className={cn(
                      "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-start text-sm transition",
                      active ? "bg-jt-50 text-jt-700 ring-1 ring-jt/25" : "text-ink-2 hover:bg-bg",
                      !isAll && b.count === 0 && !active && "opacity-55",
                    )}
                  >
                    {active && <span className="absolute inset-y-2 start-0 w-1 rounded-e-full bg-jt" />}
                    {!isAll && b.count > 0 && (
                      <span
                        className={cn("pointer-events-none absolute bottom-1 start-3 h-0.5 rounded-full", active ? "bg-jt" : "bg-jt/25")}
                        style={{ width: `calc((100% - 1.5rem) * ${b.count / maxCount})` }}
                      />
                    )}
                    <span className={cn("relative flex-1 truncate font-bold", isAll && "font-extrabold")} dir={isAll ? undefined : "ltr"}>
                      {b.name}
                    </span>
                    {b.shared && (
                      <span title={t("sharedBranch")} className="relative">
                        <Users className="size-3.5 opacity-60" />
                      </span>
                    )}
                    <span
                      className={cn(
                        "ltr-nums relative min-w-7 rounded-full px-1.5 text-center text-xs font-black",
                        active ? "bg-jt text-white" : "bg-surface ring-1 ring-line",
                      )}
                    >
                      {b.count}
                    </span>
                  </button>
                );
              },
            )}
          </nav>
        </aside>

        {/* Clients */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-line">
              {(["primary", "support"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setTab(k);
                    setBranchFilter("all");
                  }}
                  className={cn("relative rounded-xl px-4 py-2 text-sm font-bold transition-colors", tab === k ? "text-white" : "text-ink-2 hover:text-ink")}
                >
                  {tab === k && <motion.span layoutId="agent-tab" className="absolute inset-0 rounded-xl bg-jt shadow-md shadow-jt/30" />}
                  <span className="relative">
                    {k === "primary" ? t("primaryClients") : t("supportClients")}{" "}
                    <span className="ltr-nums opacity-75">({k === "primary" ? primary.length : support.length})</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("search")}…`} className="input ps-9" />
            </div>
          </div>

          {list.length ? (
            <div key={tab + branchFilter} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {list.map((c, i) => {
                  const branch = c.branchId ? store.branchById.get(c.branchId) : undefined;
                  const otherId = tab === "primary" ? c.supportAgentId : c.agentId;
                  const other: Agent | undefined = otherId ? store.agentById.get(otherId) : undefined;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.25) }}
                      className="min-w-0"
                    >
                      <Link
                        href={`/?q=${encodeURIComponent(c.code)}`}
                        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-3.5 transition hover:-translate-y-0.5 hover:border-jt/30 hover:shadow-[var(--shadow-lift)]"
                      >
                        <div
                          className={cn(
                            "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-lg font-black text-white shadow-md shadow-jt/20",
                            MONO[hashString(c.id) % MONO.length],
                          )}
                        >
                          {c.name.trim()[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-extrabold group-hover:text-jt">{c.name}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                            <span className="ltr-nums font-bold text-ink-2">{c.code}</span>
                            <CopyButton value={c.code} className="!p-0.5" />
                          </div>
                          {branch && (
                            <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-bg px-1.5 py-0.5 text-[11px] font-bold text-ink-3">
                              <Building2 className="size-3 shrink-0" />
                              <span className="truncate" dir="ltr">
                                {branch.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <ArrowUpRight className="size-4 text-line transition group-hover:text-jt rtl:-scale-x-100" />
                          {other && (
                            <span title={other.name}>
                              <AgentAvatar agent={other} size={26} />
                            </span>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-ink-3">
              <Users className="size-8 text-line" />
              {t("noResults")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
