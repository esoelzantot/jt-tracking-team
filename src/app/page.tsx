"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, Clock, Search, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { ClientProfileCard } from "@/components/ClientProfileCard";
import { NoDataState, Rabbit } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { buildIndex } from "@/lib/search";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { cn, fmt, resolveOwnership } from "@/lib/utils";

const RECENT_KEY = "jt-hub:recent";

export default function SearchPage() {
  const { t, lang, dir } = useI18n();
  const store = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useMemo(() => buildIndex(store.clients), [store.clients]);
  const results = useMemo(() => search(q), [search, q]);
  const selected: Client | undefined = results[Math.min(active, results.length - 1)];

  // restore ?q= and recent searches
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) setQ(initial);
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    setActive(0);
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [q]);

  const remember = useCallback((c: Client) => {
    setRecent((prev) => {
      const next = [c.id, ...prev.filter((x) => x !== c.id)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // remember the shown profile once the user stops typing
  useEffect(() => {
    if (!selected) return;
    const id = setTimeout(() => remember(selected), 1200);
    return () => clearTimeout(id);
  }, [selected, remember]);

  // "/" focuses search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") setQ("");
    else if (e.key === "Enter" && selected) remember(selected);
  };

  const recentClients = recent.map((id) => store.clients.find((c) => c.id === id)).filter(Boolean) as Client[];
  const away = store.agents.filter((a) => a.status !== "active");
  const hasData = store.clients.length > 0;
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="speed-stripes relative overflow-hidden rounded-[2rem] bg-linear-to-br from-jt via-jt-600 to-jt-700 px-5 pb-8 pt-8 text-white shadow-[var(--shadow-lift)] sm:px-10 sm:pt-10">
        <div className="pointer-events-none absolute -bottom-24 -start-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute end-0 top-0 h-1 w-1/3 overflow-hidden">
          <div className="animate-dash h-full w-1/3 rounded-full bg-white/60" />
        </div>
        <div className="relative grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              {t("appName")} · {store.clients.length ? `${fmt(store.clients.length, lang)} ${t("clients")}` : t("loading")}
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">{t("tagline")}</h1>

            <div className="relative mt-6">
              <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("searchPlaceholder")}
                className="h-16 w-full rounded-2xl border-0 bg-white pe-12 ps-12 text-base font-semibold text-ink shadow-2xl outline-none ring-4 ring-white/20 placeholder:font-medium placeholder:text-ink-3 focus:ring-white/40 sm:text-lg"
                aria-label={t("search")}
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
              />
              {q ? (
                <button onClick={() => setQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-3 hover:bg-bg" aria-label="Clear">
                  <X className="size-5" />
                </button>
              ) : (
                <kbd className="absolute end-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-line px-2 py-0.5 text-xs font-bold text-ink-3 sm:block">/</kbd>
              )}
            </div>
            <p className="mt-2.5 text-xs font-semibold text-white/70">{t("searchHint")} · ↑ ↓</p>
          </div>
          <Rabbit size={170} float className="hidden md:block" />
        </div>
      </section>

      {store.loading ? (
        <div className="grid gap-4 md:grid-cols-[360px_1fr]">
          <div className="card h-80 animate-pulse" />
          <div className="card h-80 animate-pulse" />
        </div>
      ) : !hasData ? (
        <NoDataState />
      ) : q ? (
        <div className="grid items-start gap-4 lg:grid-cols-[380px_1fr]">
          {/* results */}
          <div className="card overflow-hidden lg:sticky lg:top-20">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs font-bold text-ink-3">
              <span>
                <span className="ltr-nums text-ink">{fmt(results.length, lang)}</span> {t("results")}
              </span>
            </div>
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <Rabbit size={70} />
                <div className="font-extrabold">{t("noResults")}</div>
                <div className="text-sm text-ink-2">{t("noResultsHint")}</div>
              </div>
            ) : (
              <ul id="search-results" role="listbox" className="scroll-thin max-h-[60vh] overflow-y-auto p-2">
                {results.map((c, i) => {
                  const own = resolveOwnership(c, store);
                  const branch = c.branchId ? store.branchById.get(c.branchId) : undefined;
                  return (
                    <li key={c.id} role="option" aria-selected={i === active}>
                      <button
                        onClick={() => {
                          setActive(i);
                          remember(c);
                        }}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition",
                          i === active ? "bg-jt-50 ring-1 ring-jt/25" : "hover:bg-bg",
                        )}
                      >
                        {own.current ? (
                          <AgentAvatar agent={own.current} size={38} />
                        ) : (
                          <div className="flex size-[38px] items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">?</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-extrabold">{c.name || "—"}</div>
                          <div className="flex items-center gap-2 text-xs text-ink-3">
                            <span className="ltr-nums font-bold text-ink-2">{c.code}</span>
                            {branch && <span className="truncate">· {branch.name}</span>}
                          </div>
                        </div>
                        <Chevron className={cn("size-4 shrink-0", i === active ? "text-jt" : "text-line")} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <AnimatePresence mode="wait">{selected && <ClientProfileCard key={selected.id} client={selected} />}</AnimatePresence>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* quick stats */}
          <div className="grid grid-cols-3 gap-3 lg:col-span-3">
            {[
              { label: t("clients"), value: store.clients.length, icon: Search },
              { label: t("agents"), value: store.agents.length, icon: Users },
              { label: t("branches"), value: store.branches.length, icon: Building2 },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card flex items-center gap-3 p-4"
              >
                <div className="hidden size-11 items-center justify-center rounded-2xl bg-jt-50 text-jt sm:flex">
                  <s.icon className="size-5" />
                </div>
                <div>
                  <div className="ltr-nums text-2xl font-black">{fmt(s.value, lang)}</div>
                  <div className="text-xs font-bold text-ink-3">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
              <Clock className="size-4 text-jt" />
              {t("recent")}
            </div>
            {recentClients.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {recentClients.map((c) => (
                  <button key={c.id} onClick={() => setQ(c.code)} className="flex items-center gap-3 rounded-xl border border-line p-3 text-start transition hover:border-jt/40 hover:bg-jt-50">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-jt text-sm font-black text-white">{c.name.trim()[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">{c.name}</div>
                      <div className="ltr-nums text-xs text-ink-3">{c.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-3">{t("searchHint")}</p>
            )}
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-extrabold">
              <span>{t("agentsAway")}</span>
              <span className="ltr-nums rounded-full bg-amber-100 px-2 text-xs text-amber-700">{away.length}</span>
            </div>
            {away.length ? (
              <ul className="space-y-2">
                {away.map((a) => {
                  const cover = a.coverAgentId ? store.agentById.get(a.coverAgentId) : undefined;
                  return (
                    <li key={a.id} className="flex items-center gap-2.5">
                      <AgentAvatar agent={a} size={36} />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="truncate font-bold">{a.name}</div>
                        <div className="truncate text-xs text-ink-3">
                          {t("coveredBy")}: {cover?.name ?? "—"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-ok">
                <span className="size-2 rounded-full bg-ok" /> {t("active")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
