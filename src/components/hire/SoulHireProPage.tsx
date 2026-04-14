/**
 * SoulHireProPage — Pro UI Soul 채용 카탈로그
 * Ivy 02-soul-hire-pro.md spec
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SoulAvatar from "../ui/SoulAvatar";
import { apiFetch } from "../../lib/api-fetch";
import "./soul-hire-pro.css";

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
}

const CATEGORY_LABELS: Record<string, string> = {
  engineering: "개발",
  design: "디자인",
  marketing: "마케팅",
  cs: "고객 서비스",
  data: "데이터",
  finance: "재무",
  hr: "인사",
  legal: "법무",
  research: "리서치",
  general: "일반",
};

export default function SoulHireProPage() {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [hiringId, setHiringId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/soul-presets")
      .then((r) => r.json())
      .then((d) => { setPresets(d.presets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    presets.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [presets]);

  const filtered = useMemo(() => {
    return presets.filter((p) => {
      if (selectedCategories.size > 0 && !selectedCategories.has(p.category)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.display_name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.skill_tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [presets, selectedCategories, searchQuery]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleHire = async (preset: Preset) => {
    setHiringId(preset.id);
    try {
      const res = await apiFetch("/api/souls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset_id: preset.id }),
      });
      if (res.ok) {
        navigate("/");
      } else {
        const data = await res.json();
        alert(data.error || "채용 실패");
      }
    } catch {
      alert("네트워크 오류");
    } finally {
      setHiringId(null);
    }
  };

  return (
    <div className="hire-pro-page">
      {/* Header */}
      <div className="hire-pro-header">
        <div>
          <h1 className="hire-pro-title">Soul 채용</h1>
          <p className="hire-pro-subtitle">AI Soul을 채용하여 팀을 구성하세요</p>
        </div>
        <div className="hire-pro-search">
          <input
            type="text"
            className="input"
            placeholder="이름, 역할, 스킬로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="hire-pro-body">
        {/* Filter sidebar */}
        <aside className="hire-filter-sidebar">
          <div className="filter-section-title">역할</div>
          {categories.map(([cat, count]) => (
            <label key={cat} className="filter-checkbox-row">
              <input
                type="checkbox"
                checked={selectedCategories.has(cat)}
                onChange={() => toggleCategory(cat)}
              />
              <span className="filter-checkbox-label">{CATEGORY_LABELS[cat] || cat}</span>
              <span className="filter-count">{count}</span>
            </label>
          ))}
        </aside>

        {/* Card grid */}
        <div className="hire-card-grid">
          {loading ? (
            <div className="dashboard-loading"><div className="sidebar-loading-dot" /></div>
          ) : filtered.length === 0 ? (
            <div className="hire-empty">
              <p>조건에 맞는 Soul이 없습니다</p>
            </div>
          ) : (
            filtered.map((preset) => (
              <div key={preset.id} className="hire-card-pro">
                <div className="hire-card-head">
                  <SoulAvatar name={preset.name} size="lg" department={preset.category} />
                  <div className="hire-card-meta">
                    <div className="hire-card-name">{preset.display_name}</div>
                    <div className="hire-card-role">{preset.name}</div>
                    <div className="hire-card-dept">{CATEGORY_LABELS[preset.category] || preset.category}</div>
                  </div>
                </div>

                {preset.skill_tags?.length > 0 && (
                  <div className="hire-skills">
                    {preset.skill_tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="hire-skill">{tag}</span>
                    ))}
                  </div>
                )}

                {preset.description && (
                  <div className="hire-quote">"{preset.description}"</div>
                )}

                <div className="hire-actions">
                  <button
                    className="hire-btn-primary"
                    onClick={() => handleHire(preset)}
                    disabled={hiringId === preset.id}
                  >
                    {hiringId === preset.id ? "채용 중..." : "채용하기"}
                  </button>
                  <button className="hire-btn-ghost">프로필 →</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
