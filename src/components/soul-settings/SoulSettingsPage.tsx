/**
 * SoulSettingsPage — /souls/:id/settings
 * ClawPoD 참고: 아코디언 7섹션 + 액션 바
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, ChevronRight, User, MessageSquare, BarChart3,
  Cpu, Settings, ScrollText, Pause, Play, UserMinus, Save, Thermometer
} from "lucide-react";
import SoulAvatar from "../ui/SoulAvatar";
import { apiFetch } from "../../lib/api-fetch";
import "./soul-settings.css";

interface Soul {
  id: string; name: string; role: string; status: string;
  avatar_url?: string; domain?: string; persona_prompt?: string;
  skill_tags?: string[]; greeting_message?: string;
  llm_model?: string; llm_temperature?: number;
  created_at?: string; updated_at?: string;
  display_name?: string; preset_id?: string;
}

interface ConvSummary { conversation_id: string; created_at: string; message_count?: number; }

const STATUS_LABELS: Record<string, string> = {
  idle: "대기 중", working: "업무 중", break: "휴식", offline: "오프라인",
};

const STATUS_COLORS: Record<string, string> = {
  idle: "#10b981", working: "#3b82f6", break: "#f59e0b", offline: "#6b7280",
};

const MODEL_OPTIONS = [
  { value: "auto", label: "Auto (자동 분기)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-sonnet", label: "Claude Sonnet" },
  { value: "claude-opus", label: "Claude Opus" },
  { value: "gemini-flash", label: "Gemini Flash" },
];

export default function SoulSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [soul, setSoul] = useState<Soul | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["profile"]));
  const [conversations, setConversations] = useState<ConvSummary[]>([]);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPersona, setEditPersona] = useState("");
  const [editGreeting, setEditGreeting] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editModel, setEditModel] = useState("auto");
  const [editTemp, setEditTemp] = useState(0.7);

  const loadSoul = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/souls/${id}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.soul || data;
        setSoul(s);
        setEditName(s.name || "");
        setEditRole(s.role || "");
        setEditPersona(s.persona_prompt || "");
        setEditGreeting(s.greeting_message || "");
        setEditSkills((s.skill_tags || []).join(", "));
        setEditModel(s.llm_model || "auto");
        setEditTemp(s.llm_temperature ?? 0.7);
      }
    } catch {} finally { setLoading(false); }
  }, [id]);

  const loadConversations = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/soul-chat/${id}/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  }, [id]);

  useEffect(() => { loadSoul(); loadConversations(); }, [loadSoul, loadConversations]);

  const toggleSection = (key: string) => {
    const next = new Set(openSections);
    next.has(key) ? next.delete(key) : next.add(key);
    setOpenSections(next);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/souls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          persona_prompt: editPersona,
          greeting_message: editGreeting,
          skill_tags: editSkills.split(",").map(s => s.trim()).filter(Boolean),
          llm_model: editModel,
          llm_temperature: editTemp,
        }),
      });
      if (res.ok) {
        showToast("저장 완료! ✅");
        loadSoul();
      } else { showToast("저장 실패"); }
    } catch { showToast("오류 발생"); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await apiFetch(`/api/souls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadSoul();
      showToast(`상태 변경: ${STATUS_LABELS[status] || status}`);
    } catch {}
  };

  const handleDismiss = async () => {
    if (!id || !confirm("정말 이 Soul을 해고하시겠습니까?")) return;
    try {
      await apiFetch(`/api/souls/${id}`, { method: "DELETE" });
      showToast("해고 완료");
      setTimeout(() => navigate("/"), 1000);
    } catch {}
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const daysAgo = (date?: string) => {
    if (!date) return "-";
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d === 0 ? "오늘" : `${d}일 전`;
  };

  if (loading) return <div className="soul-settings-loading">로딩 중...</div>;
  if (!soul) return <div className="soul-settings-loading">Soul을 찾을 수 없습니다.</div>;

  const sections = [
    {
      key: "profile", icon: <User size={16} />, title: "프로필",
      desc: "이름, 역할, 아바타, 상태 편집",
      content: (
        <div className="ss-form">
          <div className="ss-field"><label>이름</label><input value={editName} onChange={e => setEditName(e.target.value)} /></div>
          <div className="ss-field"><label>역할</label><input value={editRole} onChange={e => setEditRole(e.target.value)} /></div>
          <div className="ss-field"><label>부서</label><input value={soul.domain || ""} disabled /></div>
          <div className="ss-field">
            <label>상태</label>
            <div className="ss-status-row">
              {["idle", "working", "break", "offline"].map(s => (
                <button key={s} className={`ss-status-btn ${soul.status === s ? "active" : ""}`}
                  style={{ borderColor: STATUS_COLORS[s] }}
                  onClick={() => handleStatusChange(s)}>
                  <span className="ss-status-dot" style={{ background: STATUS_COLORS[s] }} />
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "chat", icon: <MessageSquare size={16} />, title: "채팅 모니터링",
      desc: "이 Soul의 대화 목록",
      content: (
        <div className="ss-chat-list">
          {conversations.length === 0 ? <p className="ss-empty">대화 기록이 없습니다.</p> :
            conversations.map(c => (
              <div key={c.conversation_id} className="ss-chat-item"
                onClick={() => navigate(`/?soul=${id}&conv=${c.conversation_id}`)}>
                <MessageSquare size={14} />
                <span>{new Date(c.created_at).toLocaleString("ko-KR")}</span>
                {c.message_count && <span className="ss-chat-count">{c.message_count}건</span>}
              </div>
            ))}
        </div>
      ),
    },
    {
      key: "metrics", icon: <BarChart3 size={16} />, title: "지표",
      desc: "토큰 사용량 및 비용 분석",
      content: (
        <div className="ss-metrics">
          <div className="ss-metric-card"><span className="ss-metric-label">총 대화 수</span><span className="ss-metric-value">{conversations.length}</span></div>
          <div className="ss-metric-card"><span className="ss-metric-label">상태</span><span className="ss-metric-value">{STATUS_LABELS[soul.status] || soul.status}</span></div>
          <div className="ss-metric-card"><span className="ss-metric-label">LLM 모델</span><span className="ss-metric-value">{soul.llm_model || "auto"}</span></div>
          <div className="ss-metric-card"><span className="ss-metric-label">Temperature</span><span className="ss-metric-value">{soul.llm_temperature ?? 0.7}</span></div>
        </div>
      ),
    },
    {
      key: "ai", icon: <Cpu size={16} />, title: "AI 리소스 설정",
      desc: "LLM 모델 선택, Temperature 조절",
      content: (
        <div className="ss-form">
          <div className="ss-field">
            <label>LLM 모델</label>
            <select value={editModel} onChange={e => setEditModel(e.target.value)}>
              {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="ss-field">
            <label><Thermometer size={14} /> Temperature: {editTemp.toFixed(1)}</label>
            <input type="range" min="0" max="2" step="0.1" value={editTemp}
              onChange={e => setEditTemp(parseFloat(e.target.value))} />
            <div className="ss-temp-labels"><span>정확</span><span>균형</span><span>창의</span></div>
          </div>
        </div>
      ),
    },
    {
      key: "persona", icon: <Settings size={16} />, title: "Soul 설정",
      desc: "페르소나 편집, 인사말, 스킬 태그",
      content: (
        <div className="ss-form">
          <div className="ss-field">
            <label>페르소나 프롬프트</label>
            <textarea value={editPersona} onChange={e => setEditPersona(e.target.value)} rows={6} />
          </div>
          <div className="ss-field">
            <label>인사말</label>
            <textarea value={editGreeting} onChange={e => setEditGreeting(e.target.value)} rows={2} />
          </div>
          <div className="ss-field">
            <label>스킬 태그 (쉼표 구분)</label>
            <input value={editSkills} onChange={e => setEditSkills(e.target.value)} placeholder="전략, 분석, 마케팅..." />
          </div>
        </div>
      ),
    },
    {
      key: "logs", icon: <ScrollText size={16} />, title: "로그",
      desc: "대화 히스토리 목록",
      content: (
        <div className="ss-chat-list">
          {conversations.length === 0 ? <p className="ss-empty">로그가 없습니다.</p> :
            conversations.slice(0, 20).map(c => (
              <div key={c.conversation_id} className="ss-chat-item">
                <ScrollText size={14} />
                <span>{new Date(c.created_at).toLocaleString("ko-KR")}</span>
              </div>
            ))}
        </div>
      ),
    },
  ];

  return (
    <div className="soul-settings-page">
      {/* Header */}
      <div className="ss-header">
        <button className="ss-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <SoulAvatar name={soul.name} imageUrl={soul.avatar_url} size="lg" />
        <div className="ss-header-info">
          <h1>{soul.role} <strong>{soul.name}</strong></h1>
          <div className="ss-header-badges">
            <span className="ss-badge" style={{ color: STATUS_COLORS[soul.status] }}>
              <span className="ss-status-dot" style={{ background: STATUS_COLORS[soul.status] }} />
              {STATUS_LABELS[soul.status] || soul.status}
            </span>
            <span className="ss-badge-meta">{soul.domain || "general"}</span>
            <span className="ss-badge-meta">생성일: {daysAgo(soul.created_at)}</span>
            {soul.updated_at && <span className="ss-badge-meta">수정일: {daysAgo(soul.updated_at)}</span>}
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="ss-sections">
        {sections.map(s => (
          <div key={s.key} className={`ss-section ${openSections.has(s.key) ? "open" : ""}`}>
            <button className="ss-section-header" onClick={() => toggleSection(s.key)}>
              <div className="ss-section-icon">{s.icon}</div>
              <div className="ss-section-text">
                <span className="ss-section-title">{s.title}</span>
                <span className="ss-section-desc">{s.desc}</span>
              </div>
              {openSections.has(s.key) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {openSections.has(s.key) && (
              <div className="ss-section-body">{s.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="ss-action-bar">
        <button className="ss-save-btn" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? "저장 중..." : "저장"}
        </button>
        <div className="ss-action-right">
          {soul.status === "working" ? (
            <button className="ss-action-pause" onClick={() => handleStatusChange("idle")}>
              <Pause size={14} /> 업무 중단
            </button>
          ) : (
            <button className="ss-action-start" onClick={() => handleStatusChange("working")}>
              <Play size={14} /> 업무 시작
            </button>
          )}
          <button className="ss-action-dismiss" onClick={handleDismiss}>
            <UserMinus size={14} /> 해고
          </button>
        </div>
      </div>

      {toast && <div className="ss-toast">{toast}</div>}
    </div>
  );
}
