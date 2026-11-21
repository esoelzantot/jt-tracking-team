"use client";

import { motion } from "framer-motion";
import { Briefcase, Info, PhoneCall, RotateCcw, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { QueryKind } from "@/lib/search";
import { CopyButton, Rabbit } from "./ui";

/** Shown when a search finds no shipper: friendly guidance on what to do next. */
export function NoShipperFound({ query, kind, onClear }: { query: string; kind: QueryKind; onClear: () => void }) {
  const { t } = useI18n();
  const isCode = kind === "code";

  const options = [
    { icon: Briefcase, title: t("nfSalesTitle"), body: t("nfSalesBody") },
    { icon: PhoneCall, title: t("nfDirectTitle"), body: t("nfDirectBody") },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 260 }}
      className="card mx-auto max-w-3xl overflow-hidden !rounded-[1.75rem]"
    >
      {/* ---------------- top */}
      <div className="relative overflow-hidden bg-linear-to-b from-jt-50 to-surface px-6 pb-6 pt-7 sm:px-8">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            {/* searched query "ticket" */}
            <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border-2 border-dashed border-jt/30 bg-surface py-1.5 pe-1.5 ps-3 shadow-sm">
              <Search className="size-4 shrink-0 text-jt" />
              <span dir={isCode ? "ltr" : undefined} className="truncate font-black tracking-wide">
                {query}
              </span>
              <CopyButton value={query} className="!p-1" />
              <span className="shrink-0 rounded-xl bg-jt px-2 py-0.5 text-[11px] font-extrabold text-white">{t("nfBadge")}</span>
            </div>

            <h2 className="mt-4 text-2xl font-black leading-snug sm:text-3xl">{isCode ? t("nfTitleCode") : t("nfTitleName")}</h2>
            <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-2">{t("nfBody")}</p>
          </div>

          {/* rabbit with a speech bubble */}
          <div className="relative mx-auto hidden sm:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", damping: 14 }}
              className="absolute -top-3 end-full z-10 me-1 whitespace-nowrap rounded-2xl rounded-ee-sm bg-surface px-3 py-1.5 text-sm font-extrabold shadow-md ring-1 ring-line"
            >
              {t("nfBubble")}
            </motion.div>
            <Rabbit size={130} float />
          </div>
        </div>
      </div>

      {/* ---------------- what to do */}
      <div className="px-6 pb-2 sm:px-8">
        <div className="mb-3 text-xs font-extrabold uppercase tracking-wide text-ink-3">{t("nfWhatNow")}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl bg-surface p-4 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:ring-jt/30"
            >
              <span className="pointer-events-none absolute -end-6 -top-6 size-20 rounded-full bg-jt-50 transition group-hover:scale-125" />
              <div className="relative flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-jt text-white shadow-md shadow-jt/30">
                  <o.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold">{o.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{o.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---------------- footer */}
      <div className="mt-4 flex flex-col gap-3 border-t border-line bg-bg/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-start gap-2 text-xs font-semibold text-ink-3">
          <Info className="mt-0.5 size-4 shrink-0 text-jt" />
          {isCode ? t("nfHintCode") : t("nfHintName")}
        </p>
        <button onClick={onClear} className="btn btn-primary shrink-0">
          <RotateCcw className="size-4" />
          {t("nfNewSearch")}
        </button>
      </div>
    </motion.section>
  );
}
