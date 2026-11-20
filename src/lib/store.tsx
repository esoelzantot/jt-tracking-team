"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRepo, type Repo, type SessionUser } from "./repo";
import type { Agent, Branch, Client, Dataset } from "./types";

interface Store extends Dataset {
  loading: boolean;
  error: string | null;
  user: SessionUser | null;
  authReady: boolean;
  repo: Repo;
  agentById: Map<string, Agent>;
  branchById: Map<string, Branch>;
  clientsByAgent: Map<string, Client[]>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepo(), []);
  const [data, setData] = useState<Dataset>({ clients: [], agents: [], branches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(
    () =>
      repo.subscribe(
        (d) => {
          setData(d);
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        },
      ),
    [repo],
  );
  useEffect(
    () =>
      repo.onAuth((u) => {
        setUser(u);
        setAuthReady(true);
      }),
    [repo],
  );

  const value = useMemo<Store>(() => {
    const agentById = new Map(data.agents.map((a) => [a.id, a]));
    const branchById = new Map(data.branches.map((b) => [b.id, b]));
    const clientsByAgent = new Map<string, Client[]>();
    for (const c of data.clients) {
      for (const id of new Set([c.agentId, c.supportAgentId])) {
        if (!id) continue;
        if (!clientsByAgent.has(id)) clientsByAgent.set(id, []);
        clientsByAgent.get(id)!.push(c);
      }
    }
    return { ...data, loading, error, user, authReady, repo, agentById, branchById, clientsByAgent };
  }, [data, loading, error, user, authReady, repo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
