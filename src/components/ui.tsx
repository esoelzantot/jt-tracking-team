"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import type { AgentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: AgentStatus; className?: string }) {
  const { t } = useI18n();
  const map = {
    active: { label: t("active"), cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-ok" },
    leave: { label: t("onLeave"), cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-warn" },
    off: { label: t("off"), cls: "bg-zinc-100 text-zinc-600 ring-zinc-200", dot: "bg-ink-3" },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1", map.cls, className)}>
      <span className={cn("size-1.5 rounded-full", map.dot, status === "active" && "animate-pulse")} />
      {map.label}
    </span>
  );
}

export function CopyButton({ value, className, label }: { value: string; className?: string; label?: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        // Works inside links/cards without triggering their navigation.
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        });
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold text-ink-3 transition hover:bg-jt-50 hover:text-jt",
        className,
      )}
      title={t("copy")}
      aria-label={`${t("copy")} ${value}`}
    >
      {done ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
      {label && <span>{done ? t("copied") : label}</span>}
    </button>
  );
}

export function Rabbit({ size = 120, className, float = false }: { size?: number; className?: string; float?: boolean }) {
  return (
    <Image
      src="/brand/rabbit.png"
      alt=""
      width={311}
      height={413}
      priority
      className={cn("pointer-events-none select-none drop-shadow-xl", float && "animate-float", className)}
      style={{ width: size, height: "auto" }}
    />
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Rabbit size={96} float />
      <h3 className="text-lg font-extrabold">{title}</h3>
      {body && <p className="max-w-md text-sm text-ink-2">{body}</p>}
      {action}
    </div>
  );
}

export function NoDataState() {
  const { t } = useI18n();
  return (
    <EmptyState
      title={t("emptyTitle")}
      body={t("emptyBody")}
      action={
        <Link href="/dashboard?tab=import" className="btn btn-primary mt-2">
          {t("goDashboard")}
        </Link>
      }
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl",
              wide ? "sm:max-w-2xl" : "sm:max-w-lg",
            )}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-extrabold">{title}</h2>
              <button onClick={onClose} className="btn btn-ghost !p-2" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line bg-bg/60 px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Stat({ label, value, icon, accent }: { label: string; value: ReactNode; icon?: ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-3", accent ? "bg-jt text-white" : "bg-bg")}>
      <div className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide", accent ? "text-white/80" : "text-ink-3")}>
        {icon}
        {label}
      </div>
      <div className="ltr-nums mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [message, onDone]);
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-2xl bg-surface px-4 py-2.5 text-sm font-bold text-ink shadow-xl ring-1 ring-line border-s-4 border-jt"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
