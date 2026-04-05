/**
 * Pricing Page — 5-Tier Plan Cards
 * Kevin 의장 최종 확정 2026-04-05 (Hanbin PM 전달)
 * Tiers: Starter → Pro → Team (⭐추천) → Business → Enterprise
 * Currency: KRW (₩) + USD ($)
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Plan {
  name: string;
  icon: string;
  agents: number | null;
  subtitle: string;
  priceKrw: number | null;
  priceUsd: number | null;
  color: string;
  colorRgb: string;
  recommended: boolean;
  trialDays?: number;
  features: string[];
  cta: string;
  ctaStyle: "ghost" | "filled" | "gradient-ghost";
}

function fmtKrw(n: number): string {
  return n.toLocaleString("ko-KR");
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    icon: "/icons/ui/plan-starter.svg",
    agents: 1,
    subtitle: "AI 직원 1명으로 시작",
    priceKrw: 25000,
    priceUsd: 17,
    color: "#94A3B8",
    colorRgb: "148,163,184",
    recommended: false,
    trialDays: 7,
    features: [
      "AI 에이전트 1명",
      "기본 오피스 (1룸)",
      "7일 무료 체험",
      "일 50회 메시지",
      "커뮤니티 지원",
      "기본 캐릭터 스킨",
    ],
    cta: "Start Free Trial",
    ctaStyle: "ghost",
  },
  {
    name: "Pro",
    icon: "/icons/ui/plan-pro.svg",
    agents: 5,
    subtitle: "본격적인 AI 팀 빌딩",
    priceKrw: 39000,
    priceUsd: 29,
    color: "#2563EB",
    colorRgb: "37,99,235",
    recommended: false,
    features: [
      "AI 에이전트 5명",
      "확장 오피스 (5룸)",
      "일 500회 메시지",
      "이메일 지원",
      "커스텀 Soul 설정",
      "기본 워크플로우 자동화",
      "API 액세스",
    ],
    cta: "Get Pro",
    ctaStyle: "filled",
  },
  {
    name: "Team",
    icon: "/icons/ui/plan-team.svg",
    agents: 15,
    subtitle: "풀스케일 AI 오피스",
    priceKrw: 99000,
    priceUsd: 79,
    color: "#06B6D4",
    colorRgb: "6,182,212",
    recommended: true,
    features: [
      "AI 에이전트 15명",
      "풀 오피스 (15룸 + 회의실)",
      "무제한 메시지",
      "우선 지원",
      "고급 Soul 커스터마이징",
      "팀 협업 대시보드",
      "워크플로우 빌더",
      "멀티 AI 프로바이더",
    ],
    cta: "Start Team",
    ctaStyle: "filled",
  },
  {
    name: "Business",
    icon: "/icons/ui/plan-business.svg",
    agents: 50,
    subtitle: "대규모 AI 조직 운영",
    priceKrw: 249000,
    priceUsd: 199,
    color: "#6366F1",
    colorRgb: "99,102,241",
    recommended: false,
    features: [
      "AI 에이전트 50명",
      "멀티 오피스 (무제한 룸)",
      "무제한 메시지",
      "전담 지원",
      "어드민 콘솔",
      "SSO / 팀 관리",
      "고급 분석 대시보드",
      "프라이빗 모델 연결",
      "SLA 99.9%",
    ],
    cta: "Get Business",
    ctaStyle: "filled",
  },
  {
    name: "Enterprise",
    icon: "/icons/ui/plan-enterprise.svg",
    agents: null,
    subtitle: "무제한 AI 직원, 맞춤형 인프라",
    priceKrw: null,
    priceUsd: null,
    color: "#6366F1",
    colorRgb: "99,102,241",
    recommended: false,
    features: [
      "무제한 에이전트",
      "온프레미스 / 프라이빗 클라우드",
      "전용 인프라",
      "커스텀 AI 모델 학습",
      "화이트 라벨링",
      "전담 CSM",
      "맞춤 SLA",
      "보안 감사 리포트",
      "24/7 프리미엄 지원",
    ],
    cta: "Contact Sales",
    ctaStyle: "gradient-ghost",
  },
];

const FAQ = [
  { q: "플랜을 변경할 수 있나요?", a: "네, 언제든 업그레이드/다운그레이드 가능합니다. 차액은 일할 계산됩니다." },
  { q: "어떤 AI 모델을 지원하나요?", a: "Claude, GPT-5, Gemini, Codex, LLaMA 등 10+ 모델을 지원합니다. Pro 이상에서 모델 선택이 가능합니다." },
  { q: "데이터는 안전한가요?", a: "모든 데이터는 암호화 저장되며, SOC 2 Type II 인증을 준비 중입니다. Enterprise 플랜은 전용 인프라를 제공합니다." },
  { q: "무료 체험은 어떻게 작동하나요?", a: "Starter 플랜 가입 시 7일간 무료로 사용할 수 있습니다. 카드 등록 없이 시작하세요." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [showUsd, setShowUsd] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#0B1120", color: "#E2E8F0" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5"
        style={{ background: "rgba(11,17,32,0.9)", borderBottom: "1px solid rgba(37,99,235,0.1)" }}>
        <a href="/landing" className="flex items-center gap-2 no-underline">
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF" }}>
            Next AI Crew
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/landing" className="text-sm no-underline" style={{ color: "#94A3B8" }}>Home</a>
          <a href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium no-underline"
            style={{ background: "#2563EB", color: "#FFFFFF" }}>
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-16 pb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F8FAFC" }}>
          Build Your{" "}
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
            AI Team
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg" style={{ color: "#94A3B8" }}>
          AI 직원 수에 맞는 플랜을 선택하세요. 모든 플랜에 Soul 커스터마이징이 포함됩니다.
        </p>

        {/* Toggles row */}
        <div className="mb-12 flex items-center justify-center gap-8 flex-wrap">
          {/* Monthly/Annual */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: annual ? "#94A3B8" : "#E2E8F0" }}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className="relative h-7 w-12 rounded-full transition-colors"
              style={{ background: annual ? "#2563EB" : "#334155" }}>
              <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform duration-200"
                style={{ left: annual ? "calc(100% - 1.625rem)" : "0.125rem" }} />
            </button>
            <span className="text-sm" style={{ color: annual ? "#E2E8F0" : "#94A3B8" }}>
              Annual{" "}
              <span className="font-medium" style={{ color: "#10B981" }}>Save 20%</span>
            </span>
          </div>

          {/* KRW/USD */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: showUsd ? "#94A3B8" : "#E2E8F0" }}>₩ KRW</span>
            <button onClick={() => setShowUsd(!showUsd)}
              className="relative h-7 w-12 rounded-full transition-colors"
              style={{ background: showUsd ? "#2563EB" : "#334155" }}>
              <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform duration-200"
                style={{ left: showUsd ? "calc(100% - 1.625rem)" : "0.125rem" }} />
            </button>
            <span className="text-sm" style={{ color: showUsd ? "#E2E8F0" : "#94A3B8" }}>$ USD</span>
          </div>
        </div>
      </section>

      {/* ─── Plans Grid ─── */}
      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-20"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {PLANS.map((plan) => {
          const krw = plan.priceKrw !== null
            ? (annual ? Math.round(plan.priceKrw * 0.8) : plan.priceKrw) : null;
          const usd = plan.priceUsd !== null
            ? (annual ? Math.round(plan.priceUsd * 0.8) : plan.priceUsd) : null;

          return (
            <div key={plan.name}
              className="relative flex flex-col rounded-[20px] p-8 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: plan.recommended
                  ? "var(--th-card-bg, rgba(15,23,41,0.65))"
                  : "rgba(15,23,41,0.65)",
                border: plan.recommended ? "2px solid transparent" : "1px solid rgba(37,99,235,0.1)",
                ...(plan.recommended ? {
                  backgroundImage: "linear-gradient(rgba(15,23,41,0.65), rgba(15,23,41,0.65)), linear-gradient(135deg, #2563EB, #06B6D4, #6366F1)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                  transform: "scale(1.03)",
                  boxShadow: "0 0 30px rgba(6,182,212,0.12)",
                } : {}),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = plan.recommended
                  ? "0 0 30px rgba(6,182,212,0.12)" : "none";
              }}
            >
              {/* MOST POPULAR badge */}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-white whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    letterSpacing: 1,
                  }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Icon + Name */}
              <img src={plan.icon} alt="" className="w-10 h-10 mb-2" style={{ imageRendering: "pixelated" }} />
              <h3 className="text-lg font-bold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F1F5F9" }}>
                {plan.name}
              </h3>
              <p className="text-sm mb-1" style={{ color: "#94A3B8" }}>
                {plan.subtitle}
              </p>
              {plan.agents !== null && (
                <p className="text-xs mb-4" style={{ color: plan.color }}>
                  AI 직원 {plan.agents}명
                </p>
              )}
              {plan.agents === null && (
                <p className="text-xs mb-4" style={{ color: plan.color }}>무제한</p>
              )}

              {/* Price */}
              <div className="mb-6">
                {krw !== null && usd !== null ? (
                  <>
                    {plan.trialDays && (
                      <div className="mb-2">
                        <span className="inline-block rounded-full px-3 py-1 text-xs font-bold"
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            color: "#10B981",
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: 7,
                            letterSpacing: 0.5,
                          }}>
                          7 DAYS FREE
                        </span>
                      </div>
                    )}
                    {showUsd ? (
                      <>
                        <span className="text-[36px] font-bold"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F8FAFC" }}>
                          ${usd}
                        </span>
                        <span className="text-sm" style={{ color: "#94A3B8" }}>/mo</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[36px] font-bold"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F8FAFC" }}>
                          ₩{fmtKrw(krw)}
                        </span>
                        <span className="text-sm" style={{ color: "#94A3B8" }}>/월</span>
                      </>
                    )}
                    {plan.trialDays && (
                      <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                        7일 무료 체험 후
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-2xl font-bold" style={{ color: "#F8FAFC" }}>별도 문의</span>
                )}
              </div>

              {/* Features */}
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: "#CBD5E1" }}>
                    <img src="/icons/ui/icon-check.svg" alt="" className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ imageRendering: "pixelated" }} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => plan.priceKrw === null ? undefined : navigate("/login")}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  ...(plan.ctaStyle === "filled" ? {
                    background: plan.color,
                    color: "white",
                    border: "none",
                  } : plan.ctaStyle === "gradient-ghost" ? {
                    background: "transparent",
                    color: "#94A3B8",
                    border: "1.5px solid transparent",
                    backgroundImage: "linear-gradient(#0B1120, #0B1120), linear-gradient(135deg, #2563EB, #06B6D4, #6366F1)",
                    backgroundOrigin: "border-box",
                    backgroundClip: "padding-box, border-box",
                  } : {
                    background: "transparent",
                    color: plan.color,
                    border: `1.5px solid ${plan.color}`,
                  }),
                }}
                onMouseEnter={(e) => {
                  if (plan.ctaStyle === "filled") {
                    e.currentTarget.style.filter = "brightness(1.1)";
                    e.currentTarget.style.boxShadow = `0 4px 20px rgba(${plan.colorRgb},0.3)`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-8 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F8FAFC" }}>
          자주 묻는 질문
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden"
              style={{ background: "rgba(15,23,41,0.5)", border: "1px solid rgba(37,99,235,0.1)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium"
                style={{ color: "#F1F5F9" }}
              >
                {item.q}
                <span className="ml-4 text-lg" style={{ color: "#94A3B8" }}>
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm" style={{ color: "#94A3B8" }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <section className="px-8 pb-12 text-center">
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          모든 플랜은 언제든 업그레이드/다운그레이드 가능합니다. 연간 결제 시 20% 할인.
        </p>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: "1px solid rgba(37,99,235,0.1)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm" style={{ color: "#94A3B8" }}>
            © 2026 Next AI Crew. All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-sm" style={{ color: "#94A3B8" }}>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
