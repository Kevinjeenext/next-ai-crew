/**
 * SkillDetailPage — /skills/:id
 * 스킬 상세 + 설치/제거 + 설치된 Soul 목록
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, HardDrive, Calendar, Check, Plus, X } from "lucide-react";
import SoulAvatar from "../ui/SoulAvatar";
import { apiFetch } from "../../lib/api-fetch";
import { SKILL_PRESETS } from "./skill-presets";
import "./skills.css";

interface Soul { id: string; name: string; role: string; avatar_url?: string; skill_tags?: string[]; }

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const skill = SKILL_PRESETS.find(s => s.id === id);

  const loadSouls = useCallback(async () => {
    try {
      const res = await apiFetch("/api/souls");
      if (res.ok) {
        const data = await res.json();
        setSouls(data.souls || data.agents || []);
      }
    } catch {}
  }, []);

  useEffect(() => { loadSouls(); }, [loadSouls]);

  if (!skill) return (
    <div className="skill-detail-page">
      <p>스킬을 찾을 수 없습니다.</p>
      <button onClick={() => navigate("/skills")}>← 스토어로</button>
    </div>
  );

  const installedSouls = souls.filter(s =>
    (s.skill_tags || []).some(t => t.toLowerCase() === skill.name.toLowerCase() || t === skill.id)
  );
  const availableSouls = souls.filter(s => !installedSouls.includes(s));

  const installSkill = async (soulId: string) => {
    setInstalling(soulId);
    try {
      const soul = souls.find(s => s.id === soulId);
      if (!soul) return;
      const currentTags = soul.skill_tags || [];
      const newTags = [...currentTags, skill.name];
      await apiFetch(`/api/souls/${soulId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_tags: newTags }),
      });
      showToast(`${soul.name}에 ${skill.name} 설치 완료!`);
      loadSouls();
    } catch { showToast("설치 실패"); }
    finally { setInstalling(null); }
  };

  const removeSkill = async (soulId: string) => {
    try {
      const soul = souls.find(s => s.id === soulId);
      if (!soul) return;
      const newTags = (soul.skill_tags || []).filter(t =>
        t.toLowerCase() !== skill.name.toLowerCase() && t !== skill.id
      );
      await apiFetch(`/api/souls/${soulId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_tags: newTags }),
      });
      showToast(`${soul.name}에서 ${skill.name} 제거`);
      loadSouls();
    } catch {}
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  return (
    <div className="skill-detail-page">
      {/* Header */}
      <div className="skill-detail-header">
        <button className="skill-back" onClick={() => navigate("/skills")}><ArrowLeft size={20} /></button>
        <div className="skill-detail-icon">{skill.icon}</div>
        <div className="skill-detail-info">
          <h1>{skill.name} <span className="skill-detail-ver">v{skill.version}</span></h1>
          <p className="skill-detail-author">by {skill.author}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="skill-stats">
        <div className="skill-stat"><HardDrive size={14} /><span>{skill.size}</span><label>크기</label></div>
        <div className="skill-stat"><Download size={14} /><span>{skill.downloads.toLocaleString()}</span><label>다운로드</label></div>
        <div className="skill-stat"><Calendar size={14} /><span>{skill.updatedAt}</span><label>수정일</label></div>
      </div>

      {/* Description */}
      <section className="skill-section">
        <h2>설명</h2>
        <p>{skill.description}</p>
      </section>

      {/* Features */}
      <section className="skill-section">
        <h2>✅ 기능</h2>
        <ul>{skill.features.map((f, i) => <li key={i}><Check size={12} /> {f}</li>)}</ul>
      </section>

      {/* When to use */}
      <section className="skill-section">
        <h2>📌 사용 시점</h2>
        <ul>{skill.whenToUse.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </section>

      {/* Cautions */}
      <section className="skill-section">
        <h2>⚠️ 주의사항</h2>
        <ul>{skill.cautions.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </section>

      {/* Installed Souls */}
      <section className="skill-section">
        <h2>🤖 장착된 Soul ({installedSouls.length})</h2>
        {installedSouls.length === 0 ? <p className="skill-empty-text">아직 설치된 Soul이 없습니다.</p> : (
          <div className="skill-soul-list">
            {installedSouls.map(s => (
              <div key={s.id} className="skill-soul-item">
                <SoulAvatar name={s.name} imageUrl={s.avatar_url} size="sm" />
                <div className="skill-soul-info"><span>{s.name}</span><small>{s.role}</small></div>
                <button className="skill-remove-btn" onClick={() => removeSkill(s.id)}><X size={12} /> 제거</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Install to Soul */}
      {availableSouls.length > 0 && (
        <section className="skill-section">
          <h2><Plus size={14} /> Soul에 설치</h2>
          <div className="skill-soul-list">
            {availableSouls.map(s => (
              <div key={s.id} className="skill-soul-item">
                <SoulAvatar name={s.name} imageUrl={s.avatar_url} size="sm" />
                <div className="skill-soul-info"><span>{s.name}</span><small>{s.role}</small></div>
                <button className="skill-install-btn" disabled={installing === s.id}
                  onClick={() => installSkill(s.id)}>
                  {installing === s.id ? "설치 중..." : <><Download size={12} /> 설치</>}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      <div className="skill-tags">
        {skill.tags.map(t => <span key={t} className="skill-tag">{t}</span>)}
      </div>

      {toast && <div className="skill-toast">{toast}</div>}
    </div>
  );
}
