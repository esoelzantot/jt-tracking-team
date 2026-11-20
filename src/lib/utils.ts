import type { Agent, Client, Dataset, Gender } from "./types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Arabic-insensitive normalisation so "أحمد" matches "احمد", and casing/spacing don't matter. */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

const FEMALE_FIRST = new Set(
  "janna jana rawan malak aya mariam maryam nour noor sama yasmine yasmin salma heba nehaad nihad shams sara sarah mai menna mona nada hana habiba farida fatma fatima esraa asmaa alaa rana reem dina doaa nourhan shaimaa amira yara jasmine ola omnia rahma hagar marwa nermeen nesma radwa".split(" "),
);
export function guessGender(name: string): Gender {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (FEMALE_FIRST.has(first)) return "female";
  return "male";
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const fmt = (n: number, locale = "en") => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(n);

export interface Ownership {
  primary: Agent | null;
  support: Agent | null;
  /** The person you should contact right now. */
  current: Agent | null;
  /** Why `current` isn't the primary agent. */
  reason: "primary" | "primary-away" | "unassigned" | "nobody";
  /** All agents on the client's branch (for shared branches). */
  branchAgents: Agent[];
}

export function resolveOwnership(client: Client, data: Dataset): Ownership {
  const byId = new Map(data.agents.map((a) => [a.id, a]));
  const branch = data.branches.find((b) => b.id === client.branchId);
  const branchAgents = (branch?.agentIds ?? []).map((id) => byId.get(id)).filter(Boolean) as Agent[];
  const primary = client.agentId ? byId.get(client.agentId) ?? null : null;
  const support =
    (client.supportAgentId ? byId.get(client.supportAgentId) : null) ??
    (primary?.coverAgentId ? byId.get(primary.coverAgentId) : null) ??
    null;

  if (primary && primary.status === "active") return { primary, support, current: primary, reason: "primary", branchAgents };
  if (primary) {
    const current = support && support.status === "active" ? support : null;
    return { primary, support, current, reason: current ? "primary-away" : "nobody", branchAgents };
  }
  return { primary: null, support, current: support?.status === "active" ? support : null, reason: "unassigned", branchAgents };
}
