/**
 * AppShell — ClawPoD-style sidebar + main content layout
 * Replaces PixiJS office view with chat-centric layout
 */
import { useState, useEffect, useCallback } from "react";
import SoulChatPanel from "../chat/SoulChatPanel";
import Dashboard from "../dashboard/Dashboard";
import SoulAvatar from "../ui/SoulAvatar";
import ThemeToggle from "../ui/ThemeToggle";
import "./app-shell.css";

interface Soul {
  id: string;
  name: string;
  name_ko: string;
  role: string;
  department: string;
  status: "active" | "idle" | "offline";
  last_active?: string;
  avatar_url?: string;
}

interface Props {
  onNavigate?: (path: string) => void;
}

const DEPT_COLORS: Record<string, string> = {
  engineering: "#2563EB",
  design: "#06B6D4",
  planning: "#6366F1",
  marketing: "#F59E0B",
  qa: "#10B981",
  security: "#EF4444",
  devops: "#8B5CF6",
  operations: "#64748B",
  cs: "#EC4899",
  data: "#14B8A6",
  finance: "#F97316",
  hr: "#A855F7",
  legal: "#6B7280",
  research: "#3B82F6",
  general: "#94A3B8",
};

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "#2563EB", "#7C3AED", "#0891B2", "#059669",
    "#D97706", "#DC2626", "#4F46E5", "#0D9488",
    "#9333EA", "#E11D48", "#2DD4BF", "#F59E0B",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AppShell({ onNavigate }: Props) {
  const [souls, setSouls] = useState<Soul[]>([]);
  const [selectedSoulId, setSelectedSoulId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load souls
  useEffect(() => {
    fetch("/api/souls")
      .then((r) => r.json())
      .then((d) => {
        setSouls(d.agents || d.souls || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredSouls = souls.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name_ko?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSoul = souls.find((s) => s.id === selectedSoulId);

  const handleSoulSelect = useCallback((soul: Soul) => {
    setSelectedSoulId(soul.id);
  }, []);

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">◆</span>
            {!sidebarCollapsed && <span className="sidebar-logo-text">Next AI Crew</span>}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "사이드바 열기" : "사이드바 접기"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Soul 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
          </div>
        )}

        {/* Soul List */}
        <div className="sidebar-soul-list">
          <div className="sidebar-section-label">
            {!sidebarCollapsed && `내 Souls (${souls.length})`}
          </div>
          {loading ? (
            <div className="sidebar-loading">
              <div className="sidebar-loading-dot" />
            </div>
          ) : filteredSouls.length === 0 ? (
            <div className="sidebar-empty">
              {!sidebarCollapsed && (
                <>
                  <p>아직 채용한 Soul이 없습니다</p>
                  <button
                    className="sidebar-hire-btn"
                    onClick={() => onNavigate?.("/hire")}
                  >
                    + Soul 채용하기
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredSouls.map((soul) => (
              <button
                key={soul.id}
                className={`sidebar-soul-item ${selectedSoulId === soul.id ? "active" : ""}`}
                onClick={() => handleSoulSelect(soul)}
              >
                <SoulAvatar
                  name={soul.name}
                  size="sm"
                  department={soul.department}
                  status={soul.status || "active"}
                  imageUrl={soul.avatar_url}
                />
                {!sidebarCollapsed && (
                  <div className="sidebar-soul-info">
                    <span className="sidebar-soul-name">
                      {soul.name_ko || soul.name}
                    </span>
                    <span className="sidebar-soul-role">{soul.role}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Add Soul Button */}
        {!sidebarCollapsed && (
          <button
            className="sidebar-add-soul"
            onClick={() => onNavigate?.("/hire")}
          >
            <span>+</span> Soul 추가
          </button>
        )}

        {/* Bottom Nav */}
        <div className="sidebar-nav">
          <button
            className="sidebar-nav-item"
            onClick={() => onNavigate?.("/dashboard/billing")}
          >
            <span className="sidebar-nav-icon">📊</span>
            {!sidebarCollapsed && <span>대시보드</span>}
          </button>
          <button
            className="sidebar-nav-item"
            onClick={() => onNavigate?.("/hire")}
          >
            <span className="sidebar-nav-icon">🏪</span>
            {!sidebarCollapsed && <span>마켓</span>}
          </button>
          <button
            className="sidebar-nav-item"
            onClick={() => onNavigate?.("/settings")}
          >
            <span className="sidebar-nav-icon">⚙️</span>
            {!sidebarCollapsed && <span>설정</span>}
          </button>
          <ThemeToggle collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {selectedSoul ? (
          <SoulChatPanel
            soulId={selectedSoul.id}
            soulName={selectedSoul.name}
            soulNameKo={selectedSoul.name_ko || selectedSoul.name}
            soulRole={selectedSoul.role}
            soulAvatar=""
            department={selectedSoul.department || "general"}
            onClose={() => setSelectedSoulId(null)}
            embedded
          />
        ) : (
          <Dashboard
            onChatWithSoul={(id) => {
              const soul = souls.find((s) => s.id === id);
              if (soul) setSelectedSoulId(soul.id);
            }}
            onNavigate={onNavigate}
          />
        )}
      </main>
    </div>
  );
}
