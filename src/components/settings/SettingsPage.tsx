/**
 * SettingsPage — Pro UI (Ivy 04-settings-billing.md)
 * Tab navigation + Billing content
 */
import { useState } from "react";
import SoulAvatar from "../ui/SoulAvatar";
import "./settings.css";

const TABS = [
  { id: "general",  icon: "⚙", label: "일반" },
  { id: "team",     icon: "👥", label: "내 팀 (Soul)" },
  { id: "billing",  icon: "💳", label: "빌링" },
  { id: "security", icon: "🔒", label: "보안" },
  { id: "alerts",   icon: "🔔", label: "알림" },
];

const TOKEN_PACKS = [
  { amount: "+500K",  price: "₩9,900" },
  { amount: "+2M",    price: "₩29,000" },
  { amount: "+10M",   price: "₩99,000" },
];

const MOCK_USAGE = [
  { name: "Aria", role: "Developer", dept: "engineering", pct: 42, tokens: "588K" },
  { name: "Kai",  role: "DevOps",    dept: "devops",      pct: 18, tokens: "252K" },
  { name: "Luna", role: "Designer",  dept: "design",      pct: 10, tokens: "140K" },
];

export default function SettingsPage({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [tab, setTab] = useState("billing");

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back" onClick={() => onNavigate?.("/")}>← 대시보드</button>
        <h1 className="settings-title">설정</h1>
      </div>

      <div className="settings-layout">
        {/* Nav */}
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="settings-content">
          {tab === "billing" && <BillingTab />}
          {tab === "general" && <PlaceholderTab title="일반 설정" desc="조직 정보, 언어, 테마 설정이 여기에 표시됩니다." />}
          {tab === "team" && <PlaceholderTab title="내 팀 (Soul)" desc="채용된 Soul 목록, 역할 변경, 해고 기능이 여기에 표시됩니다." />}
          {tab === "security" && <PlaceholderTab title="보안" desc="API 키 관리, 2FA, 접근 로그가 여기에 표시됩니다." />}
          {tab === "alerts" && <PlaceholderTab title="알림" desc="토큰 소진 알림, 업무 완료 알림 설정이 여기에 표시됩니다." />}
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  const usedPct = 70;
  const usageLevel = usedPct >= 90 ? "danger" : usedPct >= 70 ? "caution" : "normal";

  return (
    <>
      <h2 className="settings-section-title">빌링</h2>

      {/* Plan card */}
      <div className="billing-plan-card">
        <div className="billing-plan-head">
          <span className="billing-plan-name">Team</span>
          <button className="btn-secondary">플랜 변경 →</button>
        </div>
        <div className="billing-plan-meta">₩99,000 / 월 · 결제일 2026-05-12 (30일 남음)</div>
        <div className="billing-capacity-bar">
          <div className="billing-capacity-label">
            <span>Soul 정원</span>
            <span>3 / 15명</span>
          </div>
          <div className="billing-bar-track">
            <div className="billing-bar-fill" style={{ width: "20%" }} />
          </div>
        </div>
      </div>

      {/* Token usage */}
      <div className="billing-plan-card">
        <div className="billing-plan-head">
          <span className="billing-plan-name" style={{ fontSize: 16 }}>토큰 사용량</span>
          <button className="btn-primary">+ 토큰 충전</button>
        </div>
        <div className="billing-plan-meta">이번 달 · 리셋: 30일 후</div>
        <div className="billing-capacity-bar">
          <div className="billing-capacity-label">
            <span>1,400,000 / 2,000,000</span>
            <span>{usedPct}%</span>
          </div>
          <div className="billing-bar-track">
            <div
              className="billing-bar-fill"
              data-usage={usageLevel}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Soul usage */}
      <div className="billing-plan-card">
        <div className="billing-plan-head">
          <span className="billing-plan-name" style={{ fontSize: 16 }}>Soul별 사용량</span>
          <button className="btn-secondary">전체 보기 →</button>
        </div>
        <div className="soul-usage-table">
          {MOCK_USAGE.map((s) => (
            <div key={s.name} className="soul-usage-row">
              <SoulAvatar name={s.name} size="sm" department={s.dept} />
              <div className="soul-usage-info">
                <div className="soul-usage-name">{s.name}</div>
                <div className="soul-usage-role">{s.role}</div>
              </div>
              <div className="soul-usage-bar-wrap">
                <div className="soul-usage-bar-track">
                  <div className="soul-usage-bar-fill" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
              <div className="soul-usage-stat">{s.pct}% · {s.tokens}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Token packs */}
      <h3 style={{ font: "600 14px var(--font-ui)", color: "var(--text-secondary)", marginBottom: 12 }}>충전 패키지</h3>
      <div className="token-packs">
        {TOKEN_PACKS.map((p) => (
          <div key={p.amount} className="token-pack">
            <div className="token-pack-amount">{p.amount}</div>
            <div className="token-pack-price">{p.price}</div>
            <button className="token-pack-btn">충전</button>
          </div>
        ))}
      </div>
    </>
  );
}

function PlaceholderTab({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <h2 className="settings-section-title">{title}</h2>
      <div style={{ color: "var(--text-tertiary)", font: "400 14px var(--font-ui)" }}>{desc}</div>
    </>
  );
}
