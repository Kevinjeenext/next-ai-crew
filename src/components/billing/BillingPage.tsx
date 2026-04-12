/**
 * BillingPage — /dashboard/billing
 * Ivy 03-pricing-token-ui spec implementation
 * P0: 현재 플랜 카드 + 토큰 게이지 + Soul 정원 도트
 * P1: Soul별 사용량 + 충전 CTA
 */
import { useState, useEffect } from "react";
import "./billing.css";

// ========== Types ==========
interface PlanInfo {
  name: string;
  soulLimit: number;
  monthlyTokens: number;
  renewDate: string;
  daysLeft: number;
}

interface SoulUsage {
  name: string;
  role: string;
  avatar: string;
  deptColor: string;
  tokens: number;
  percent: number;
}

// ========== Helpers ==========
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function getUsageLevel(pct: number): "normal" | "caution" | "warning" | "danger" | "exceeded" {
  if (pct > 100) return "exceeded";
  if (pct > 95) return "danger";
  if (pct > 85) return "warning";
  if (pct > 60) return "caution";
  return "normal";
}

function getStatusEmoji(level: string): string {
  switch (level) {
    case "normal": return "🟢 정상";
    case "caution": return "🟡 주의";
    case "warning": return "🟠 경고";
    case "danger": return "🔴 위험";
    case "exceeded": return "❌ 초과";
    default: return "🟢 정상";
  }
}

// ========== Mock data (replace with API) ==========
const MOCK_PLAN: PlanInfo = {
  name: "Team ⭐",
  soulLimit: 15,
  monthlyTokens: 2_000_000,
  renewDate: "2026-05-12",
  daysLeft: 30,
};

const MOCK_USED_TOKENS = 1_400_000;
const MOCK_HIRED_COUNT = 12;
const MOCK_LAST_ADDED_INDEX = 11; // 0-based

const MOCK_SOUL_USAGE: SoulUsage[] = [
  { name: "Aria", role: "Developer", avatar: "/icons/departments/icon-developer.svg", deptColor: "#2563EB", tokens: 588_000, percent: 42 },
  { name: "Kai", role: "DevOps", avatar: "/icons/departments/icon-devops.svg", deptColor: "#8B5CF6", tokens: 252_000, percent: 18 },
  { name: "Luna", role: "Designer", avatar: "/icons/departments/icon-designer.svg", deptColor: "#06B6D4", tokens: 140_000, percent: 10 },
];

// ========== Component ==========
export default function BillingPage() {
  const [plan] = useState<PlanInfo>(MOCK_PLAN);
  const [usedTokens] = useState(MOCK_USED_TOKENS);
  const [hiredCount] = useState(MOCK_HIRED_COUNT);
  const [soulUsage] = useState<SoulUsage[]>(MOCK_SOUL_USAGE);

  const usagePct = Math.round((usedTokens / plan.monthlyTokens) * 100);
  const usageLevel = getUsageLevel(usagePct);

  return (
    <div className="billing-page">
      {/* 현재 플랜 요약 */}
      <div className="billing-card">
        <h2>📋 현재 플랜</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--th-text-heading, #fff)" }}>
            {plan.name}
          </span>
          <button className="hire-btn" style={{ flex: "none", padding: "8px 16px", fontSize: 12 }}>
            업그레이드 →
          </button>
        </div>
        <div className="sub-text" style={{ marginBottom: 16 }}>
          결제일: {plan.renewDate} ({plan.daysLeft}일 남음)
        </div>

        {/* Soul 정원 도트 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "var(--th-text-muted)", width: 80 }}>
            👥 Soul 정원
          </span>
          <div className="soul-capacity-dots">
            {Array.from({ length: plan.soulLimit }, (_, i) => {
              let cls = "capacity-dot";
              if (i < hiredCount) cls += " filled";
              if (i === MOCK_LAST_ADDED_INDEX) cls += " last-added";
              return <div key={i} className={cls} />;
            })}
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "var(--th-text-body, #fff)" }}>
            {hiredCount} / {plan.soulLimit}명
          </span>
        </div>

        {/* 토큰 게이지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "var(--th-text-muted)", width: 80 }}>
            ⚡ 월 토큰
          </span>
          <div className="token-gauge" style={{ flex: 1 }}>
            <div
              className="token-bar-fill"
              data-usage={usageLevel}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "var(--th-text-body, #fff)", whiteSpace: "nowrap" }}>
            {usagePct}%
          </span>
        </div>
      </div>

      {/* 토큰 사용량 메인 */}
      <div className="billing-card">
        <h2>⚡ 이번 달 토큰 사용량</h2>
        <div className="token-number-big">
          {formatTokens(usedTokens)} <span className="muted">/ {formatTokens(plan.monthlyTokens)}</span>
        </div>
        <div className="token-gauge" role="progressbar" aria-valuenow={usagePct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="token-bar-fill"
            data-usage={usageLevel}
            style={{ width: `${Math.min(usagePct, 100)}%` }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="sub-text">리셋까지: {plan.daysLeft}일 후 ({plan.renewDate})</span>
          <span className={`token-status ${usageLevel}`}>{getStatusEmoji(usageLevel)}</span>
        </div>
      </div>

      {/* Soul별 토큰 소비 내역 */}
      <div className="billing-card">
        <h2>🤖 Soul별 사용량</h2>
        {soulUsage.map((soul) => (
          <div className="soul-usage-row" key={soul.name}>
            <img
              src={soul.avatar}
              alt={soul.name}
              width={24}
              height={24}
              style={{ imageRendering: "pixelated" as const }}
            />
            <div>
              <div className="soul-usage-bar-wrapper">
                <div
                  className="soul-usage-bar-fill"
                  style={{ width: `${soul.percent}%`, "--soul-dept-color": soul.deptColor } as React.CSSProperties}
                />
              </div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--th-text-body, #fff)" }}>
                {soul.name} ({soul.role})
              </span>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--th-text-muted)", whiteSpace: "nowrap" }}>
              {soul.percent}% · {formatTokens(soul.tokens)}
            </span>
          </div>
        ))}
      </div>

      {/* 충전 / 업그레이드 CTA */}
      <div className="billing-cta-grid">
        <div className="billing-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--th-text-heading, #fff)", marginBottom: 4 }}>
            토큰 충전
          </div>
          <div className="sub-text" style={{ marginBottom: 12 }}>+500K tokens · ₩9,900</div>
          <button className="soul-profile-btn" style={{ width: "100%" }}>충전하기</button>
        </div>
        <div className="billing-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⬆</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--th-text-heading, #fff)", marginBottom: 4 }}>
            플랜 업그레이드
          </div>
          <div className="sub-text" style={{ marginBottom: 12 }}>Business 플랜 · 10M 토큰 / 50 Souls</div>
          <button className="hire-btn" style={{ width: "100%", flex: "none" }}>업그레이드 →</button>
        </div>
      </div>
    </div>
  );
}
