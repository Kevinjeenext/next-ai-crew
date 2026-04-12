/**
 * SoulAvatar — Initial-based circular avatar
 * Replaces pixel sprite avatars with professional initials
 */
import "./soul-avatar.css";

interface Props {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "active" | "idle" | "offline";
  imageUrl?: string;
  className?: string;
}

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

export default function SoulAvatar({ name, size = "md", status, imageUrl, className }: Props) {
  const px = SIZE_MAP[size];
  const fs = FONT_MAP[size];

  return (
    <div
      className={`soul-avatar ${className || ""}`}
      style={{
        width: px, height: px,
        borderRadius: "50%",
        background: imageUrl ? `url(${imageUrl}) center/cover` : hashColor(name),
        fontSize: fs,
      }}
    >
      {!imageUrl && <span className="soul-avatar-initials">{getInitials(name)}</span>}
      {status && <span className={`soul-avatar-status ${status}`} />}
    </div>
  );
}
