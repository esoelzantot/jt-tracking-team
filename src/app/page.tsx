"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { ClientProfileCard } from "@/components/ClientProfileCard";
import { NoShipperFound } from "@/components/NoShipperFound";
import { NoDataState, Rabbit } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { buildIndex, queryKind } from "@/lib/search";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { cn, coverageOf, fmt, resolveOwnership } from "@/lib/utils";

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
      <section className="surface-glow relative overflow-hidden rounded-[2rem] px-5 pb-8 pt-8 shadow-[var(--shadow-lift)] sm:px-10 sm:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="animate-dash h-full w-1/3 bg-linear-to-r from-transparent via-white/80 to-transparent" />
        </div>
        <div className="relative grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              {t("appName")} · {store.clients.length ? `${fmt(store.clients.length, lang)} ${t("clients")}` : t("loading")}
            </div>
            <h1 className="text-glow text-3xl font-black leading-tight sm:text-5xl">{t("tagline")}</h1>

            <div className="relative mt-6">
              <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("searchPlaceholder")}
                className="h-16 w-full rounded-2xl border-0 bg-white pe-12 ps-12 text-base font-semibold text-ink shadow-2xl outline-none ring-4 ring-white/25 placeholder:font-medium placeholder:text-ink-3 focus:ring-white/45 sm:text-lg"
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
            <p className="mt-2.5 text-xs font-semibold text-white/75">{t("searchHint")} · ↑ ↓</p>
          </div>
          <Rabbit size={170} float className="hidden md:block" />
        </div>

        {store.clients.length > 0 && (
          <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch rounded-2xl bg-white/10 py-5 ring-1 ring-white/15">
            {[
              { label: t("clients"), value: store.clients.length },
              { label: t("agents"), value: store.agents.length },
              { label: t("branches"), value: store.branches.length },
            ].flatMap((s, i) => [
              ...(i ? [<div key={"d" + i} className="divider-glow" />] : []),
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <div className="flex items-start" dir="ltr">
                  <span className="ltr-nums text-glow text-3xl font-black leading-none sm:text-5xl">{fmt(s.value, lang)}</span>
                  <span className="ms-0.5 text-xl font-black leading-none text-white/70 sm:text-3xl">+</span>
                </div>
                <div className="mt-2 text-xs font-bold text-white/80 sm:text-sm">{s.label}</div>
                <span className="mt-3 h-0.5 w-7 rounded-full bg-white/70" />
              </motion.div>,
            ])}
          </div>
        )}
      </section>

      {store.loading ? (
        <div className="grid gap-4 md:grid-cols-[360px_1fr]">
          <div className="card h-80 animate-pulse" />
          <div className="card h-80 animate-pulse" />
        </div>
      ) : !hasData ? (
        <NoDataState />
      ) : q && results.length === 0 ? (
        <NoShipperFound
          query={q.trim()}
          kind={queryKind(q)}
          onClear={() => {
            setQ("");
            inputRef.current?.focus();
          }}
        />
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
                  const cov = coverageOf(a.id, store);
                  return (
                    <li key={a.id} className="flex items-center gap-2.5">
                      <AgentAvatar agent={a} size={36} />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="truncate font-bold">{a.name}</div>
                        <div className="truncate text-xs text-ink-3">
                          {cov.groups.length > 1 ? (
                            <>
                              {t("splitAcross")} <span className="ltr-nums">{cov.groups.length}</span> {t("agentsWord")}
                            </>
                          ) : (
                            <>
                              {t("coveredBy")}: {cov.groups[0]?.agent.name ?? "—"}
                            </>
                          )}
                        </div>
                      </div>
                      {cov.groups.length > 1 && (
                        <span className="flex shrink-0 -space-x-1.5 rtl:space-x-reverse">
                          {cov.groups.slice(0, 3).map((g) => (
                            <AgentAvatar key={g.agent.id} agent={g.agent} size={22} showStatus={false} className="rounded-full ring-2 ring-surface" />
                          ))}
                        </span>
                      )}
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
