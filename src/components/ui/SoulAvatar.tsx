/**
 * SoulAvatar — Neon Dark v2 (GuardianOps style)
 * Department-based neon glow + circular initials
 */
import "./soul-avatar.css";

interface Props {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "active" | "idle" | "offline";
  department?: string;
  imageUrl?: string;
  className?: string;
}

// Neon department colors (Ivy v2 spec)
const DEPT_COLORS: Record<string, { bg: string; fg: string; glow: string }> = {
  engineering: { bg: "rgba(59,130,246,0.2)",  fg: "#93BBFC", glow: "rgba(59,130,246,0.3)" },
  design:      { bg: "rgba(0,212,255,0.15)",  fg: "#67E8F9", glow: "rgba(0,212,255,0.25)" },
  planning:    { bg: "rgba(245,158,11,0.15)", fg: "#FCD34D", glow: "rgba(245,158,11,0.25)" },
  marketing:   { bg: "rgba(236,72,153,0.15)", fg: "#F9A8D4", glow: "rgba(236,72,153,0.2)" },
  security:    { bg: "rgba(239,68,68,0.15)",  fg: "#FCA5A5", glow: "rgba(239,68,68,0.2)" },
  qa:          { bg: "rgba(16,185,129,0.15)", fg: "#6EE7B7", glow: "rgba(16,185,129,0.25)" },
  devops:      { bg: "rgba(249,115,22,0.15)", fg: "#FDB07A", glow: "rgba(249,115,22,0.2)" },
  operations:  { bg: "rgba(139,92,246,0.15)", fg: "#C4B5FD", glow: "rgba(139,92,246,0.25)" },
  data:        { bg: "rgba(0,212,255,0.15)",  fg: "#67E8F9", glow: "rgba(0,212,255,0.25)" },
  cs:          { bg: "rgba(16,185,129,0.15)", fg: "#6EE7B7", glow: "rgba(16,185,129,0.25)" },
  general:     { bg: "rgba(139,92,246,0.15)", fg: "#C4B5FD", glow: "rgba(139,92,246,0.25)" },
};

// Fallback hash palette (neon)
const COLORS = [
  { bg: "rgba(59,130,246,0.2)", fg: "#93BBFC", glow: "rgba(59,130,246,0.3)" },
  { bg: "rgba(139,92,246,0.2)", fg: "#C4B5FD", glow: "rgba(139,92,246,0.3)" },
  { bg: "rgba(0,212,255,0.15)", fg: "#67E8F9", glow: "rgba(0,212,255,0.25)" },
  { bg: "rgba(16,185,129,0.15)", fg: "#6EE7B7", glow: "rgba(16,185,129,0.25)" },
  { bg: "rgba(245,158,11,0.15)", fg: "#FCD34D", glow: "rgba(245,158,11,0.25)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#F9A8D4", glow: "rgba(236,72,153,0.2)" },
];

function getInitials(name: string): string {
  return name.split(/[\s\-_]+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function hashIdx(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % COLORS.length;
}

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };
const FONT_MAP = { xs: 10, sm: 12, md: 14, lg: 18, xl: 22 };

export default function SoulAvatar({ name, size = "md", status, department, imageUrl, className }: Props) {
  const px = SIZE_MAP[size];
  const fs = FONT_MAP[size];
  const dept = DEPT_COLORS[department || ""] || COLORS[hashIdx(name)];

  return (
    <div
      className={`soul-avatar ${className || ""}`}
      style={{
        width: px, height: px,
        background: imageUrl ? `url(${imageUrl}) center/cover` : dept.bg,
        color: dept.fg,
        fontSize: fs,
        boxShadow: imageUrl ? undefined : `0 0 8px ${dept.glow}`,
      }}
    >
      {!imageUrl && <span className="soul-avatar-initials">{getInitials(name)}</span>}
      {status && <span className={`soul-avatar-status ${status}`} />}
    </div>
  );
}
