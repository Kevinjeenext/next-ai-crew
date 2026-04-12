/**
 * Landing Page — Ivy 13-landing-redesign.md
 * 5-section: Hero + Feature + Soul Showcase + Pricing + CTA/Footer
 * Neon Dark + Glassmorphism + AI Avatar Photos
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";

// Soul data for showcase
const SOULS = [
  { id: "alex-developer", name: "Alex", role: "Full-Stack Developer", img: "/avatars/souls/soul_01_alex.webp", greeting: "안녕하세요! 개발자 Alex입니다. 코드 리뷰, 디버깅, 새 기능 구현 어떤 것이든 도와드릴게요. 🚀", skills: ["React", "TypeScript", "Node.js", "PostgreSQL"] },
  { id: "maya-designer", name: "Maya", role: "UI/UX Designer", img: "/avatars/souls/soul_02_sophia.webp", greeting: "디자인은 사용자의 마음을 읽는 일이에요. 와이어프레임부터 프로토타입까지 함께해요! 🎨", skills: ["Figma", "Tailwind", "Accessibility", "Motion"] },
  { id: "marcus", name: "Marcus", role: "Security Engineer", img: "/avatars/souls/soul_03_marcus.webp", greeting: "보안은 사후 대응이 아니라 설계 단계부터 시작됩니다. 취약점 분석, 코드 감사 맡겨주세요. 🔒", skills: ["Penetration Testing", "OWASP", "SOC 2", "Encryption"] },
  { id: "yuna-writer", name: "Yuna", role: "Content Writer & PM", img: "/avatars/souls/soul_04_yuna.webp", greeting: "글 한 줄이 브랜드의 첫인상이에요. 콘텐츠 전략부터 실행까지 도울게요! ✍️", skills: ["Copywriting", "SEO", "Analytics", "Notion"] },
  { id: "liam", name: "Liam", role: "DevOps Engineer", img: "/avatars/souls/soul_05_liam.webp", greeting: "배포 자동화, 인프라 관리, 모니터링까지. 안정적인 시스템을 만들어드립니다. ⚙️", skills: ["Docker", "K8s", "CI/CD", "AWS"] },
  { id: "priya", name: "Priya", role: "Data Analyst", img: "/avatars/souls/soul_06_priya.webp", greeting: "데이터에서 인사이트를 찾아드려요. 대시보드 설계부터 분석까지! 📊", skills: ["Python", "SQL", "Tableau", "Statistics"] },
  { id: "carlos", name: "Carlos", role: "Backend Engineer", img: "/avatars/souls/soul_07_carlos.webp", greeting: "확장 가능한 API 설계가 전문입니다. 마이크로서비스 아키텍처 상담하세요! 🏗️", skills: ["Go", "gRPC", "Redis", "PostgreSQL"] },
  { id: "emma", name: "Emma", role: "Customer Success", img: "/avatars/souls/soul_08_emma.webp", greeting: "고객의 목소리가 가장 중요해요. CS부터 온보딩 가이드까지 함께합니다. 💬", skills: ["Zendesk", "Intercom", "CRM", "Onboarding"] },
  { id: "jin", name: "Jin", role: "ML Engineer", img: "/avatars/souls/soul_09_jin.webp", greeting: "모델 학습부터 배포까지, AI/ML 파이프라인을 구축해드립니다. 🤖", skills: ["PyTorch", "MLOps", "NLP", "LLM"] },
  { id: "amara", name: "Amara", role: "Growth Marketer", img: "/avatars/souls/soul_10_amara.webp", greeting: "데이터 기반 마케팅으로 성장을 이끌어요. 퍼포먼스부터 브랜딩까지! 📈", skills: ["Google Ads", "SEO", "A/B Test", "Funnel"] },
];

const FEATURES = [
  { icon: "🧠", color: "blue", title: "Soul Identity", desc: "Each AI has a name, personality, and expertise.", ko: "이름, 성격, 전문성을 가진 나만의 AI 동료" },
  { icon: "🤝", color: "cyan", title: "Always Available", desc: "Your crew works 24/7. No sick days, no overtime complaints.", ko: "아픈 날도, 야근 불만도 없는 24/7 팀원" },
  { icon: "⚡", color: "green", title: "10x Faster", desc: "Parallel AI agents complete tasks in minutes, not days.", ko: "병렬 AI 에이전트로 몇 분 안에 완료" },
];

const PLANS = [
  { name: "Starter", price: "Free", period: "", souls: "2 Souls", tokens: "50K tokens/mo", features: ["Basic AI models", "Community support", "1 workspace"] },
  { name: "Pro", price: "$19", period: "/mo", souls: "10 Souls", tokens: "500K tokens/mo", features: ["GPT-4o & Claude", "Priority support", "5 workspaces", "Custom prompts"] },
  { name: "Team", price: "$49", period: "/mo", souls: "25 Souls", tokens: "2M tokens/mo", features: ["All Pro features", "Team collaboration", "Analytics dashboard", "API access"], popular: true },
  { name: "Business", price: "$99", period: "/mo", souls: "Unlimited", tokens: "10M tokens/mo", features: ["All Team features", "SSO & SAML", "Dedicated support", "Custom integrations", "SLA guarantee"] },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedSoul, setSelectedSoul] = useState(0);
  const soul = SOULS[selectedSoul];

  return (
    <div className="landing-page" data-theme="dark">
      {/* HEADER NAV */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <a href="/" className="landing-nav-logo">
            <img src="/logo.svg" alt="Next AI Crew" style={{ height: 32 }} />
          </a>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#pricing" className="landing-nav-link">Pricing</a>
            <a href="#showcase" className="landing-nav-link">Souls</a>
          </div>
          <div className="landing-nav-actions">
            <button className="btn-ghost" onClick={() => navigate("/login")}>Log in</button>
            <button className="btn-primary" onClick={() => navigate("/login")}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* 01. HERO */}
      <section className="hero-section">
        <div className="hero-left">
          <div className="hero-badge">✦ AI Agent Platform</div>
          <h1 className="hero-title">
            Hire AI Colleagues.<br />
            <span className="cyan">Not Tools.</span>
          </h1>
          <p className="hero-sub-ko">당신의 AI 팀원을 채용하세요.</p>
          <p className="hero-sub-en">
            Build your AI crew with real names, personalities, and expertise.
            Each Soul works like a real colleague — available 24/7.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary-lg" onClick={() => navigate("/login")}>Get Started Free →</button>
            <button className="btn-ghost-lg">Watch Demo ▶</button>
          </div>
          <div className="hero-trust">
            <span>⚡ 500+ Teams</span>
            <span>🌐 30+ Countries</span>
            <span>⭐ 4.9/5.0</span>
            <span>🔒 SOC 2 Ready</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-soul-preview">
            <h3>Your AI Team</h3>
            {SOULS.slice(0, 3).map((s, i) => (
              <div className="hero-soul-item" key={s.id}>
                <img src={s.img} alt={s.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", objectPosition: "center top" }} />
                <div className="hero-soul-status" style={i === 1 ? { background: "var(--text-tertiary)", boxShadow: "none" } : {}} />
                <div className="hero-soul-info">
                  <div className="hero-soul-name">{s.name}</div>
                  <div className="hero-soul-role">{s.role}</div>
                </div>
              </div>
            ))}
            <div className="hero-soul-more">+17 more Souls ›</div>
            <button className="hero-preview-cta" onClick={() => navigate("/login")}>
              Hire Your First Soul →
            </button>
          </div>
        </div>
      </section>

      {/* 02. FEATURES */}
      <section className="feature-section" id="features">
        <div className="section-header">
          <h2 className="section-title">Why teams choose Next AI Crew</h2>
          <p className="section-sub-ko">당신의 팀이 Next AI Crew를 선택하는 이유</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <div className="feature-title-text">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
              <div className="feature-desc-ko">{f.ko}</div>
              <div className="card-bottom-bar" />
            </div>
          ))}
        </div>
      </section>

      {/* 03. SOUL SHOWCASE */}
      <section className="showcase-section" id="showcase">
        <div className="section-header">
          <h2 className="section-title">Meet Your AI Crew</h2>
          <p className="section-sub-ko">AI 동료들을 만나보세요 — 20명의 AI 전문가</p>
        </div>
        <div className="showcase-avatars">
          {SOULS.map((s, i) => (
            <img
              key={s.id}
              src={s.img}
              alt={s.name}
              className={`showcase-avatar${i === selectedSoul ? " active" : ""}`}
              onClick={() => setSelectedSoul(i)}
            />
          ))}
        </div>
        <div className="showcase-detail-card" key={soul.id}>
          <img src={soul.img} alt={soul.name} className="showcase-photo" />
          <div className="showcase-info">
            <div className="showcase-name">{soul.name}</div>
            <div className="showcase-role-text">{soul.role}</div>
            <div className="showcase-greeting">"{soul.greeting}"</div>
            <div className="showcase-skills">
              {soul.skills.map((sk) => (
                <span className="showcase-skill-tag" key={sk}>{sk}</span>
              ))}
            </div>
            <button className="showcase-hire-btn" onClick={() => navigate("/login")}>
              Hire {soul.name} →
            </button>
          </div>
        </div>
        <div className="showcase-browse">
          <a href="/hire" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Browse All 20 Souls →</a>
        </div>
      </section>

      {/* 04. PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-sub-ko">투명한 요금제</p>
        </div>
        <div className="pricing-grid">
          {PLANS.map((p) => (
            <div className={`pricing-card${p.popular ? " popular" : ""}`} key={p.name}>
              <div className="pricing-plan-name">{p.name}</div>
              <div className="pricing-price">{p.price}<span>{p.period}</span></div>
              <div style={{ font: "400 13px var(--font-ui)", color: "var(--text-tertiary)", marginBottom: 4 }}>{p.souls} · {p.tokens}</div>
              <ul className="pricing-features">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button className="pricing-cta" onClick={() => navigate("/login")}>Get Started →</button>
            </div>
          ))}
        </div>
      </section>

      {/* 05. CTA + FOOTER */}
      <section className="cta-section">
        <h2 className="cta-title">Start building your AI crew today.</h2>
        <p className="cta-sub-ko">오늘 당신의 AI 팀을 구성하세요.</p>
        <button className="btn-primary-lg" onClick={() => navigate("/login")}>Get Started Free →</button>
        <p className="cta-note">No credit card required. Free forever.</p>
      </section>
      <footer className="landing-footer">
        © 2026 Next AI Crew · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="mailto:hello@nextaicrew.com">Contact</a>
      </footer>
    </div>
  );
}
