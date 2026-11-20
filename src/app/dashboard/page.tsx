"use client";

import { Building2, FileSpreadsheet, LayoutGrid, LogOut, Users, UserSquare2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AgentsManager } from "@/components/dashboard/AgentsManager";
import { BranchesManager } from "@/components/dashboard/BranchesManager";
import { ClientsManager } from "@/components/dashboard/ClientsManager";
import dynamic from "next/dynamic";

// xlsx is heavy — only load it when the Import tab opens.
const ImportPanel = dynamic(() => import("@/components/dashboard/ImportPanel").then((m) => m.ImportPanel), {
  loading: () => <div className="card h-64 animate-pulse" />,
});
import { Overview } from "@/components/dashboard/Overview";
import { Rabbit, Toast } from "@/components/ui";
import { firebaseEnabled } from "@/lib/firebase";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = ["overview", "clients", "agents", "branches", "import"] as const;
type Tab = (typeof TABS)[number];

export default function DashboardPage() {
  const { t } = useI18n();
  const store = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [filter, setFilter] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((m: string) => setToast(m), []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const initial = p.get("tab") as Tab | null;
    if (initial && TABS.includes(initial)) setTab(initial);
  }, []);

  const go = (next: string, f?: string) => {
    setFilter(f);
    setTab(next as Tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  };

  if (!store.authReady) return <div className="card h-96 animate-pulse" />;
  if (!store.user) return <Login />;

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: t("overview"), icon: LayoutGrid },
    { id: "clients", label: t("clients"), icon: UserSquare2 },
    { id: "agents", label: t("agents"), icon: Users },
    { id: "branches", label: t("branches"), icon: Building2 },
    { id: "import", label: t("import"), icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{t("navDashboard")}</h1>
          <p className="text-sm text-ink-3" dir="ltr">
            {store.user.email}
          </p>
        </div>
        <button onClick={() => store.repo.signOut()} className="btn btn-ghost">
          <LogOut className="size-4" />
          {t("logout")}
        </button>
      </div>

      <div className="scroll-thin -mx-4 overflow-x-auto px-4">
        <div className="inline-flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-line">
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => go(x.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition",
                tab === x.id ? "bg-jt text-white shadow-md shadow-jt/30" : "text-ink-2 hover:bg-bg",
              )}
            >
              <x.icon className="size-4" />
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {store.error && <div className="rounded-2xl bg-jt-50 p-3 text-sm font-bold text-jt-700">{store.error}</div>}

      {tab === "overview" && <Overview go={go} />}
      {tab === "clients" && <ClientsManager key={filter ?? "all"} notify={notify} initialFilter={filter === "unassigned" ? "unassigned" : undefined} />}
      {tab === "agents" && <AgentsManager notify={notify} />}
      {tab === "branches" && <BranchesManager notify={notify} />}
      {tab === "import" && <ImportPanel notify={notify} />}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function Login() {
  const { t } = useI18n();
  const { repo } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await repo.signIn(email.trim(), password);
    } catch (e) {
      setErr((e as Error).message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] bg-surface shadow-[var(--shadow-lift)] md:grid-cols-2">
      <div className="speed-stripes relative hidden flex-col items-center justify-center gap-4 bg-linear-to-br from-jt to-jt-700 p-10 text-white md:flex">
        <Rabbit size={190} float />
        <div className="text-center text-2xl font-black">{t("appName")}</div>
      </div>
      <form onSubmit={submit} className="space-y-4 p-8">
        <div>
          <h1 className="text-2xl font-black">{t("loginTitle")}</h1>
          <p className="mt-1 text-sm text-ink-2">{t("loginBody")}</p>
        </div>
        <div>
          <label className="label" htmlFor="email">
            {t("email")}
          </label>
          <input id="email" type="email" dir="ltr" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            dir="ltr"
            required={firebaseEnabled}
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {err && <p className="rounded-xl bg-jt-50 p-2.5 text-sm font-semibold text-jt-700">{err}</p>}
        <button disabled={busy} className="btn btn-primary w-full !py-3">
          {t("login")}
        </button>
        {!firebaseEnabled && <p className="text-xs text-ink-3">{t("demoMode")}</p>}
      </form>
    </div>
  );
}
