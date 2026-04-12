/**
 * ThemeToggle — Dark/Light switch button (uses ThemeContext)
 */
import { useTheme } from "../../ThemeContext";

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
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-icon">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
      {!collapsed && (
        <span className="theme-toggle-label">
          {theme === "dark" ? "라이트 모드" : "다크 모드"}
        </span>
      )}
    </button>
  );
}
