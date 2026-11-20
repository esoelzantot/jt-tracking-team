"use client";

import { useMemo } from "react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Picker, type PickerOption } from "@/components/Picker";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const DOT = { active: "bg-ok", leave: "bg-warn", off: "bg-ink-3" };

/** Agent dropdown: avatars, IDs, live status and client load, branch agents suggested first. */
export function AgentSelect({
  value,
  onChange,
  exclude,
  preferIds,
  size,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  exclude?: string | null;
  /** Agents listed first (e.g. the agents of the client's branch). */
  preferIds?: string[];
  className?: string;
  size?: "sm" | "md";
  placeholder?: string;
}) {
  const { t } = useI18n();
  const { agents, clients } = useStore();

  const options = useMemo<PickerOption[]>(() => {
    const load = new Map<string, number>();
    for (const c of clients) if (c.agentId) load.set(c.agentId, (load.get(c.agentId) ?? 0) + 1);
    const statusLabel = { active: t("active"), leave: t("onLeave"), off: t("off") };
    const sorted = agents
      .filter((a) => a.id !== exclude)
      .sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active") || a.name.localeCompare(b.name));
    const preferred = sorted.filter((a) => preferIds?.includes(a.id));
    const rest = sorted.filter((a) => !preferIds?.includes(a.id));
    const toOpt = (group: string) => (a: (typeof agents)[number]): PickerOption => ({
      value: a.id,
      label: a.name,
      hint: `#${a.id} · ${load.get(a.id) ?? 0} ${t("clients")}`,
      keywords: `${a.id} ${a.area ?? ""}`,
      group,
      leading: <AgentAvatar agent={a} size={30} showStatus={false} />,
      trailing: (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
            a.status === "active" ? "bg-emerald-50 text-emerald-700" : a.status === "leave" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600",
          )}
        >
          <span className={cn("size-1.5 rounded-full", DOT[a.status])} />
          {statusLabel[a.status]}
        </span>
      ),
    });
    return [...preferred.map(toOpt(t("suggested"))), ...rest.map(toOpt(preferred.length ? t("otherAgents") : t("agents")))];
  }, [agents, clients, exclude, preferIds, t]);

  return (
    <Picker
      value={value}
      onChange={onChange}
      options={options}
      noneLabel={t("none")}
      placeholder={placeholder ?? t("none")}
      searchable
      searchPlaceholder={t("searchAgents")}
      size={size}
      minWidth={300}
    />
  );
}
