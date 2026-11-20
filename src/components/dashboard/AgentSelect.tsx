"use client";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function AgentSelect({
  value,
  onChange,
  exclude,
  preferIds,
  className,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  exclude?: string | null;
  /** Agents listed first (e.g. the agents of the client's branch). */
  preferIds?: string[];
  className?: string;
}) {
  const { t } = useI18n();
  const { agents } = useStore();
  const sorted = agents.filter((a) => a.id !== exclude).sort((a, b) => a.name.localeCompare(b.name));
  const preferred = sorted.filter((a) => preferIds?.includes(a.id));
  const rest = sorted.filter((a) => !preferIds?.includes(a.id));
  const label = (a: (typeof agents)[number]) => `${a.name} · ${a.id}${a.status !== "active" ? ` (${a.status === "leave" ? t("onLeave") : t("off")})` : ""}`;
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={className ?? "input"}>
      <option value="">{t("none")}</option>
      {preferred.length > 0 && (
        <optgroup label={t("pickupBranch")}>
          {preferred.map((a) => (
            <option key={a.id} value={a.id}>
              {label(a)}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label={t("agents")}>
        {rest.map((a) => (
          <option key={a.id} value={a.id}>
            {label(a)}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
