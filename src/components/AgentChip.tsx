"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { CopyButton, StatusBadge } from "./ui";

export function AgentChip({ agent, role, highlight }: { agent: Agent; role?: string; highlight?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border p-3 transition",
        highlight ? "border-jt/30 bg-jt-50" : "border-line bg-surface hover:border-jt/30",
        agent.status !== "active" && !highlight && "opacity-75",
      )}
    >
      <Link href={`/agents/${encodeURIComponent(agent.id)}`}>
        <AgentAvatar agent={agent} size={52} />
      </Link>
      <div className="min-w-0 flex-1">
        {role && <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink-3">{role}</div>}
        <Link href={`/agents/${encodeURIComponent(agent.id)}`} className="block truncate font-extrabold hover:text-jt">
          {agent.name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-2">
          <span className="ltr-nums font-bold">#{agent.id}</span>
          <CopyButton value={agent.id} className="!p-0.5" />
          <StatusBadge status={agent.status} />
        </div>
      </div>
      {agent.phone && (
        <a href={`tel:${agent.phone}`} className="btn btn-soft !p-2.5" title={t("phone")}>
          <Phone className="size-4" />
        </a>
      )}
    </div>
  );
}
