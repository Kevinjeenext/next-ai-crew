/**
 * OfficeMinimap — Ivy 05-office-placement spec
 * 부서별 Soul 자리 그리드 + 신규 배치 하이라이트
 */
import { useState } from "react";
import "./office-minimap.css";

// ========== Types ==========
export interface OfficeSoul {
  id: string;
  name: string;
  name_ko: string;
  avatar: string;
  role: string;
}

export interface OfficeSeat {
  id: string;
  soul: OfficeSoul | null;
  isNew?: boolean;
}

export interface OfficeSection {
  department: string;
  label: string;
  color: string;
  seats: OfficeSeat[];
}

interface Props {
  sections: OfficeSection[];
  newSoulId?: string;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  onSeatClick?: (soul: OfficeSoul) => void;
}

// ========== DEPT CONFIGS ==========
const DEPT_CONFIG: Record<string, { label: string; color: string; seatCount: number }> = {
  engineering: { label: "개발팀", color: "#2563EB", seatCount: 5 },
  design:      { label: "디자인팀", color: "#06B6D4", seatCount: 3 },
  planning:    { label: "기획팀", color: "#6366F1", seatCount: 3 },
  marketing:   { label: "마케팅팀", color: "#F59E0B", seatCount: 3 },
  qa:          { label: "QA팀", color: "#10B981", seatCount: 3 },
  security:    { label: "보안팀", color: "#EF4444", seatCount: 2 },
  devops:      { label: "DevOps팀", color: "#8B5CF6", seatCount: 3 },
  operations:  { label: "운영팀", color: "#64748B", seatCount: 3 },
};

/** Generate default empty sections */
export function createDefaultSections(): OfficeSection[] {
  return Object.entries(DEPT_CONFIG).map(([dept, cfg]) => ({
    department: dept,
    label: cfg.label,
    color: cfg.color,
    seats: Array.from({ length: cfg.seatCount }, (_, i) => ({
      id: `${dept}-${i}`,
      soul: null,
    })),
  }));
}

/** Place a soul into the correct department section */
export function placeSoul(
  sections: OfficeSection[],
  soul: OfficeSoul,
  department: string,
): OfficeSection[] {
  return sections.map((section) => {
    if (section.department !== department) return section;
    const seats = [...section.seats];
    const emptyIdx = seats.findIndex((s) => s.soul === null);
    if (emptyIdx >= 0) {
      seats[emptyIdx] = { ...seats[emptyIdx], soul, isNew: true };
    } else {
      // Overflow — add extra seat
      seats.push({ id: `${department}-${seats.length}`, soul, isNew: true });
    }
    return { ...section, seats };
  });
}

// ========== Component ==========
export default function OfficeMinimap({
  sections,
  newSoulId,
  size = "medium",
  interactive = true,
  onSeatClick,
}: Props) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Only show sections that have at least one occupied seat or are defaults
  const visibleSections = sections.filter(
    (s) => s.seats.some((seat) => seat.soul !== null) || s.seats.length > 0
  );

  return (
    <div className={`office-minimap size-${size}`}>
      {visibleSections.map((section) => {
        const occupied = section.seats.filter((s) => s.soul).length;
        return (
          <div className="office-section" key={section.department}>
            <div className="office-section-header">
              <div className="office-section-dot" style={{ background: section.color }} />
              <span>{section.label} ({occupied}/{section.seats.length})</span>
            </div>
            <div className="office-seats">
              {section.seats.map((seat) => {
                const isNew = seat.isNew || seat.soul?.id === newSoulId;
                if (!seat.soul) {
                  return (
                    <div key={seat.id} className="office-seat empty" />
                  );
                }
                return (
                  <div
                    key={seat.id}
                    className={`office-seat${isNew ? " is-new" : ""}`}
                    onClick={() => interactive && onSeatClick?.(seat.soul!)}
                    onMouseEnter={() => setHoveredSeat(seat.id)}
                    onMouseLeave={() => setHoveredSeat(null)}
                  >
                    <img src={seat.soul.avatar} alt={seat.soul.name_ko} />
                    {isNew && <span className="new-badge">★NEW</span>}
                    {hoveredSeat === seat.id && (
                      <div className="office-seat-tooltip">
                        {seat.soul.name_ko} · {seat.soul.role}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
