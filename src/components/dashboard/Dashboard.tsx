/**
 * Dashboard — Pro UI (Ivy 01-main-dashboard.md)
 * Summary cards + Soul team cards + Activity timeline
 */
import { Sparkles, UserMinus, MessageSquare, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import SoulAvatar from "../ui/SoulAvatar";
import { apiFetch } from "../../lib/api-fetch";
import "./dashboard.css";

interface Soul {
  id: string;
  name: string;
  name_ko: string;
  role: string;
  department: string;
  status: string;
  skill_tags?: string[];
  avatar_url?: string;
}

interface Props {
  onChatWithSoul?: (soulId: string) => void;
  onNavigate?: (path: string) => void;
  onRefresh?: () => void;
}

export default function Dashboard({ onChatWithSoul, onNavigate, onRefresh }: Props) {
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissTarget, setDismissTarget] = useState<Soul | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [dismissing, setDismissing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchSouls = useCallback(() => {
    apiFetch("/api/souls")
      .then((r) => r.json())
      .then((d) => { setSouls(d.agents || d.souls || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { fetchSouls(); }, [fetchSouls]);

  const handleDismiss = async () => {
    if (!dismissTarget || !dismissReason.trim()) return;
    setDismissing(true);
    try {
      const res = await apiFetch(`/api/souls/${dismissTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setSouls(prev => prev.filter(s => s.id !== dismissTarget.id));
        setToast(`${dismissTarget.name_ko || dismissTarget.name} 해고 완료`);
        setTimeout(() => setToast(null), 3000);
        onRefresh?.();
      }
    } catch {} finally {
      setDismissing(false); setDismissTarget(null); setDismissReason("");
    }
  };

  const activeSouls = souls.filter((s) => s.status !== "offline").length;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">내 팀</h1>
          <p className="dashboard-subtitle">AI Soul 팀을 관리하세요</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate?.("/hire")}>
          + Soul 추가
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Active Souls</div>
          <div className="summary-value">{activeSouls}</div>
          <div className="summary-sub">/{souls.length > 0 ? "15" : "0"} 정원</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Tasks Today</div>
          <div className="summary-value">—</div>
          <div className="summary-sub">기능 준비 중</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Token Usage</div>
          <div className="summary-value">—</div>
          <div className="summary-sub">LLM 연동 후 표시</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Plan</div>
          <div className="summary-value">Team</div>
          <div className="summary-sub">↑ 업그레이드</div>
        </div>
      </div>

      {/* Soul Team Cards */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="sidebar-loading-dot" />
        </div>
      ) : souls.length === 0 ? (
        <div className="dashboard-empty">
          <Sparkles size={32} strokeWidth={1.5} className="dashboard-empty-icon" />
          <h3>아직 채용한 Soul이 없습니다</h3>
          <p>마켓에서 첫 번째 AI Soul을 채용해보세요</p>
          <button className="btn-primary" onClick={() => onNavigate?.("/hire")}>
            Soul 채용하기 →
          </button>
        </div>
      ) : (
        <>
          <div className="dashboard-section-label">내 Soul 팀 ({souls.length}명)</div>
          <div className="team-grid">
            {souls.map((soul) => (
              <div key={soul.id} className="soul-team-card">
                <div className="soul-card-top">
                  <SoulAvatar
                    name={soul.name}
                    size="lg"
                    department={soul.department}
                    status={soul.status === "active" ? "active" : "idle"}
                    imageUrl={soul.avatar_url}
                  />
                  <div>
                    <div className="soul-card-name">{soul.name_ko || soul.name}</div>
                    <div className="soul-card-role">{soul.role}</div>
                  </div>
                  <span className={`status-dot ${soul.status === "active" ? "online" : "offline"}`} />
                </div>

                {soul.skill_tags && soul.skill_tags.length > 0 && (
                  <div className="soul-skill-list">
                    {soul.skill_tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="soul-skill-chip">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="soul-card-stats">
                  <span>오늘 <strong>—</strong> tasks</span>
                  <span>이번 달 <strong>—</strong> tokens</span>
                </div>

                <div className="soul-card-actions">
                  <button className="soul-chat-btn" onClick={() => onChatWithSoul?.(soul.id)}>
                    <MessageSquare size={14} strokeWidth={1.5} /> 대화하기
                  </button>
                  <button className="soul-dismiss-btn" onClick={() => setDismissTarget(soul)} title="해고">
                    <UserMinus size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dismiss Modal */}
      {dismissTarget && (
        <div className="dismiss-overlay" onClick={() => { setDismissTarget(null); setDismissReason(""); }}>
          <div className="dismiss-modal" onClick={e => e.stopPropagation()}>
            <button className="dismiss-modal-close" onClick={() => { setDismissTarget(null); setDismissReason(""); }}>
              <X size={18} strokeWidth={1.5} />
            </button>
            <div className="dismiss-modal-header">
              <SoulAvatar name={dismissTarget.name} size="lg" department={dismissTarget.department} imageUrl={dismissTarget.avatar_url} />
              <div>
                <h3>정말 해고하시겠습니까?</h3>
                <p className="dismiss-soul-name">{dismissTarget.name_ko || dismissTarget.name} · {dismissTarget.role}</p>
              </div>
            </div>
            <label className="dismiss-label">해고 사유 (필수)</label>
            <textarea
              className="dismiss-textarea"
              placeholder="해고 사유를 입력해주세요..."
              value={dismissReason}
              onChange={e => setDismissReason(e.target.value)}
              rows={3}
            />
            <div className="dismiss-actions">
              <button className="dismiss-cancel" onClick={() => { setDismissTarget(null); setDismissReason(""); }}>취소</button>
              <button className="dismiss-confirm" onClick={handleDismiss} disabled={!dismissReason.trim() || dismissing}>
                {dismissing ? "처리 중..." : "해고 확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="dismiss-toast">{toast}</div>}
    </div>
  );
}
