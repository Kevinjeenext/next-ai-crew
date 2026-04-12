/**
 * SoulHireCard — Ivy 디자인 시스템 CSS 클래스 기반
 * 13섹션 CSS (soul-hire.css) 사용
 */
import type { SoulTemplate } from "./SoulHirePage";
import "./soul-hire.css";

// Personality trait colors (Ivy spec)
const TRAIT_COLORS: Record<string, string> = {
  thoroughness: "#2563EB",
  creativity: "#06B6D4",
  speed: "#10B981",
  teamwork: "#6366F1",
};

const TRAIT_LABELS_KO: Record<string, string> = {
  thoroughness: "꼼꼼함",
  creativity: "창의성",
  speed: "속도",
  teamwork: "협업",
};

// Department colors
const DEPT_COLORS: Record<string, string> = {
  engineering: "#2563EB",
  design: "#06B6D4",
  planning: "#6366F1",
  marketing: "#F59E0B",
  qa: "#10B981",
  security: "#EF4444",
  devops: "#8B5CF6",
  operations: "#64748B",
};

// Level tier mapping
function getLevelTier(level: number): string {
  if (level >= 46) return "legend";
  if (level >= 40) return "lead";
  if (level >= 35) return "senior";
  if (level >= 25) return "mid";
  if (level >= 15) return "junior";
  return "rookie";
}

interface Props {
  soul: SoulTemplate;
  hired?: boolean;
  onHire: (soul: SoulTemplate) => void;
  language?: "en" | "ko";
}

export default function SoulHireCard({ soul, hired = false, onHire, language = "ko" }: Props) {
  const name = language === "ko" ? soul.name_ko || soul.name : soul.name;
  const roleTitle = language === "ko" ? soul.role_title_ko || soul.role_title : soul.role_title;
  const quote = language === "ko" ? soul.personality_text_ko || soul.personality_text : soul.personality_text;
  const deptColor = DEPT_COLORS[soul.department] || "#2563EB";
  const levelTier = getLevelTier(soul.level);

  const cardClass = [
    "soul-hire-card",
    hired && "hired",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={cardClass}
      data-level-tier={levelTier}
      style={{ "--soul-dept-color": deptColor } as React.CSSProperties}
      onClick={() => !hired && onHire(soul)}
    >
      {/* Hired badge */}
      {hired && <span className="soul-hired-badge">✓ 채용됨</span>}

      {/* Header: Avatar + Name + Role + Level */}
      <div className="soul-card-header">
        <div className="soul-avatar-wrapper">
          <img src={soul.avatar} alt={name} className="soul-avatar" />
          <div className={`soul-status ${hired ? "working" : "online"}`} />
        </div>
        <div className="soul-card-info">
          <div className="soul-name">{name}</div>
          <div className="soul-role">{roleTitle}</div>
          <div className="soul-level">
            ⭐ Lv.<span className="lv-number">{soul.level}</span>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="soul-quote">{quote}</div>

      {/* Personality dot bars */}
      <div className="soul-personality">
        {(["thoroughness", "creativity", "speed", "teamwork"] as const).map((trait) => (
          <div className="personality-row" key={trait}>
            <span className="personality-label">{TRAIT_LABELS_KO[trait]}</span>
            <div className="personality-bar">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`personality-dot${i < soul.personality[trait] ? " filled" : ""}`}
                  style={i < soul.personality[trait] ? { "--dot-color": TRAIT_COLORS[trait] } as React.CSSProperties : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="soul-skills">
        {soul.skills.slice(0, 5).map((skill) => (
          <span key={skill} className="soul-skill-tag">{skill}</span>
        ))}
      </div>

      {/* Stats */}
      {soul.monthlyStats && (
        <div className="soul-stats">
          <span className="soul-stat-item">⚡ <strong>{soul.monthlyStats.tasksCompleted}</strong> tasks</span>
          <span className="soul-stat-item">📝 <strong>{soul.monthlyStats.prsReviewed}</strong> reviews</span>
        </div>
      )}

      {/* Actions */}
      <div className="soul-card-actions">
        <button className="soul-profile-btn" onClick={(e) => e.stopPropagation()}>
          프로필
        </button>
        <button
          className={`hire-btn${hired ? " already-hired" : ""}`}
          disabled={hired}
          onClick={(e) => {
            e.stopPropagation();
            if (!hired) onHire(soul);
          }}
        >
          {hired ? "✓ 채용됨" : "✦ 채용하기"}
        </button>
      </div>
    </div>
  );
}
