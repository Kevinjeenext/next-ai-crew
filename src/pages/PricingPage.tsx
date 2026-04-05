import { useState } from "react";

const plans = [
  {
    name: "Free",
    agents: 1,
    price: 0,
    priceAfterTrial: 20,
    trialDays: 7,
    highlight: false,
    features: [
      "AI 직원 1명",
      "기본 부서 (Engineering)",
      "7일 무료 체험",
      "이메일 지원",
    ],
  },
  {
    name: "Starter",
    agents: 3,
    price: 40,
    priceAfterTrial: null,
    trialDays: null,
    highlight: false,
    features: [
      "AI 직원 3명",
      "5개 부서",
      "팀 협업 대시보드",
      "이메일 + 채팅 지원",
      "기본 분석 리포트",
    ],
  },
  {
    name: "Pro",
    agents: 5,
    price: 60,
    priceAfterTrial: null,
    trialDays: null,
    highlight: true,
    features: [
      "AI 직원 5명",
      "모든 부서 접근",
      "Soul 커스터마이징",
      "고급 분석 + 인사이트",
      "우선 지원",
      "API 접근",
    ],
  },
  {
    name: "Max",
    agents: 10,
    price: 100,
    priceAfterTrial: null,
    trialDays: null,
    highlight: false,
    features: [
      "AI 직원 10명",
      "모든 부서 + 커스텀 부서",
      "전체 Soul 커스터마이징",
      "팀 관리 + 권한 설정",
      "전용 매니저 지원",
      "API + Webhook",
      "화이트라벨 옵션",
    ],
  },
  {
    name: "Enterprise",
    agents: null,
    price: null,
    priceAfterTrial: null,
    trialDays: null,
    highlight: false,
    features: [
      "AI 직원 무제한",
      "전용 인프라",
      "커스텀 AI 모델 연동",
      "SLA 보장",
      "온프레미스 배포 옵션",
      "전담 엔지니어 배정",
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--th-bg-primary)",
        color: "var(--th-text-primary)",
        fontFamily: "var(--th-font-body)",
      }}
    >
      {/* Header */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ background: "var(--th-bg-header)" }}>
        <a href="/landing" className="flex items-center gap-2 no-underline">
          <img src="/logo.svg" alt="Next AI Crew" className="h-8 w-8" />
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--th-font-display)", color: "var(--th-text-heading)" }}
          >
            Next AI Crew
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/landing" className="text-sm no-underline" style={{ color: "var(--th-text-secondary)" }}>
            Home
          </a>
          <a
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white no-underline"
            style={{ background: "var(--color-crew-blue)" }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-16 pb-12 text-center">
        <h1
          className="mb-4 text-4xl font-bold md:text-5xl"
          style={{ fontFamily: "var(--th-font-display)", color: "var(--th-text-heading)" }}
        >
          Build Your <span className="soul-text">AI Team</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg" style={{ color: "var(--th-text-secondary)" }}>
          AI 직원 수에 맞는 플랜을 선택하세요. 모든 플랜에 Soul 커스터마이징이 포함됩니다.
        </p>

        {/* Annual toggle */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <span className="text-sm" style={{ color: annual ? "var(--th-text-muted)" : "var(--th-text-primary)" }}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ background: annual ? "var(--color-crew-blue)" : "var(--th-border-strong)" }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform"
              style={{ left: annual ? "calc(100% - 1.625rem)" : "0.125rem" }}
            />
          </button>
          <span className="text-sm" style={{ color: annual ? "var(--th-text-primary)" : "var(--th-text-muted)" }}>
            Annual <span className="font-medium" style={{ color: "var(--color-crew-emerald)" }}>(-20%)</span>
          </span>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="mx-auto grid max-w-7xl gap-6 px-8 pb-20 md:grid-cols-3 lg:grid-cols-5">
        {plans.map((plan) => {
          const monthlyPrice = plan.price !== null ? (annual ? Math.round(plan.price * 0.8) : plan.price) : null;

          return (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl p-6 transition-transform hover:scale-[1.02]"
              style={{
                background: plan.highlight
                  ? "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.15))"
                  : "var(--th-card-bg)",
                border: plan.highlight
                  ? "2px solid var(--color-crew-blue)"
                  : "1px solid var(--th-card-border)",
              }}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: "var(--color-crew-blue)" }}
                >
                  MOST POPULAR
                </div>
              )}

              <h3
                className="mb-1 text-lg font-bold"
                style={{ fontFamily: "var(--th-font-display)", color: "var(--th-text-heading)" }}
              >
                {plan.name}
              </h3>

              <p className="mb-4 text-sm" style={{ color: "var(--th-text-muted)" }}>
                {plan.agents !== null ? `AI 직원 ${plan.agents}명` : "무제한"}
              </p>

              <div className="mb-6">
                {monthlyPrice !== null ? (
                  <>
                    <span
                      className="text-3xl font-bold"
                      style={{ fontFamily: "var(--th-font-display)", color: "var(--th-text-heading)" }}
                    >
                      ${monthlyPrice}
                    </span>
                    <span className="text-sm" style={{ color: "var(--th-text-muted)" }}>
                      /mo
                    </span>
                    {plan.trialDays && (
                      <p className="mt-1 text-xs" style={{ color: "var(--color-crew-cyan)" }}>
                        {plan.trialDays}일 무료 체험 → ${plan.priceAfterTrial}/mo
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-2xl font-bold" style={{ color: "var(--th-text-heading)" }}>
                    Contact Us
                  </span>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: "var(--th-text-secondary)" }}>
                    <span style={{ color: "var(--color-crew-emerald)" }}>✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                className="w-full rounded-lg py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: plan.highlight ? "var(--color-crew-blue)" : "transparent",
                  color: plan.highlight ? "white" : "var(--color-crew-blue)",
                  border: plan.highlight ? "none" : "1px solid var(--color-crew-blue)",
                }}
              >
                {plan.price === null ? "Contact Sales" : plan.trialDays ? "Start Free Trial" : "Get Started"}
              </button>
            </div>
          );
        })}
      </section>

      {/* FAQ teaser */}
      <section className="px-8 pb-16 text-center">
        <p className="text-sm" style={{ color: "var(--th-text-muted)" }}>
          모든 플랜은 언제든 업그레이드/다운그레이드 가능합니다. 연간 결제 시 20% 할인.
        </p>
      </section>
    </div>
  );
}
