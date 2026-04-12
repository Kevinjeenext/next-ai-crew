/**
 * ThemeToggle — Dual theme switch (Ivy 11-theme-dual.md spec)
 * Track toggle: 🌙 [track+dot] ☀️
 */
import { useTheme } from "../../ThemeContext";
import { Moon, Sun } from "lucide-react";
import "./theme-toggle.css";

interface Props {
  collapsed?: boolean;
  className?: string;
}

export default function ThemeToggle({ collapsed, className }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${className || ""}`}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={theme === "light"}
    >
      <span className="theme-icon-dark"><Moon size={14} strokeWidth={1.5} /></span>
      {!collapsed && (
        <span className="theme-toggle-track">
          <span className="theme-toggle-dot" />
        </span>
      )}
      <span className="theme-icon-light"><Sun size={14} strokeWidth={1.5} /></span>
    </button>
  );
}
