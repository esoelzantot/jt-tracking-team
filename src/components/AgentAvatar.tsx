"use client";

import { useId } from "react";
import type { Agent } from "@/lib/types";
import { cn, hashString } from "@/lib/utils";

const SKIN = ["#F7D7BA", "#EFC4A0", "#E3AE85", "#CF9469", "#B57A52"];
const HAIR = ["#2B1D16", "#3B2A20", "#1E1E22", "#5A3B28", "#70492D"];
const HIJAB = ["#1F2A44", "#7A2E3F", "#2F4F4F", "#9A6A61", "#4A4A6A", "#C29B78", "#0F5257"];
const BG: [string, string][] = [
  ["#FFE0E1", "#FFB8BE"],
  ["#FFE9D6", "#FFC79E"],
  ["#FDE2F1", "#F8B4D9"],
  ["#E6EEFF", "#BCD0FF"],
  ["#E3F7EE", "#A9E6CB"],
  ["#F1E8FF", "#D3BDFF"],
];

const STATUS_RING = { active: "#17a36b", leave: "#f2a516", off: "#8a8a96" };

interface Props {
  agent: Pick<Agent, "id" | "name" | "gender" | "hijab" | "status">;
  size?: number;
  className?: string;
  showStatus?: boolean;
}

/**
 * Generated illustrated avatar: every agent gets a stable look (skin, hair, colours) derived
 * from their ID, wearing the red J&T hoodie with the rabbit-ear hood.
 */
export function AgentAvatar({ agent, size = 56, className, showStatus = true }: Props) {
  const uid = useId().replace(/:/g, "");
  const h = hashString(agent.id + agent.name);
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >>> 3) % HAIR.length];
  const hijabColor = HIJAB[(h >>> 5) % HIJAB.length];
  const [bg1, bg2] = BG[(h >>> 7) % BG.length];
  const maleStyle = (h >>> 9) % 3;
  const femaleStyle = (h >>> 11) % 2;
  const female = agent.gender === "female";
  const hijab = female && agent.hijab !== false;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={agent.name}>
        <defs>
          <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={bg1} />
            <stop offset="1" stopColor={bg2} />
          </linearGradient>
          <linearGradient id={`hood${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F0343C" />
            <stop offset="1" stopColor="#B8121A" />
          </linearGradient>
          <radialGradient id={`face${uid}`} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`clip${uid}`}>
            <circle cx="60" cy="60" r="60" />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip${uid})`}>
          <rect width="120" height="120" fill={`url(#bg${uid})`} />
          {/* speed stripes */}
          <g stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
            <line x1="88" y1="20" x2="110" y2="20" />
            <line x1="94" y1="28" x2="112" y2="28" />
            <line x1="100" y1="36" x2="114" y2="36" />
          </g>

          {/* rabbit-ear hood */}
          <g transform="rotate(-14 44 30)">
            <ellipse cx="44" cy="22" rx="7.5" ry="19" fill="#fff" />
            <ellipse cx="44" cy="23" rx="3.6" ry="13" fill="#FFB3BC" />
          </g>
          <g transform="rotate(14 76 30)">
            <ellipse cx="76" cy="22" rx="7.5" ry="19" fill="#fff" />
            <ellipse cx="76" cy="23" rx="3.6" ry="13" fill="#FFB3BC" />
          </g>

          {/* long hair behind */}
          {female && !hijab && (
            <path
              d={
                femaleStyle === 0
                  ? "M34 58 C30 30 46 24 60 24 C76 24 90 32 86 58 L90 96 C80 100 72 94 70 92 L50 92 C48 94 40 100 30 96 Z"
                  : "M36 58 C32 32 46 25 60 25 C75 25 88 33 84 58 L84 80 C76 84 44 84 36 80 Z"
              }
              fill={hair}
            />
          )}

          {/* hijab back */}
          {hijab && (
            <path d="M60 24 C36 24 30 46 32 66 C34 86 44 96 60 98 C76 96 86 86 88 66 C90 46 84 24 60 24Z" fill={hijabColor} />
          )}

          {/* hoodie */}
          <path d="M10 124 C10 100 32 88 60 88 C88 88 110 100 110 124 Z" fill={`url(#hood${uid})`} />
          <path d="M42 90 C46 100 54 104 60 104 C66 104 74 100 78 90" fill="none" stroke="#8E0C12" strokeOpacity="0.5" strokeWidth="2.5" />
          {/* drawstrings */}
          <line x1="54" y1="102" x2="53" y2="114" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <line x1="66" y1="102" x2="67" y2="114" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <text x="77" y="113" fontSize="8" fontWeight="900" fill="#fff" fontFamily="Arial, sans-serif" fontStyle="italic" direction="ltr" style={{ unicodeBidi: "bidi-override" }}>
            J&amp;T
          </text>

          {/* neck */}
          {!hijab && <rect x="52" y="72" width="16" height="20" rx="6" fill={skin} />}
          {!hijab && <rect x="52" y="78" width="16" height="6" fill="#000" opacity="0.07" />}

          {/* hijab drape */}
          {hijab && <path d="M38 82 C44 100 52 104 60 104 C68 104 76 100 82 82 C74 90 68 92 60 92 C52 92 46 90 38 82Z" fill={hijabColor} />}

          {/* ears */}
          {!hijab && (
            <>
              <ellipse cx="38" cy="59" rx="4.5" ry="6" fill={skin} />
              <ellipse cx="82" cy="59" rx="4.5" ry="6" fill={skin} />
            </>
          )}

          {/* face */}
          <ellipse cx="60" cy="58" rx={hijab ? 19 : 22} ry={hijab ? 22 : 25} fill={skin} />
          <ellipse cx="60" cy="58" rx={hijab ? 19 : 22} ry={hijab ? 22 : 25} fill={`url(#face${uid})`} />

          {/* hair front */}
          {!female && maleStyle !== 2 && (
            <path
              d={
                maleStyle === 0
                  ? "M37 54 C34 32 48 26 61 27 C76 28 86 36 83 54 C79 43 71 39 60 39 C50 39 41 43 37 54Z"
                  : "M37 55 C33 30 50 22 64 25 C70 22 80 26 80 32 C88 38 86 48 83 55 C79 44 72 38 61 40 C50 41 42 45 37 55Z"
              }
              fill={hair}
            />
          )}
          {!female && maleStyle === 2 && (
            <>
              <path d="M37 54 C34 33 48 27 61 28 C76 29 86 37 83 54 C80 44 71 40 60 40 C50 40 41 44 37 54Z" fill={hair} />
              <path d="M38 60 C40 80 51 86 60 86 C69 86 80 80 82 60 C78 72 71 77 60 77 C49 77 42 72 38 60Z" fill={hair} />
            </>
          )}
          {female && !hijab && (
            <path d="M38 54 C40 34 54 30 64 31 C76 33 83 42 82 54 C74 45 63 41 53 45 C47 47 42 50 38 54Z" fill={hair} />
          )}
          {hijab && <path d="M41 50 C44 38 52 35 60 35 C68 35 76 38 79 50 C72 43 66 41 60 41 C54 41 48 43 41 50Z" fill={hijabColor} />}

          {/* eyes */}
          <ellipse cx="52" cy="59" rx="2.8" ry="3.3" fill="#1B1B1F" />
          <ellipse cx="68" cy="59" rx="2.8" ry="3.3" fill="#1B1B1F" />
          <circle cx="53" cy="58" r="0.9" fill="#fff" />
          <circle cx="69" cy="58" r="0.9" fill="#fff" />
          {/* brows */}
          <path d="M47 52 Q52 49.5 56 51.5" stroke={female ? hair : "#2B1D16"} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={hijab ? 0.8 : 1} />
          <path d="M64 51.5 Q68 49.5 73 52" stroke={female ? hair : "#2B1D16"} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={hijab ? 0.8 : 1} />
          {/* blush */}
          <ellipse cx="46.5" cy="67" rx="4.5" ry="2.6" fill="#FF7A8A" opacity="0.35" />
          <ellipse cx="73.5" cy="67" rx="4.5" ry="2.6" fill="#FF7A8A" opacity="0.35" />
          {/* smile */}
          <path d="M54.5 68 Q60 73.5 65.5 68" stroke="#7A2E2E" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
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
