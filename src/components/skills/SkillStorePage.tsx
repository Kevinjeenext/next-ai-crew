/**
 * SkillStorePage — /skills
 * 스킬 스토어: 카드 그리드 + 검색 + 카테고리 필터
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, Tag } from "lucide-react";
import { SKILL_PRESETS, SKILL_CATEGORIES } from "./skill-presets";
import "./skills.css";

export default function SkillStorePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return SKILL_PRESETS.filter(s => {
      if (category !== "all" && s.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
               s.description.toLowerCase().includes(q) ||
               s.tags.some(t => t.includes(q));
      }
      return true;
    });
  }, [search, category]);

  return (
    <div className="skill-store-page">
      <div className="skill-store-header">
        <h1>🧩 스킬 스토어</h1>
        <p>Soul에게 새로운 능력을 장착하세요</p>
      </div>

      {/* Search + Filter */}
      <div className="skill-filter-bar">
        <div className="skill-search">
          <Search size={16} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="스킬 검색..."
          />
        </div>
        <div className="skill-categories">
          {SKILL_CATEGORIES.map(c => (
            <button key={c.id}
              className={`skill-cat-btn ${category === c.id ? "active" : ""}`}
              onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="skill-grid">
        {filtered.map(skill => (
          <div key={skill.id} className="skill-card" onClick={() => navigate(`/skills/${skill.id}`)}>
            <div className="skill-card-icon">{skill.icon}</div>
            <div className="skill-card-body">
              <div className="skill-card-top">
                <h3>{skill.name}</h3>
                <span className="skill-card-version">v{skill.version}</span>
              </div>
              <p className="skill-card-desc">{skill.description}</p>
              <div className="skill-card-footer">
                <span className="skill-card-cat">
                  <Tag size={10} /> {SKILL_CATEGORIES.find(c => c.id === skill.category)?.label}
                </span>
                <span className="skill-card-dl">
                  <Download size={10} /> {skill.downloads.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="skill-empty">검색 결과가 없습니다.</div>
      )}
    </div>
  );
}
