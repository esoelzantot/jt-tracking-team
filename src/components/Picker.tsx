"use client";

import { motion } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { cn, normalize } from "@/lib/utils";

export interface PickerOption {
  value: string;
  label: string;
  /** Secondary text under/next to the label. */
  hint?: string;
  group?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Extra text matched by the search box. */
  keywords?: string;
  disabled?: boolean;
}

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
  options: PickerOption[];
  placeholder?: string;
  /** Show a search box (defaults to true when there are more than 7 options). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Adds a "none" row at the top that sets the value to null. */
  noneLabel?: string;
  className?: string;
  /** Compact height for tables/rows. */
  size?: "sm" | "md";
  ariaLabel?: string;
  /** Minimum popover width in px. */
  minWidth?: number;
}

const POP_MAX_H = 340;

/** Modern searchable dropdown. Renders the list in a portal so it is never clipped by dialogs. */
export function Picker({
  value,
  onChange,
  options,
  placeholder,
  searchable,
  searchPlaceholder,
  noneLabel,
  className,
  size = "md",
  ariaLabel,
  minWidth = 260,
}: Props) {
  const { t } = useI18n();
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null);

  const showSearch = searchable ?? options.length > 7;
  const selected = options.find((o) => o.value === value);

  const rows = useMemo(() => {
    const nq = normalize(q);
    const list = options.filter((o) => !nq || normalize(`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`).includes(nq));
    const withNone: (PickerOption & { none?: boolean })[] =
      noneLabel && !nq ? [{ value: "", label: noneLabel, none: true }, ...list] : list;
    return withNone;
  }, [options, q, noneLabel]);

  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const width = Math.max(b.width, minWidth);
    const spaceBelow = window.innerHeight - b.bottom;
    const up = spaceBelow < POP_MAX_H + 16 && b.top > spaceBelow;
    let left = document.documentElement.dir === "rtl" ? b.right - width : b.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setPos({ top: up ? b.top - 6 : b.bottom + 6, left, width, up });
  }, [minWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (btnRef.current?.contains(tgt) || popRef.current?.contains(tgt)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // reset search + highlight the selected row when opening
  useEffect(() => {
    if (!open) return;
    setQ("");
    const i = rows.findIndex((r) => (r.value || null) === value);
    setActive(Math.max(0, i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (o: PickerOption) => {
    if (o.disabled) return;
    onChange(o.value || null);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[active]) choose(rows[active]);
    } else if (e.key === "Escape") {
      // don't let a surrounding dialog close too
      e.nativeEvent.stopPropagation();
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  let lastGroup: string | undefined;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          } else if (open) onKey(e);
        }}
        className={cn(
          "group flex w-full items-center gap-2 rounded-[0.85rem] bg-surface text-start ring-1 ring-line transition",
          "hover:ring-jt/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jt/50",
          open && "ring-2 ring-jt/50 shadow-[0_0_0_4px_rgb(227_34_43/0.10)]",
          size === "sm" ? "min-h-10 px-2 py-1.5" : "min-h-11 px-2.5 py-2",
          className,
        )}
      >
        {selected?.leading && <span className="shrink-0">{selected.leading}</span>}
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className={cn("block truncate font-bold", size === "sm" ? "text-[13px]" : "text-sm")}>{selected.label}</span>
              {selected.hint && size === "md" && <span className="block truncate text-[11px] font-semibold text-ink-3">{selected.hint}</span>}
            </>
          ) : (
            <span className="block truncate text-sm font-semibold text-ink-3">{placeholder ?? noneLabel ?? "—"}</span>
          )}
        </span>
        {selected?.trailing && size === "md" && <span className="shrink-0">{selected.trailing}</span>}
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-lg bg-bg text-ink-3 transition group-hover:bg-jt-50 group-hover:text-jt",
            open && "rotate-180 bg-jt text-white group-hover:bg-jt group-hover:text-white",
          )}
        >
          <ChevronDown className="size-3.5" />
        </span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <>
            {open && pos && (
              <motion.div
                ref={popRef}
                initial={{ opacity: 0, y: pos.up ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.14 }}
                style={{
                  position: "fixed",
                  left: pos.left,
                  width: pos.width,
                  ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
                  transformOrigin: pos.up ? "bottom" : "top",
                }}
                className="z-[80] overflow-hidden rounded-2xl bg-surface shadow-[0_20px_50px_-12px_rgb(27_27_31/0.35)] ring-1 ring-line"
                onKeyDown={onKey}
              >
                <div className="h-1 bg-linear-to-r from-jt via-pinky to-jt" />
                {showSearch && (
                  <div className="relative border-b border-line p-2">
                    <Search className="pointer-events-none absolute start-4.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setActive(0);
                      }}
                      placeholder={searchPlaceholder ?? `${t("search")}…`}
                      className="h-10 w-full rounded-xl bg-bg pe-8 ps-9 text-sm font-semibold outline-none ring-jt/40 placeholder:text-ink-3 focus:ring-2"
                    />
                    {q && (
                      <button
                        type="button"
                        onClick={() => setQ("")}
                        className="absolute end-4 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-ink-3 hover:text-ink"
                        aria-label="Clear"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <div
                  ref={listRef}
                  id={`${id}-list`}
                  role="listbox"
                  tabIndex={-1}
                  autoFocus={!showSearch}
                  className="scroll-thin overflow-y-auto p-1.5 outline-none"
                  style={{ maxHeight: POP_MAX_H - (showSearch ? 60 : 0) }}
                >
                  {rows.length === 0 && <div className="px-3 py-6 text-center text-sm font-semibold text-ink-3">{t("noResults")}</div>}
                  {rows.map((o, i) => {
                    const header = o.group && o.group !== lastGroup ? o.group : null;
                    lastGroup = o.group;
                    const isSel = (o.value || null) === value;
                    return (
                      <div key={o.value || "__none"}>
                        {header && (
                          <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-3">{header}</div>
                        )}
                        <div
                          role="option"
                          aria-selected={isSel}
                          aria-disabled={o.disabled}
                          data-idx={i}
                          onMouseEnter={() => setActive(i)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => choose(o)}
                          className={cn(
                            "relative flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                            i === active && "bg-jt-50",
                            isSel && "bg-jt-50/70",
                            o.disabled && "cursor-not-allowed opacity-45",
                          )}
                        >
                          {i === active && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-jt" />}
                          {"none" in o && o.none ? (
                            <span className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-3">
                              <X className="size-3.5" />
                            </span>
                          ) : (
                            o.leading
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-sm", isSel ? "font-extrabold text-jt-700" : "font-bold")}>{o.label}</span>
                            {o.hint && <span className="block truncate text-[11px] font-semibold text-ink-3">{o.hint}</span>}
                          </span>
                          {o.trailing}
                          {isSel && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-jt text-white">
                              <Check className="size-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
