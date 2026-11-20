import Fuse from "fuse.js";
import type { Client } from "./types";
import { normalize } from "./utils";

interface Indexed {
  c: Client;
  name: string;
  code: string;
}

/**
 * In-memory index (a few thousand clients is nothing for the browser). Ranking:
 * exact code > code ends with / contains > name starts with > word starts with > contains > fuzzy (typos).
 */
export function buildIndex(clients: Client[]) {
  const items: Indexed[] = clients.map((c) => ({ c, name: normalize(c.name), code: c.code.toLowerCase() }));
  const fuse = new Fuse(items, { keys: ["name", "code"], threshold: 0.38, ignoreLocation: true, minMatchCharLength: 2 });

  return function search(raw: string, limit = 30): Client[] {
    const q = normalize(raw);
    if (!q) return [];
    const digits = q.replace(/\D/g, "");
    const scored: { c: Client; s: number }[] = [];
    for (const it of items) {
      let s = 0;
      if (it.code === q) s = 100;
      else if (digits.length >= 3 && it.code.endsWith(digits)) s = 90;
      else if (it.code.includes(q)) s = 80;
      else if (it.name === q) s = 95;
      else if (it.name.startsWith(q)) s = 70;
      else if (it.name.split(" ").some((w) => w.startsWith(q))) s = 60;
      else if (it.name.includes(q)) s = 50;
      if (s) scored.push({ c: it.c, s: s - Math.min(it.name.length, 40) / 100 });
    }
    if (scored.length) return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.c);
    return fuse.search(q, { limit }).map((r) => r.item.c);
  };
}
