"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Building2, Check, MapPin, Phone, ShieldCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Agent, Client } from "@/lib/types";
import { cn, resolveOwnership } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { CopyButton, Rabbit, StatusBadge } from "./ui";

/** One step of the routing timeline (1 = account manager, 2 = support agent). */
function Step({ n, role, agent, current, last }: { n: number; role: string; agent: Agent | null; current: boolean; last?: boolean }) {
  const { t } = useI18n();
  return (
    <li className="relative flex gap-3">
      {/* rail */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
            current ? "bg-jt text-white shadow-md shadow-jt/30" : agent ? "bg-surface text-ink-2 ring-2 ring-line" : "border-2 border-dashed border-line bg-bg text-ink-3",
          )}
        >
          {current ? <Check className="size-4" /> : n}
        </span>
        {!last && <span className="w-0.5 flex-1 bg-linear-to-b from-line to-line/30" />}
      </div>

      {/* content */}
      <div className={cn("mb-3 flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2.5 transition", current ? "bg-jt-50 ring-1 ring-jt/25" : "bg-bg/70")}>
        {agent ? (
          <>
            <AgentAvatar agent={agent} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink-3">{role}</div>
              <Link href={`/agents/${encodeURIComponent(agent.id)}`} className="block truncate text-sm font-extrabold hover:text-jt">
                {agent.name}
              </Link>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={agent.status} />
              {current && <span className="text-[10px] font-extrabold text-jt">{t("handlingNow")}</span>}
            </div>
          </>
        ) : (
          <>
            <span className="flex size-10 items-center justify-center rounded-full bg-surface text-ink-3 ring-1 ring-line">
              <UserX className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink-3">{role}</div>
              <div className="text-sm font-bold text-ink-3">—</div>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

export function ClientProfileCard({ client }: { client: Client }) {
  const { t } = useI18n();
  const store = useStore();
  const branch = client.branchId ? store.branchById.get(client.branchId) : undefined;
  const own = resolveOwnership(client, store);
  const shared = own.branchAgents.length > 1;
  const handedOff = own.reason === "primary-away";
  const cur = own.current;

  return (
    <motion.article
      key={client.id}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="card overflow-hidden !rounded-[1.75rem]"
    >
      {/* ------------------------------------------------ header */}
      <header className="surface-glow relative overflow-hidden px-5 pb-7 pt-6 sm:px-6">
        <Rabbit size={80} className="pointer-events-none absolute -bottom-6 end-3 drop-shadow-2xl" />
        <div className="relative flex items-start gap-4 pe-20">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-black text-jt shadow-lg shadow-black/15">
            {(client.name || "?").trim()[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white/75">{t("clientName")}</div>
            <h2 className="mt-0.5 break-words text-2xl font-black leading-tight sm:text-3xl">{client.name || "—"}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-white/15 py-1 pe-1 ps-2.5 text-sm font-bold ring-1 ring-white/20">
                <span className="ltr-nums">{client.code}</span>
                <CopyButton value={client.code} className="!p-1 text-white/75 hover:!bg-white/15 hover:!text-white" />
              </span>
              {branch && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1 text-sm font-bold text-jt-700">
                  <Building2 className="size-3.5" />
                  <span dir="ltr">{branch.name}</span>
                </span>
              )}
              {branch?.area && (
                <span className="inline-flex items-center gap-1 px-1 py-1 text-xs font-bold text-white/80">
                  <MapPin className="size-3.5" />
                  {branch.area}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {/* ------------------------------------------------ spotlight */}
        {cur ? (
          <section className="relative overflow-hidden rounded-3xl bg-surface p-4 shadow-[var(--shadow-lift)] ring-1 ring-jt/15">
            <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-jt" />
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative flex flex-wrap items-center gap-4">
              <div className="relative shrink-0">
                <span className="absolute inset-0 animate-ping rounded-full bg-jt/15" style={{ animationDuration: "2.6s" }} />
                <AgentAvatar agent={cur} size={72} className="relative rounded-full ring-4 ring-jt-50" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-jt">
                  <ShieldCheck className="size-4" />
                  {t("contactNow")}
                </div>
                <div className="mt-0.5 truncate text-xl font-black">{cur.name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="ltr-nums rounded-lg bg-bg px-2 py-0.5 text-sm font-black ring-1 ring-line">#{cur.id}</span>
                  <CopyButton value={cur.id} label={t("copy")} />
                  <span className="rounded-md bg-jt-50 px-2 py-0.5 text-[11px] font-extrabold text-jt-700">
                    {own.reason === "primary" ? t("accountManager") : t("supportAgent")}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/agents/${encodeURIComponent(cur.id)}`}
                  className="btn btn-soft !rounded-full !p-3"
                  title={t("viewProfile")}
                  aria-label={t("viewProfile")}
                >
                  <ArrowUpRight className="size-5 rtl:-scale-x-100" />
                </Link>
                {cur.phone && (
                  <a href={`tel:${cur.phone}`} className="btn btn-primary !rounded-full !p-3" title={t("callNow")} aria-label={t("callNow")}>
                    <Phone className="size-5" />
                  </a>
                )}
              </div>
            </div>
            {handedOff && (
              <p className="relative mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                <AlertTriangle className="size-4 shrink-0" />
                {t("primaryAway")}
              </p>
            )}
          </section>
        ) : (
          <section className="flex items-center gap-3 rounded-3xl border border-dashed border-warn/60 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
              {own.reason === "unassigned" ? <UserX className="size-5" /> : <AlertTriangle className="size-5" />}
            </span>
            {own.reason === "unassigned" ? t("unassigned") : t("nobody")}
          </section>
        )}

        {/* ------------------------------------------------ routing timeline */}
        <section>
          <div className="mb-3 text-xs font-extrabold uppercase tracking-wide text-ink-3">{t("routing")}</div>
          <ol>
            <Step n={1} role={t("accountManager")} agent={own.primary} current={!!own.primary && cur?.id === own.primary.id} />
            <Step n={2} role={t("supportAgent")} agent={own.support} current={!!own.support && cur?.id === own.support.id} last />
          </ol>
        </section>

        {/* ------------------------------------------------ shared branch */}
        {shared && (
          <section className="rounded-2xl bg-bg p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-ink-2">
              <Users className="size-4 text-jt" />
              {t("sharedBranch")}
            </div>
            <div className="flex flex-wrap gap-2">
              {own.branchAgents.map((a) => (
                <Link
                  key={a.id}
                  href={`/agents/${encodeURIComponent(a.id)}`}
                  className="flex items-center gap-2 rounded-full bg-surface py-1 pe-3 ps-1 text-xs font-bold ring-1 ring-line hover:ring-jt/40"
                >
                  <AgentAvatar agent={a} size={26} showStatus={false} />
                  <span className="max-w-[140px] truncate">{a.name}</span>
                  <StatusBadge status={a.status} className="!px-1.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {client.notes && (
          <section className="rounded-2xl border-s-4 border-jt bg-jt-50/60 p-3 text-sm text-ink-2">
            <span className="font-bold text-ink">{t("notes")}: </span>
            {client.notes}
          </section>
        )}
      </div>
    </motion.article>
  );
}
