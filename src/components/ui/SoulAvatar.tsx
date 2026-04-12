/**
 * SoulAvatar — Initial-based circular avatar
 * Replaces pixel sprite avatars with professional initials
 */
import "./soul-avatar.css";

interface Props {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "active" | "idle" | "offline";
  department?: string;
  imageUrl?: string;
  className?: string;
}

// Ivy spec: department-based 8 colors
const DEPT_COLORS: Record<string, { bg: string; fg: string }> = {
  engineering: { bg: "rgba(37,99,235,0.2)",  fg: "#93BBFC" },
  design:      { bg: "rgba(6,182,212,0.2)",  fg: "#67E8F9" },
  planning:    { bg: "rgba(245,158,11,0.2)", fg: "#FCD34D" },
  marketing:   { bg: "rgba(236,72,153,0.2)", fg: "#F9A8D4" },
  security:    { bg: "rgba(239,68,68,0.2)",  fg: "#FCA5A5" },
  qa:          { bg: "rgba(16,185,129,0.2)", fg: "#6EE7B7" },
  devops:      { bg: "rgba(249,115,22,0.2)", fg: "#FDB07A" },
  operations:  { bg: "rgba(139,92,246,0.2)", fg: "#C4B5FD" },
};

// Fallback hash palette
const COLORS = [
  "#2563EB", "#7C3AED", "#0891B2", "#059669",
  "#D97706", "#DC2626", "#4F46E5", "#0D9488",
  "#9333EA", "#E11D48", "#0EA5E9", "#F59E0B",
];

function getInitials(name: string): string {
  return name
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

const SIZE_MAP = { sm: 28, md: 36, lg: 44, xl: 64 };
const FONT_MAP = { sm: 11, md: 13, lg: 16, xl: 22 };

export default function SoulAvatar({ name, size = "md", status, department, imageUrl, className }: Props) {
  const px = SIZE_MAP[size];
  const fs = FONT_MAP[size];
  const dept = DEPT_COLORS[department || ""];

  return (
    <div
      className={`soul-avatar ${className || ""}`}
      style={{
        width: px, height: px,
        borderRadius: "50%",
        background: imageUrl ? `url(${imageUrl}) center/cover` : dept?.bg || hashColor(name),
        color: dept?.fg || "#fff",
        fontSize: fs,
      }}
    >
      {!imageUrl && <span className="soul-avatar-initials">{getInitials(name)}</span>}
      {status && <span className={`soul-avatar-status ${status}`} />}
    </div>
  );
}
