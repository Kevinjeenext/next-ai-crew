/**
 * SoulHireCard — Soul 채용 카드 컴포넌트
 *
 * Ivy UX spec: pixel avatar, name, Lv, personality dot bars,
 * skill badges, hire button. 3 states: default / hover / hired.
 */
import { useState } from "react";

export interface SoulPersonality {
  detail: number;      // 꼼꼼함 0-5
  creativity: number;  // 창의성 0-5
  speed: number;       // 속도 0-5
  teamwork: number;    // 협업 0-5
}

export interface SoulTemplate {
  id: string;
  name: string;
  name_ko: string;
  role_title: string;
  role_title_ko: string;
  department: string;
  avatar: string;
  level: number;
  personality_text: string;
  personality_text_ko: string;
  personality: SoulPersonality;
  skills: string[];
  greeting: string;
  greeting_ko: string;
  tier: "lite" | "standard" | "pro" | "premium";
  cli_provider: string;
  tasks_completed?: number;
}

interface Props {
  soul: SoulTemplate;
  hired?: boolean;
  onHire: (soul: SoulTemplate) => void;
  language?: "en" | "ko";
}

const PERSONALITY_LABELS = {
  en: { detail: "Detail", creativity: "Creativity", speed: "Speed", teamwork: "Teamwork" },
  ko: { detail: "꼼꼼함", creativity: "창의성", speed: "속도", teamwork: "협업" },
};

const TIER_COLORS: Record<string, string> = {
  lite: "#94a3b8",
  standard: "#06b6d4",
  pro: "#a78bfa",
  premium: "#fbbf24",
};

function DotBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: i < value ? "var(--soul-cyan, #06b6d4)" : "rgba(255,255,255,0.15)",
            transition: "background 0.2s",
          }}
        />
      ))}
    </span>
  );
}

export default function SoulHireCard({ soul, hired = false, onHire, language = "ko" }: Props) {
  const [hovered, setHovered] = useState(false);
  const labels = PERSONALITY_LABELS[language];
  const name = language === "ko" ? soul.name_ko || soul.name : soul.name;
  const roleTitle = language === "ko" ? soul.role_title_ko || soul.role_title : soul.role_title;
  const introText = language === "ko"
    ? soul.personality_text_ko || soul.personality_text
    : soul.personality_text;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--th-card-bg, #1e293b)",
        borderRadius: 12,
        padding: 20,
        border: hired
          ? "2px solid #FBBF24"
          : `1px solid ${hovered ? "rgba(6,182,212,0.4)" : "var(--th-card-border, rgba(255,255,255,0.08))"}`,
        boxShadow: hired
          ? "0 0 16px rgba(251,191,36,0.2)"
          : hovered
            ? "0 4px 24px rgba(6,182,212,0.15)"
            : "none",
        transform: hovered && !hired ? "translateY(-4px)" : "none",
        transition: "all 0.25s ease",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column" as const,
        gap: 12,
        position: "relative" as const,
      }}
    >
      {/* Tier badge */}
      <span
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          color: TIER_COLORS[soul.tier] || "#94a3b8",
          letterSpacing: "0.05em",
        }}
      >
        {soul.tier}
      </span>

      {/* Avatar + Name + Role */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src={soul.avatar}
          alt={name}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            imageRendering: "pixelated",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#fff" }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            {roleTitle}
          </div>
          <div style={{ fontSize: 10, color: "#FBBF24", marginTop: 2, fontWeight: 700 }}>
            ⭐ Lv.{soul.level}
            {soul.tasks_completed != null && (
              <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, marginLeft: 8 }}>
                ⚡ {soul.tasks_completed} tasks
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Soul intro */}
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.6)",
          fontStyle: "italic",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 8,
          lineHeight: 1.5,
        }}
      >
        "{introText}"
      </div>

      {/* Personality dot bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 11 }}>
        {(Object.keys(soul.personality) as (keyof SoulPersonality)[]).map((key) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", minWidth: 40 }}>{labels[key]}</span>
            <DotBar value={soul.personality[key]} />
          </div>
        ))}
      </div>

      {/* Skill badges */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
        {soul.skills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(6,182,212,0.12)",
              color: "rgba(6,182,212,0.9)",
              border: "1px solid rgba(6,182,212,0.2)",
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Hire button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!hired) onHire(soul);
        }}
        disabled={hired}
        style={{
          marginTop: 4,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          fontWeight: 700,
          fontSize: 13,
          cursor: hired ? "default" : "pointer",
          background: hired
            ? "rgba(251,191,36,0.15)"
            : "linear-gradient(135deg, #06b6d4, #0891b2)",
          color: hired ? "#FBBF24" : "#fff",
          transition: "all 0.2s",
          width: "100%",
        }}
      >
        {hired ? "✓ 채용됨" : "✦ 채용하기"}
      </button>
    </div>
  );
}
