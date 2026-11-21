import Fuse from "fuse.js";
import type { Client } from "./types";
import { normalize } from "./utils";

interface Indexed {
  c: Client;
  name: string;
  /** lower-case code, e.g. "j0086xxxxxx" */
  code: string;
}

/** J&T client codes look like J + 10 digits (J0086XXXXXX). */
const FULL_CODE_DIGITS = 10;

export type QueryKind = "code" | "name";

/** A query is a code search when it is "J" + digits, or only digits (3+). */
export function queryKind(raw: string): QueryKind {
  const q = raw.replace(/\s+/g, "").toLowerCase();
  return /^j\d*$/.test(q) && q.length >= 2 ? "code" : /^\d{3,}$/.test(q) ? "code" : "name";
}

/**
 * In-memory index (a few thousand clients is nothing for the browser).
 *
 * Code searches are strict — no "close" codes are ever suggested:
 *  - full code (J + 10 digits, or the 10 digits alone) → exact match only
 *  - partial code starting with J                       → codes starting with it
 *  - digits only (3+)                                   → codes ending with them ("last digits")
 *
 * Name searches: exact > starts with > word starts with > contains;
 * typo-tolerant matching is only used when nothing matches directly.
 */
export function buildIndex(clients: Client[]) {
  const items: Indexed[] = clients.map((c) => ({ c, name: normalize(c.name), code: c.code.replace(/\s+/g, "").toLowerCase() }));
  const fuse = new Fuse(items, { keys: ["name"], threshold: 0.28, ignoreLocation: true, minMatchCharLength: 3 });

  return function search(raw: string, limit = 30): Client[] {
    if (!raw.trim()) return [];

    // ---------------- code search (strict)
    if (queryKind(raw) === "code") {
      const q = raw.replace(/\s+/g, "").toLowerCase();
      const digits = q.replace(/\D/g, "");
      let hits: Indexed[];
      if (digits.length >= FULL_CODE_DIGITS) {
        hits = items.filter((it) => it.code === q || it.code.replace(/\D/g, "") === digits);
      } else if (q.startsWith("j")) {
        hits = items.filter((it) => it.code.startsWith(q));
      } else {
        hits = items.filter((it) => it.code.endsWith(digits));
      }
      return hits
        .sort((a, b) => a.code.localeCompare(b.code))
        .slice(0, limit)
        .map((it) => it.c);
    }

    // ---------------- name search
    const q = normalize(raw);
    const scored: { c: Client; s: number }[] = [];
    for (const it of items) {
      let s = 0;
      if (it.name === q) s = 100;
      else if (it.name.startsWith(q)) s = 80;
      else if (it.name.split(" ").some((w) => w.startsWith(q))) s = 70;
      else if (it.name.includes(q)) s = 60;
      if (s) scored.push({ c: it.c, s: s - Math.min(it.name.length, 40) / 100 });
    }
    if (scored.length) return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.c);
    if (q.length < 4) return [];
    return fuse.search(q, { limit: Math.min(limit, 8) }).map((r) => r.item.c);
  };
}
