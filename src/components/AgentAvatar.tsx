"use client";

import { useId } from "react";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_RING = { active: "#17a36b", leave: "#f2a516", off: "#8a8a96" };

const SKIN = "#EDC3A0";
const SKIN_SHADE = "#D9A47F";
const BLAZER = "#1F2733";
const BLAZER_DARK = "#141A23";

interface Props {
  agent: Pick<Agent, "name" | "gender" | "status"> & Partial<Pick<Agent, "id">>;
  size?: number;
  className?: string;
  showStatus?: boolean;
}

/** Two formal avatars — one male, one female — in J&T colours. */
export function AgentAvatar({ agent, size = 56, className, showStatus = true }: Props) {
  const uid = useId().replace(/:/g, "");
  const female = agent.gender === "female";

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={agent.name}>
        <defs>
          <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="0" y2="1">
            {female ? (
              <>
                <stop offset="0" stopColor="#FCEEF0" />
                <stop offset="1" stopColor="#F3CDD3" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#EEF2F7" />
                <stop offset="1" stopColor="#CBD5E1" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`blz${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2B3543" />
            <stop offset="1" stopColor={BLAZER} />
          </linearGradient>
          <linearGradient id={`hij${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9B2733" />
            <stop offset="1" stopColor="#7A1C27" />
          </linearGradient>
          <radialGradient id={`face${uid}`} cx="0.42" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`clip${uid}`}>
            <circle cx="60" cy="60" r="60" />
          </clipPath>
        </defs>

        <g clipPath={`url(#clip${uid})`}>
          <rect width="120" height="120" fill={`url(#bg${uid})`} />

          {/* blazer */}
          <path d="M6 124 C6 101 28 90 60 90 C92 90 114 101 114 124 Z" fill={`url(#blz${uid})`} />

          {female ? (
            <>
              {/* blouse */}
              <path d="M48 92 L60 118 L72 92 Z" fill="#F8FAFC" />
              {/* lapels */}
              <path d="M46 92 L38 99 L55 118 L58 110 Z" fill={BLAZER_DARK} />
              <path d="M74 92 L82 99 L65 118 L62 110 Z" fill={BLAZER_DARK} />
              {/* hijab */}
              <path d="M60 21 C37 21 31 42 32 62 C33 81 42 93 60 97 C78 93 87 81 88 62 C89 42 83 21 60 21 Z" fill={`url(#hij${uid})`} />
              <path d="M35 74 C37 99 47 108 60 110 C73 108 83 99 85 74 C79 90 70 97 60 97 C50 97 41 90 35 74 Z" fill="#6E1822" />
              <path d="M60 97 C55 102 52 106 50 110" stroke="#5E141D" strokeWidth="1.2" fill="none" opacity="0.6" />
              {/* face */}
              <ellipse cx="60" cy="59" rx="18" ry="21.5" fill={SKIN} />
              <ellipse cx="60" cy="59" rx="18" ry="21.5" fill={`url(#face${uid})`} />
              {/* under-scarf band */}
              <path d="M41.5 51 C44 39 51 35.5 60 35.5 C69 35.5 76 39 78.5 51 C72 44 66 41.5 60 41.5 C54 41.5 48 44 41.5 51 Z" fill="#B53340" />
              {/* brooch */}
              <circle cx="72" cy="94" r="2.2" fill="#F4C95D" />
            </>
          ) : (
            <>
              {/* shirt */}
              <path d="M47 91 L60 116 L73 91 Z" fill="#FFFFFF" />
              {/* collar */}
              <path d="M47 91 L54 102 L60 93 Z" fill="#E5E9F0" />
              <path d="M73 91 L66 102 L60 93 Z" fill="#E5E9F0" />
              {/* tie */}
              <path d="M57 94 L63 94 L62 99.5 L58 99.5 Z" fill="#B8121A" />
              <path d="M58 99.5 L62 99.5 L65.5 115 L60 121 L54.5 115 Z" fill="#E3222B" />
              {/* lapels */}
              <path d="M45 91 L37 99 L54 118 L57 108 Z" fill={BLAZER_DARK} />
              <path d="M75 91 L83 99 L66 118 L63 108 Z" fill={BLAZER_DARK} />
              {/* pocket square */}
              <path d="M84 104 L92 104 L90 108 L86 108 Z" fill="#E3222B" />
              {/* neck */}
              <path d="M51 72 L69 72 L69 90 C66 95 54 95 51 90 Z" fill={SKIN_SHADE} />
              {/* ears */}
              <ellipse cx="38.5" cy="58" rx="4" ry="5.5" fill={SKIN_SHADE} />
              <ellipse cx="81.5" cy="58" rx="4" ry="5.5" fill={SKIN_SHADE} />
              {/* face */}
              <ellipse cx="60" cy="56" rx="21" ry="24" fill={SKIN} />
              <ellipse cx="60" cy="56" rx="21" ry="24" fill={`url(#face${uid})`} />
              {/* hair: neat side part */}
              <path
                d="M38.5 53 C36 33 47 25 61 25 C75 25 85.5 33 82 53 C81 46 78.5 41.5 74 39 C66 42 52 41.5 44 44.5 C41 46.5 39.5 49.5 38.5 53 Z"
                fill="#2A211D"
              />
              <path d="M50 30 C56 33 63 34 71 33" stroke="#3A2E28" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* features */}
          <path d="M48 52.5 Q52.5 50.5 56.5 52" stroke="#2A211D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M63.5 52 Q67.5 50.5 72 52.5" stroke="#2A211D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <ellipse cx="52.5" cy={female ? 59 : 58} rx="2.3" ry="2.6" fill="#1F1A17" />
          <ellipse cx="67.5" cy={female ? 59 : 58} rx="2.3" ry="2.6" fill="#1F1A17" />
          <circle cx="53.2" cy={female ? 58.2 : 57.2} r="0.7" fill="#fff" />
          <circle cx="68.2" cy={female ? 58.2 : 57.2} r="0.7" fill="#fff" />
          {female && (
            <>
              <path d="M49.5 57 L48.2 55.8" stroke="#1F1A17" strokeWidth="1" strokeLinecap="round" />
              <path d="M70.5 57 L71.8 55.8" stroke="#1F1A17" strokeWidth="1" strokeLinecap="round" />
            </>
          )}
          <path d={female ? "M60 61 L58.6 66.5 L61 66.8" : "M60 60 L58.4 66 L61 66.3"} stroke={SKIN_SHADE} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={female ? "M55 71 Q60 74.5 65 71" : "M54.5 70.5 Q60 74 65.5 70.5"}
            stroke={female ? "#B4535D" : "#8A4B3C"}
            strokeWidth="1.9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <circle cx="60" cy="60" r="59.25" fill="none" stroke="#000" strokeOpacity="0.06" strokeWidth="1.5" />
      </svg>
      {showStatus && (
        <span
          className="absolute bottom-[4%] end-[4%] rounded-full ring-[3px] ring-white"
          style={{ width: Math.max(10, size * 0.2), height: Math.max(10, size * 0.2), background: STATUS_RING[agent.status] }}
        />
      )}
    </div>
  );
}
