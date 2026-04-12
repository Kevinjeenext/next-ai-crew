/**
 * SoulHireMarket — Pro UI v2 (Ivy 07-hire-market.md)
 * Top filter bar + 3-col grid + personality bars + hire modal
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import SoulAvatar from "../ui/SoulAvatar";
import "./soul-hire-market.css";

interface Preset {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description: string;
  skill_tags: string[];
  domain: string;
  default_model: string;
  greeting_message: string;
  is_premium: boolean;
  personality?: Record<string, number>;
  thumbnail_url?: string;
}

const CAT_LABELS: Record<string, string> = {
  engineering: "개발", design: "디자인", marketing: "마케팅",
  cs: "고객 서비스", data: "데이터", finance: "재무",
  hr: "인사", legal: "법무", research: "리서치", general: "일반",
};

const PBAR_CONFIG = [
  { key: "thoroughness", label: "꼼꼼함", cls: "thoroughness" },
  { key: "creativity",   label: "창의성", cls: "creativity" },
  { key: "speed",        label: "속도",   cls: "speed" },
];

const DEFAULT_TASKS: Record<string, string[]> = {
  engineering: ["코드 리뷰", "API 개발", "버그 수정", "기술 문서 작성", "테스트 작성", "리팩토링"],
  design: ["UI 디자인", "프로토타입", "디자인 시스템", "아이콘 제작"],
  marketing: ["콘텐츠 작성", "SEO 최적화", "캠페인 기획", "SNS 관리"],
  general: ["일반 업무", "문서 작성", "리서치", "데이터 정리"],
};

interface HireModalProps {
  preset: Preset;
  onClose: () => void;
  onConfirm: (presetId: string, tasks: string[], instruction: string) => void;
  hiring: boolean;
  teamCount: number;
  maxSouls: number;
}

function HireModal({ preset, onClose, onConfirm, hiring, teamCount, maxSouls: MAX_SOULS }: HireModalProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [instruction, setInstruction] = useState("");
  const tasks = DEFAULT_TASKS[preset.category] || DEFAULT_TASKS.general;

  const toggleTask = (t: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  return (
    <div className="hire-modal-overlay" onClick={onClose}>
      <div className="hire-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hire-modal-header">
          <button className="soul-chat-close" onClick={onClose}>✕</button>
        </div>
        <div className="hire-modal-body">
          <div className="hire-modal-soul">
            <SoulAvatar name={preset.name} size="xl" department={preset.category} imageUrl={preset.thumbnail_url} />
            <div className="hire-modal-soul-info">
              <div className="hire-modal-soul-name">{preset.display_name}</div>
              <div className="hire-modal-soul-meta">{preset.name} · {CAT_LABELS[preset.category] || preset.category}</div>
            </div>
          </div>

          <div className="hire-modal-section-title">💼 담당 업무 선택</div>
          <div className="task-select-grid">
            {tasks.map((t) => (
              <button
                key={t}
                className={`task-select-item ${selectedTasks.has(t) ? "selected" : ""}`}
                onClick={() => toggleTask(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="hire-modal-section-title">📝 추가 지시 사항 (선택)</div>
          <textarea
            className="input"
            rows={3}
            placeholder="예) 우리 프로덕트는 Next.js + Python FastAPI 스택입니다..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        <div className="hire-modal-footer">
          <div className="hire-modal-capacity">
            정원 <strong>{teamCount}/{MAX_SOULS}</strong>명 이용 가능
          </div>
          <div className="hire-modal-actions">
            <button className="btn-secondary" onClick={onClose}>취소</button>
            <button
              className="btn-primary"
              onClick={() => onConfirm(preset.id, [...selectedTasks], instruction)}
              disabled={hiring || teamCount >= MAX_SOULS}
            >
              {teamCount >= MAX_SOULS ? "정원 초과" : hiring ? "채용 중..." : "채용 확정 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SoulHireMarket({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [modalPreset, setModalPreset] = useState<Preset | null>(null);
  const [hiring, setHiring] = useState(false);
  const [hiredIds, setHiredIds] = useState<Set<string>>(new Set());
  const [teamCount, setTeamCount] = useState(0);
  const MAX_SOULS = 15;

  useEffect(() => {
    Promise.all([
      fetch("/api/soul-presets").then((r) => r.json()).catch(() => ({ presets: [] })),
      fetch("/api/souls").then((r) => r.json()).catch(() => ({ agents: [] })),
    ]).then(([presetData, soulData]) => {
      setPresets(presetData.presets || []);
      const souls = soulData.agents || soulData.souls || [];
      setTeamCount(souls.length);
      // Mark already-hired preset IDs
      const hired = new Set<string>(souls.map((s: any) => s.preset_id).filter(Boolean));
      setHiredIds(hired);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const m: Record<string, number> = {};
    presets.forEach((p) => { m[p.category] = (m[p.category] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [presets]);

  const filtered = useMemo(() => {
    return presets.filter((p) => {
      if (activeCats.size > 0 && !activeCats.has(p.category)) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.display_name.toLowerCase().includes(q) ||
               p.description?.toLowerCase().includes(q) || p.skill_tags?.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [presets, activeCats, search]);

  const toggleCat = (c: string) => {
    setActiveCats((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });
  };

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
  };

  const handleHire = async (presetId: string, _tasks: string[], _instruction: string) => {
    setHiring(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/souls", {
        method: "POST",
        headers,
        body: JSON.stringify({ preset_id: presetId }),
      });
      if (res.ok) {
        setHiredIds((p) => new Set(p).add(presetId));
        setTeamCount((c) => c + 1);
        setModalPreset(null);
        showToast(`✅ Soul 채용 완료!`);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || "채용 실패 — 다시 시도해주세요");
      }
    } catch { showToast("네트워크 오류 — 연결을 확인해주세요"); }
    finally { setHiring(false); }
  };

  const getPbar = (preset: Preset, key: string) => {
    if (preset.personality?.[key]) return preset.personality[key];
    // Generate deterministic value from name hash
    let h = 0;
    for (const c of preset.name + key) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
    return 50 + (Math.abs(h) % 45); // 50~95
  };

  return (
    <div className="hire-market-page">
      {/* Header */}
      <div className="hire-header">
        <div className="hire-top-row">
          <h1 className="hire-title">Soul 채용</h1>
          <div className="hire-pro-search">
            <input
              type="text" className="input" placeholder="이름, 역할, 스킬로 검색..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="hire-team-badge">
            내 팀 <strong>{teamCount}</strong>/{MAX_SOULS}
            <div className="hire-team-bar">
              <div className="hire-team-bar-fill" style={{ width: `${(teamCount / MAX_SOULS) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="hire-filter-bar">
        {categories.map(([cat]) => (
          <button
            key={cat}
            className={`filter-dropdown-btn ${activeCats.has(cat) ? "active" : ""}`}
            onClick={() => toggleCat(cat)}
          >
            {CAT_LABELS[cat] || cat}
          </button>
        ))}
        <div className="filter-spacer" />
        {activeCats.size > 0 && (
          <button className="filter-reset-btn" onClick={() => setActiveCats(new Set())}>
            ✕ 초기화
          </button>
        )}
      </div>

      {/* Active tags */}
      {activeCats.size > 0 && (
        <div className="filter-active-tags">
          {[...activeCats].map((cat) => (
            <span key={cat} className="filter-tag">
              {CAT_LABELS[cat] || cat}
              <button className="filter-tag-remove" onClick={() => toggleCat(cat)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="hire-grid-area">
        {loading ? (
          <div className="dashboard-loading"><div className="sidebar-loading-dot" /></div>
        ) : (
          <div className="hire-grid">
            {filtered.map((p) => {
              const isHired = hiredIds.has(p.id);
              return (
                <div key={p.id} className={`hire-market-card ${isHired ? "is-hired" : ""}`}>
                  <div className="hmc-head">
                    <SoulAvatar name={p.name} size="lg" department={p.category} imageUrl={p.thumbnail_url} />
                    <div className="hmc-meta">
                      <div className="hmc-name">{p.display_name}</div>
                      <div className="hmc-role">{p.name}</div>
                      <div className="hmc-detail">{CAT_LABELS[p.category] || p.category}</div>
                    </div>
                  </div>

                  {p.skill_tags?.length > 0 && (
                    <div className="hmc-skills">
                      {p.skill_tags.slice(0, 4).map((t) => <span key={t} className="hmc-skill">{t}</span>)}
                      {p.skill_tags.length > 4 && <span className="hmc-skill-more">+{p.skill_tags.length - 4}</span>}
                    </div>
                  )}

                  <div className="hmc-pbars">
                    {PBAR_CONFIG.map(({ key, label, cls }) => {
                      const pct = getPbar(p, key);
                      return (
                        <div key={key} className="hmc-pbar-row">
                          <span className="hmc-pbar-label">{label}</span>
                          <div className="hmc-pbar-track">
                            <div className={`hmc-pbar-fill ${cls}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {p.description && <div className="hmc-quote">"{p.description}"</div>}

                  <div className="hmc-actions">
                    {isHired ? (
                      <button className="hmc-hire-btn hired">✓ 채용됨</button>
                    ) : (
                      <button className="hmc-hire-btn" onClick={() => setModalPreset(p)}>채용하기</button>
                    )}
                    <button className="hmc-profile-btn">프로필</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalPreset && (
        <HireModal
          preset={modalPreset}
          onClose={() => setModalPreset(null)}
          onConfirm={handleHire}
          hiring={hiring}
          teamCount={teamCount}
          maxSouls={MAX_SOULS}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="hmc-toast" onClick={() => setToastMsg(null)}>{toastMsg}</div>
      )}
    </div>
  );
}
