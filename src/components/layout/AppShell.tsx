/**
 * AppShell — ClawPoD-style sidebar + main content layout
 * Persistent sidebar across all authenticated pages
 * Uses react-router Outlet for nested routing
 */
import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import SoulChatPanel from "../chat/SoulChatPanel";
import Dashboard from "../dashboard/Dashboard";
import SoulAvatar from "../ui/SoulAvatar";
import ThemeToggle from "../ui/ThemeToggle";
import { useTheme } from "../../ThemeContext";
import { LayoutDashboard, Store, Settings, Plus, Shield, ArrowLeft, ChevronRight, Home, PanelLeftOpen, PanelLeftClose } from "lucide-react";
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

const DEPT_COLORS: Record<string, string> = {
  engineering: "#2563EB", design: "#06B6D4", planning: "#6366F1",
  marketing: "#F59E0B", qa: "#10B981", security: "#EF4444",
  devops: "#8B5CF6", operations: "#64748B", cs: "#EC4899",
  data: "#14B8A6", finance: "#F97316", hr: "#A855F7",
  legal: "#6B7280", research: "#3B82F6", general: "#94A3B8",
};

function getInitials(name: string): string {
  return name.split(/[\s-]+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ["#2563EB","#7C3AED","#0891B2","#059669","#D97706","#DC2626","#4F46E5","#0D9488","#9333EA","#E11D48","#2DD4BF","#F59E0B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Breadcrumb config
const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  "/": { label: "대시보드" },
  "/hire": { label: "Soul 마켓", parent: "/" },
  "/settings": { label: "설정", parent: "/" },
  "/dashboard/billing": { label: "빌링", parent: "/" },
};

export default function AppShell() {
  const [souls, setSouls] = useState<Soul[]>([]);
  const [selectedSoulId, setSelectedSoulId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current page from route
  const currentPath = location.pathname;
  const isSubPage = currentPath !== "/" && currentPath !== "";

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "";
    fetch(`${API}/api/souls`)
      .then((r) => r.json())
      .then((d) => { setSouls(d.agents || d.souls || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredSouls = souls.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name_ko?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSoul = souls.find((s) => s.id === selectedSoulId);

  const handleSoulSelect = useCallback((soul: Soul) => {
    setSelectedSoulId(soul.id);
    if (currentPath !== "/") navigate("/");
  }, [currentPath, navigate]);

  // Build breadcrumb trail
  function getBreadcrumbs(): Array<{ label: string; path: string }> {
    const trail: Array<{ label: string; path: string }> = [];
    let path = currentPath;
    while (path && BREADCRUMBS[path]) {
      trail.unshift({ label: BREADCRUMBS[path].label, path });
      path = BREADCRUMBS[path].parent || "";
    }
    return trail;
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} title="대시보드로 이동">
            {sidebarCollapsed
              ? <span style={{ font: '700 20px Inter,sans-serif', background: 'linear-gradient(90deg,#3B82F6,#00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>N</span>
              : <img src={theme === 'dark' ? '/logo.svg' : '/logo-light.svg'} alt="Next AI Crew" style={{ height: 28 }} />
            }
          </div>
          <button className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "사이드바 열기" : "사이드바 접기"}>
            {sidebarCollapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="sidebar-search">
            <input type="text" placeholder="Soul 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="sidebar-search-input" />
          </div>
        )}

        <div className="sidebar-soul-list">
          <div className="sidebar-section-label">{!sidebarCollapsed && `내 Souls (${souls.length})`}</div>
          {loading ? (
            <div className="sidebar-loading"><div className="sidebar-loading-dot" /></div>
          ) : filteredSouls.length === 0 ? (
            <div className="sidebar-empty">
              {!sidebarCollapsed && (
                <>
                  <p>아직 채용한 Soul이 없습니다</p>
                  <button className="sidebar-hire-btn" onClick={() => navigate("/hire")}>+ Soul 채용하기</button>
                </>
              )}
            </div>
          ) : (
            filteredSouls.map((soul) => (
              <button key={soul.id} className={`sidebar-soul-item ${selectedSoulId === soul.id ? "active" : ""}`} onClick={() => handleSoulSelect(soul)} title={sidebarCollapsed ? (soul.name_ko || soul.name) : undefined}>
                <SoulAvatar name={soul.name} size="sm" department={soul.department} status={soul.status || "active"} imageUrl={soul.avatar_url} />
                {!sidebarCollapsed && (
                  <div className="sidebar-soul-info">
                    <span className="sidebar-soul-name">{soul.name_ko || soul.name}</span>
                    <span className="sidebar-soul-role">{soul.role}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {!sidebarCollapsed && (
          <button className="sidebar-add-soul" onClick={() => navigate("/hire")}>
            <Plus size={16} strokeWidth={2} /> Soul 추가
          </button>
        )}

        <div className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} title={sidebarCollapsed ? "대시보드" : undefined}>
            <LayoutDashboard size={18} strokeWidth={1.5} className="sidebar-nav-icon" />
            {!sidebarCollapsed && <span>대시보드</span>}
          </NavLink>
          <NavLink to="/hire" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} title={sidebarCollapsed ? "마켓" : undefined}>
            <Store size={18} strokeWidth={1.5} className="sidebar-nav-icon" />
            {!sidebarCollapsed && <span>마켓</span>}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} title={sidebarCollapsed ? "설정" : undefined}>
            <Settings size={18} strokeWidth={1.5} className="sidebar-nav-icon" />
            {!sidebarCollapsed && <span>설정</span>}
          </NavLink>
          <ThemeToggle collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* Breadcrumb + Back button */}
        {isSubPage && (
          <div className="app-breadcrumb">
            <button className="breadcrumb-back" onClick={() => navigate(-1)} title="뒤로가기">
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
            <NavLink to="/" className="breadcrumb-home"><Home size={14} strokeWidth={1.5} /></NavLink>
            {getBreadcrumbs().slice(1).map((bc, i) => (
              <span key={bc.path} className="breadcrumb-segment">
                <ChevronRight size={12} strokeWidth={1.5} />
                {i === getBreadcrumbs().length - 2 ? (
                  <span className="breadcrumb-current">{bc.label}</span>
                ) : (
                  <NavLink to={bc.path} className="breadcrumb-link">{bc.label}</NavLink>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Outlet renders child route content; dashboard is the index */}
        <Outlet context={{ souls, selectedSoul, selectedSoulId, setSelectedSoulId: handleSoulSelect, navigate }} />
      </main>
    </div>
  );
}
