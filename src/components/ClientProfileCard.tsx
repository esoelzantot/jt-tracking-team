"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Building2, MapPin, Package, ShieldCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { fmt, resolveOwnership } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { AgentChip } from "./AgentChip";
import { CopyButton, Stat, StatusBadge } from "./ui";

export function ClientProfileCard({ client }: { client: Client }) {
  const { t, lang } = useI18n();
  const store = useStore();
  const branch = client.branchId ? store.branchById.get(client.branchId) : undefined;
  const own = resolveOwnership(client, store);
  const shared = own.branchAgents.length > 1;

  return (
    <motion.article
      key={client.id}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="card overflow-hidden"
    >
      {/* header */}
      <div className="speed-stripes relative overflow-hidden bg-linear-to-br from-jt to-jt-700 px-5 pb-5 pt-5 text-white">
        <div className="absolute -end-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white/75">{t("clientName")}</div>
            <h2 className="mt-0.5 text-2xl font-black leading-tight break-words">{client.name || "—"}</h2>
            <div className="mt-2 inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1 text-sm font-bold backdrop-blur">
              <span className="ltr-nums">{client.code}</span>
              <CopyButton value={client.code} className="!p-0.5 text-white/80 hover:!bg-white/20 hover:!text-white" />
            </div>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black backdrop-blur">
            {(client.name || "?").trim()[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* who to contact */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-3">
            <ShieldCheck className="size-4 text-jt" />
            {t("contactNow")}
          </div>
          {own.current ? (
            <div className="relative overflow-hidden rounded-2xl bg-ink p-4 text-white">
              <div className="absolute inset-y-0 start-0 w-1.5 bg-jt" />
              <div className="flex items-center gap-4">
                <AgentAvatar agent={own.current} size={68} />
                <div className="min-w-0 flex-1">
                  <Link href={`/agents/${encodeURIComponent(own.current.id)}`} className="block truncate text-lg font-black hover:underline">
                    {own.current.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="ltr-nums rounded-lg bg-white/10 px-2 py-0.5 font-bold">#{own.current.id}</span>
                    <CopyButton value={own.current.id} className="text-white/70 hover:!bg-white/10 hover:!text-white" label={t("copy")} />
                    <span className="rounded-lg bg-jt px-2 py-0.5 text-xs font-extrabold">
                      {own.reason === "primary" ? t("accountManager") : t("supportAgent")}
                    </span>
                  </div>
                </div>
              </div>
              {own.reason === "primary-away" && (
                <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">{t("primaryAway")}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-warn/60 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {own.reason === "unassigned" ? <UserX className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
              {own.reason === "unassigned" ? t("unassigned") : t("nobody")}
            </div>
          )}
        </section>

        {/* primary & support */}
        <section className="grid gap-2.5 sm:grid-cols-2">
          {own.primary ? (
            <AgentChip agent={own.primary} role={t("accountManager")} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-3 text-sm text-ink-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wide">{t("accountManager")}</div>—
            </div>
          )}
          {own.support ? (
            <AgentChip agent={own.support} role={t("supportAgent")} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-3 text-sm text-ink-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wide">{t("supportAgent")}</div>—
            </div>
          )}
        </section>

        {/* branch */}
        <section className="rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-jt-50 text-jt">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-ink-3">{t("pickupBranch")}</div>
                <div className="font-extrabold break-words">{branch?.name ?? "—"}</div>
              </div>
            </div>
            {branch?.area && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-bg px-2.5 py-1 text-xs font-bold text-ink-2">
                <MapPin className="size-3.5" />
                {branch.area}
              </span>
            )}
          </div>
          {branch && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label={t("avgPerDay")} value={fmt(branch.avgShipmentsPerDay, lang)} icon={<Package className="size-3.5" />} />
              <Stat label={t("totalCustomers")} value={fmt(branch.totalCustomers, lang)} icon={<Users className="size-3.5" />} />
            </div>
          )}
          {shared && (
            <div className="mt-3">
              <div className="mb-2 text-xs font-bold text-ink-2">{t("sharedBranch")}</div>
              <div className="flex flex-wrap gap-2">
                {own.branchAgents.map((a) => (
                  <Link
                    key={a.id}
                    href={`/agents/${encodeURIComponent(a.id)}`}
                    className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pe-3 ps-1 text-xs font-bold hover:border-jt/40"
                  >
                    <AgentAvatar agent={a} size={26} showStatus={false} />
                    <span className="max-w-[140px] truncate">{a.name}</span>
                    <StatusBadge status={a.status} className="!px-1.5" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {client.notes && (
          <section className="rounded-2xl bg-bg p-3 text-sm text-ink-2">
            <span className="font-bold text-ink">{t("notes")}: </span>
            {client.notes}
          </section>
        )}
      </div>
    </motion.article>
  );
}
