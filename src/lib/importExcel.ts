import * as XLSX from "xlsx";
import type { Agent, Branch, Client, Dataset, Gender } from "./types";
import { guessGender, slugify } from "./utils";

export interface ImportReport {
  dataset: Dataset;
  warnings: string[];
  stats: { clients: number; agents: number; branches: number; unassigned: number; duplicates: number };
}

const clean = (v: unknown) => (v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim());
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function findSheet(wb: XLSX.WorkBook, test: (headers: string[]) => boolean) {
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: null });
    const headers = (rows[0] ?? []).map((h) => clean(h).toLowerCase());
    if (test(headers)) return { rows, headers };
  }
  return null;
}

/**
 * Parses the "Tracking Team" workbook:
 *  - customers sheet: Client Name | Client Code | Branch
 *  - branches sheet:  Area | Branch | Average shipment per day | Total Customers | Agent | ID
 * The branches sheet uses merged cells for Area/Agent/ID, so values are forward-filled per block.
 * A branch row that has its own agent starts a new block; agent rows without a branch
 * (e.g. GI-Project BR) add extra agents to the previous branch.
 */
export function parseWorkbook(data: ArrayBuffer, existing?: Dataset): ImportReport {
  const wb = XLSX.read(data, { type: "array" });
  const warnings: string[] = [];

  const branchSheet = findSheet(wb, (h) => h.includes("branch") && h.some((x) => x.startsWith("agent")));
  const clientSheet = findSheet(wb, (h) => h.some((x) => x.includes("client code")));
  if (!branchSheet) throw new Error("Branches sheet not found (needs Branch + Agent columns).");
  if (!clientSheet) throw new Error("Customers sheet not found (needs a Client Code column).");

  const col = (headers: string[], ...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));

  // ---------- Branches + agents ----------
  const bh = branchSheet.headers;
  const iArea = col(bh, "area");
  const iBranch = col(bh, "branch");
  const iAvg = col(bh, "average");
  const iTotal = col(bh, "total");
  const iAgent = col(bh, "agent");
  const iId = bh.findIndex((h) => h === "id" || h === "agent id");

  const existingAgents = new Map((existing?.agents ?? []).map((a) => [a.id, a]));
  const agents = new Map<string, Agent>();
  const branches = new Map<string, Branch>();

  let area = "";
  let blockAgents: string[] = [];
  let lastBranch: Branch | null = null;

  const upsertAgent = (nameRaw: unknown, idRaw: unknown): string => {
    const name = clean(nameRaw);
    let id = clean(idRaw);
    let tempId = false;
    if (!id) {
      id = `TMP-${slugify(name)}`;
      tempId = true;
      warnings.push(`Agent "${name}" has no ID in the sheet — saved as ${id}. Edit it in the dashboard.`);
    }
    if (!agents.has(id)) {
      const prev = existingAgents.get(id);
      const gender: Gender = prev?.gender ?? guessGender(name);
      agents.set(id, {
        id,
        name: prev?.name ?? name,
        gender,
        status: prev?.status ?? "active",
        coverAgentId: prev?.coverAgentId ?? null,
        phone: prev?.phone ?? "",
        email: prev?.email ?? "",
        hijab: prev?.hijab ?? gender === "female",
        area,
        ...(tempId ? { tempId: true } : {}),
      });
    }
    return id;
  };

  for (const row of branchSheet.rows.slice(1)) {
    const r = row as unknown[];
    const branchName = clean(r[iBranch]);
    const agentName = clean(r[iAgent]);
    if (clean(r[iArea])) area = clean(r[iArea]);

    if (branchName) {
      if (agentName) blockAgents = [upsertAgent(r[iAgent], iId >= 0 ? r[iId] : null)];
      const id = slugify(branchName);
      const b: Branch = {
        id,
        name: branchName,
        area,
        avgShipmentsPerDay: num(r[iAvg]),
        totalCustomers: num(r[iTotal]),
        agentIds: [...blockAgents],
      };
      branches.set(id, b);
      lastBranch = b;
    } else if (agentName && lastBranch) {
      const aid = upsertAgent(r[iAgent], iId >= 0 ? r[iId] : null);
      if (!lastBranch.agentIds.includes(aid)) lastBranch.agentIds.push(aid);
      blockAgents = [...lastBranch.agentIds];
    }
  }
  for (const a of agents.values()) {
    const first = [...branches.values()].find((b) => b.agentIds.includes(a.id));
    if (first) a.area = first.area;
  }

  // ---------- Clients ----------
  const ch = clientSheet.headers;
  const iName = col(ch, "client name", "name");
  const iCode = col(ch, "client code", "code");
  const iCBranch = col(ch, "branch");
  const existingClients = new Map((existing?.clients ?? []).map((c) => [c.id, c]));
  const clients = new Map<string, Client>();
  let duplicates = 0;
  const unknownBranches = new Set<string>();

  for (const row of clientSheet.rows.slice(1)) {
    const r = row as unknown[];
    const code = clean(r[iCode]).toUpperCase();
    const name = clean(r[iName]);
    if (!code && !name) continue;
    if (!code) {
      warnings.push(`Client "${name}" has no code — skipped.`);
      continue;
    }
    if (clients.has(code)) duplicates++;
    const branchName = clean(r[iCBranch]);
    let branchId: string | null = branchName ? slugify(branchName) : null;
    if (branchId && !branches.has(branchId)) {
      unknownBranches.add(branchName);
      branches.set(branchId, { id: branchId, name: branchName, area: "", avgShipmentsPerDay: 0, totalCustomers: 0, agentIds: [] });
    }
    if (!branchName) branchId = null;
    const branchAgents = branchId ? branches.get(branchId)!.agentIds : [];
    const prev = existingClients.get(code);
    // Keep manual assignments from the dashboard when re-importing.
    const agentId = prev?.agentId ?? (branchAgents.length === 1 ? branchAgents[0] : null);
    clients.set(code, {
      id: code,
      code,
      name,
      branchId,
      agentId,
      supportAgentId: prev?.supportAgentId ?? null,
      notes: prev?.notes ?? "",
    });
  }
  if (duplicates) warnings.push(`${duplicates} duplicate client code(s) — the last row was kept.`);
  if (unknownBranches.size)
    warnings.push(`Branches used by clients but missing in the branches sheet: ${[...unknownBranches].join(", ")}.`);

  const dataset: Dataset = { clients: [...clients.values()], agents: [...agents.values()], branches: [...branches.values()] };
  const unassigned = dataset.clients.filter((c) => !c.agentId).length;
  if (unassigned)
    warnings.push(`${unassigned} client(s) sit in branches shared by several agents (or with no agent) — assign them in Dashboard › Clients.`);

  return {
    dataset,
    warnings,
    stats: { clients: dataset.clients.length, agents: dataset.agents.length, branches: dataset.branches.length, unassigned, duplicates },
  };
}
