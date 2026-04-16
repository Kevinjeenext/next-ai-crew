/**
 * Dashboard — Pro UI (Ivy 01-main-dashboard.md)
 * Summary cards + Soul team cards + Activity timeline
 */
import { Sparkles, UserMinus, MessageSquare, X, Send, ArrowRight, Settings, UserPlus, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SoulAvatar from "../ui/SoulAvatar";
import { apiFetch } from "../../lib/api-fetch";
import "./dashboard.css";

const STATUS_LABEL: Record<string, string> = {
  idle: "대기 중", working: "업무 중", break: "휴식", offline: "오프라인", active: "활성",
};

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
  const [usage, setUsage] = useState<{ total_tokens: number; message_count: number; plan: string; plan_limit: number; usage_percent: number } | null>(null);

  const fetchSouls = useCallback(() => {
    apiFetch("/api/souls")
      .then((r) => r.json())
      .then((d) => { setSouls(d.agents || d.souls || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { fetchSouls(); fetchUsage(); }, [fetchSouls]);

  function fetchUsage() {
    apiFetch("/api/usage/summary").then(r => r.ok ? r.json() : null).then(d => d && setUsage(d)).catch(() => {});
  }

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
          <div className="summary-sub">/ {souls.length}명 전체</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">메시지</div>
          <div className="summary-value">{usage?.message_count?.toLocaleString() ?? "0"}</div>
          <div className="summary-sub">이번 달</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">토큰 사용량</div>
          <div className="summary-value">{usage?.total_tokens?.toLocaleString() ?? "0"}</div>
          <div className="summary-sub">{usage && usage.plan_limit > 0 ? `${usage.usage_percent}% 사용` : "이번 달"}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">플랜</div>
          <div className="summary-value">{usage?.plan ?? "—"}</div>
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
          <div className="onboarding-guide-card">
            <h2 className="onboarding-title">첫 번째 <span className="text-cyan">AI 동료</span>를 채용해보세요 🎉</h2>
            <div className="onboarding-avatars">
              <div className="avatar-stack">
                {["/avatars/souls/soul_01_alex.webp", "/avatars/souls/soul_02_sophia.webp", "/avatars/souls/soul_03_marcus.webp"].map((src, i) => (
                  <img key={i} src={src} alt="" className="avatar-preview" style={{ zIndex: 3 - i }} />
                ))}
              </div>
              <span className="avatar-badge">+70</span>
            </div>
            <div className="onboarding-steps">
              <div className="onboarding-step blue">
                <span className="step-icon"><UserPlus size={22} strokeWidth={1.5} /></span>
                <div><strong>Soul 채용</strong><span className="step-label">STEP 1</span><br/><span>마켓에서 나에게 맞는 AI 동료 선택</span></div>
              </div>
              <div className="onboarding-step cyan">
                <span className="step-icon"><MessageSquare size={22} strokeWidth={1.5} /></span>
                <div><strong>대화 시작</strong><span className="step-label">STEP 2</span><br/><span>업무를 설명하고 지시하기</span></div>
              </div>
              <div className="onboarding-step green">
                <span className="step-icon"><CheckCircle2 size={22} strokeWidth={1.5} /></span>
                <div><strong>업무 완료</strong><span className="step-label">STEP 3</span><br/><span>AI가 작업을 수행하고 결과 확인</span></div>
              </div>
            </div>
            <button className="btn-onboarding-cta" onClick={() => onNavigate?.("/hire")}>
              첫 Soul 채용하기 →
            </button>
            <p className="onboarding-reassurance">무료로 시작 · 언제든 해고 가능</p>
          </div>
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
                  <span className={`soul-status-badge ${soul.status || "idle"}`}>
                    {STATUS_LABEL[soul.status] || "대기 중"}
                  </span>
                </div>

                <div className="soul-card-actions">
                  <button className="btn-primary" onClick={() => onChatWithSoul?.(soul.id)}>
                    <MessageSquare size={14} /> 대화
                  </button>
                  <button className="btn-ghost" onClick={() => navigate(`/souls/${soul.id}/settings`)} title="설정">
                    <Settings size={14} />
                  </button>
                  <button className="btn-destructive-ghost" onClick={() => setDismissTarget(soul)} title="해고">
                    <UserMinus size={14} />
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
