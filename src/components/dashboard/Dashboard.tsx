/**
 * Dashboard — Pro UI (Ivy 01-main-dashboard.md)
 * Summary cards + Soul team cards + Activity timeline
 */
import { Sparkles, UserMinus, MessageSquare, X, Send, ArrowRight, Settings } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [triggerSoul, setTriggerSoul] = useState<Soul | null>(null);
  const [triggerTarget, setTriggerTarget] = useState("");
  const [triggerMsg, setTriggerMsg] = useState("");
  const [triggering, setTriggering] = useState(false);

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
                  <button className="soul-a2a-btn" onClick={() => setTriggerSoul(soul)} title="대화 지시">
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                  <button className="soul-settings-btn" onClick={() => navigate(`/souls/${soul.id}/settings`)} title="설정">
                    <Settings size={14} />
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

      {/* A2A Trigger Modal */}
      {triggerSoul && (
        <div className="dismiss-overlay" onClick={() => { setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg(""); }}>
          <div className="dismiss-modal a2a-trigger-modal" onClick={e => e.stopPropagation()}>
            <button className="dismiss-close" onClick={() => { setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg(""); }}><X size={16} /></button>
            <h3><Send size={16} /> {triggerSoul.name_ko || triggerSoul.name}에게 지시</h3>
            <label>대화 상대 Soul</label>
            <select value={triggerTarget} onChange={(e) => setTriggerTarget(e.target.value)}>
              <option value="">— 선택 —</option>
              {souls.filter(s => s.id !== triggerSoul.id).map(s => (
                <option key={s.id} value={s.id}>{s.name_ko || s.name} ({s.role})</option>
              ))}
            </select>
            <label>지시 내용</label>
            <textarea value={triggerMsg} onChange={(e) => setTriggerMsg(e.target.value)} placeholder="이 Soul에게 전달할 메시지..." rows={3} />
            <div className="dismiss-actions">
              <button className="dismiss-cancel" onClick={() => { setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg(""); }}>취소</button>
              <button className="dismiss-confirm" disabled={!triggerTarget || !triggerMsg.trim() || triggering} onClick={async () => {
                setTriggering(true);
                try {
                  const res = await apiFetch("/api/a2a/trigger", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ from_soul_id: triggerSoul.id, to_soul_id: triggerTarget, message: triggerMsg }),
                  });
                  if (res.ok) {
                    setToast(`대화 트리거 완료! 💬`);
                    setTimeout(() => setToast(null), 3000);
                    setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg("");
                  } else { setToast("트리거 실패"); setTimeout(() => setToast(null), 3000); }
                } catch { setToast("트리거 오류"); setTimeout(() => setToast(null), 3000); }
                finally { setTriggering(false); }
              }}>
                {triggering ? "처리 중..." : "대화 시작"}
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
