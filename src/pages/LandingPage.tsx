/**
 * Landing Page — "Your AI Crew, with Soul."
 * Design: Ivy Day 3 (01-landing-hero-design.md)
 */
import { useNavigate } from "react-router-dom";
import SoulAvatar from "../components/ui/SoulAvatar";

/* ── Department icon data (10 departments) ── */
const DEPARTMENTS = [
  { id: "ceo",       label: "CEO",       color: "#2563EB", icon: "/icons/departments/icon-ceo.svg" },
  { id: "cto",       label: "CTO",       color: "#6366F1", icon: "/icons/departments/icon-cto.svg" },
  { id: "developer", label: "Developer", color: "#2563EB", icon: "/icons/departments/icon-developer.svg" },
  { id: "designer",  label: "Designer",  color: "#06B6D4", icon: "/icons/departments/icon-designer.svg" },
  { id: "pm",        label: "PM",        color: "#FBBF24", icon: "/icons/departments/icon-pm.svg" },
  { id: "security",  label: "Security",  color: "#F43F5E", icon: "/icons/departments/icon-security.svg" },
  { id: "qa",        label: "QA",        color: "#10B981", icon: "/icons/departments/icon-qa.svg" },
  { id: "devops",    label: "DevOps",    color: "#F97316", icon: "/icons/departments/icon-devops.svg" },
  { id: "marketer",  label: "Marketer",  color: "#EC4899", icon: "/icons/departments/icon-marketer.svg" },
  { id: "ea",        label: "EA",        color: "#8B5CF6", icon: "/icons/departments/icon-ea.svg" },
];

/* ── Agent card showcase ── */
const AGENTS = [
  {
    name: "Sophia",
    role: "Senior Developer",
    department: "engineering",
    color: "#2563EB",
    skills: ["React", "Python", "TypeScript"],
    task: "API 리팩토링 완료",
    progress: 78,
    level: 42,
    tasksToday: 12,
    status: "working" as const,
  },
  {
    name: "Marcus",
    role: "Security Lead",
    department: "security",
    color: "#F43F5E",
    skills: ["Audit", "Pentest", "SAST"],
    task: "보안 스캔 진행 중",
    progress: 45,
    level: 38,
    tasksToday: 8,
    status: "working" as const,
  },
  {
    name: "Ivy",
    role: "UX Designer",
    department: "design",
    color: "#06B6D4",
    skills: ["Figma", "CSS", "Motion"],
    task: "랜딩 디자인 QA",
    progress: 92,
    level: 35,
    tasksToday: 6,
    status: "online" as const,
  },
];

const VALUE_PROPS = [
  {
    icon: "/icons/ui/antislop-command.svg",
    title: "지시만 하세요",
    desc: "자연어로 업무 지시, AI가 이해하고 실행합니다.",
  },
  {
    icon: "/icons/ui/antislop-team.svg",
    title: "팀이 알아서",
    desc: "에이전트끼리 협업, 회의, 코드 리뷰를 자율적으로 진행합니다.",
  },
  {
    icon: "/icons/ui/antislop-result.svg",
    title: "결과만 확인",
    desc: "완료 보고, 코드 PR, 배포까지 자동으로 처리됩니다.",
  },
];

const FEATURES = [
  { icon: "/icons/ui/feature-soul.svg", title: "Souls, Not Bots", description: "Each AI agent has a unique personality, role, and expertise. They're not tools — they're team members." },
  { icon: "/icons/ui/feature-workflow.svg", title: "Your Virtual Office", description: "Organize departments, assign tasks, and watch your AI crew collaborate in real-time." },
  { icon: "/icons/ui/feature-multimodel.svg", title: "Instant Scaling", description: "Spin up specialists in seconds. Engineering, design, marketing — build any team you need." },
  { icon: "/icons/ui/feature-collaboration.svg", title: "Natural Communication", description: "Give directives in plain language. Your AI team discusses, plans, and delivers results." },
  { icon: "/icons/ui/feature-dashboard.svg", title: "Full Visibility", description: "Track progress, review outputs, and see meeting minutes — like a real management dashboard." },
  { icon: "/icons/ui/feature-security.svg", title: "Enterprise Ready", description: "Multi-tenant architecture, role-based access, and audit trails from day one." },
];

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  online: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#10B981",
    boxShadow: "0 0 8px rgba(16,185,129,0.5)",
    animation: "soul-spark 2s ease-in-out infinite",
  },
  working: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#06B6D4",
    boxShadow: "0 0 8px rgba(6,182,212,0.5)",
    animation: "soul-pulse 1.5s ease-in-out infinite",
  },
  offline: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#475569",
  },
};

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" data-theme="dark" style={{ background: "#080B12", color: "#E2E8F0" }}>
      {/* Global animations */}
      <style>{`
        @keyframes soul-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes soul-spark { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b"
        style={{ background: "rgba(8,11,18,0.9)", backdropFilter: "blur(20px)", borderColor: "rgba(59,130,246,0.1)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Next AI Crew
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/pricing")}
              className="text-sm hover:text-white transition" style={{ color: "#94A3B8" }}>
              Pricing
            </button>
            <button onClick={() => navigate("/login")}
              className="text-sm hover:text-white transition" style={{ color: "#94A3B8" }}>
              Sign In
            </button>
            <button onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:brightness-110"
              style={{ background: "#2563EB", boxShadow: "0 0 20px rgba(37,99,235,0.25)" }}>
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23fff' stroke-width='.5'/%3E%3C/svg%3E\")" }} />
        {/* Soul gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #2563EB, #06B6D4, #6366F1, transparent)" }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-6"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60A5FA" }}>
            ✨ Now in Early Access
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your AI Crew,{" "}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
              with Soul.
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-3" style={{ color: "#94A3B8" }}>
            도구가 아닌 동료. 생각하고, 협력하고, 성장하는 AI 팀을 만나세요.
          </p>
          <p className="text-sm max-w-xl mx-auto mb-10" style={{ color: "#64748B", fontFamily: "'Space Grotesk', sans-serif" }}>
            Meet the team that never sleeps. They think, they care, they deliver.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-xl text-lg font-semibold text-white transition hover:brightness-110"
              style={{ background: "#2563EB", boxShadow: "0 0 30px rgba(37,99,235,0.3)" }}>
              Start Building Your Crew
            </button>
            <button onClick={() => { document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}
              className="px-8 py-4 rounded-xl text-lg font-semibold transition hover:brightness-110"
              style={{ color: "#2563EB", border: "1.5px solid #2563EB", background: "transparent" }}>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* ─── Agent Card Showcase ─── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(37,99,235,0.1)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-medium uppercase tracking-wider mb-10"
            style={{ color: "#64748B" }}>
            Meet Your Future Team
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {AGENTS.map((agent) => (
              <div key={agent.name}
                className="rounded-2xl p-5 transition-all duration-300 cursor-pointer group"
                style={{
                  background: "rgba(13,17,32,0.7)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "rgba(6,182,212,0.3)";
                  el.style.boxShadow = "0 0 20px rgba(6,182,212,0.1), 0 0 40px rgba(37,99,235,0.05)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "rgba(37,99,235,0.1)";
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <SoulAvatar name={agent.name} size="lg" department={agent.department} status={agent.status === "working" ? "active" : agent.status === "online" ? "active" : "offline"} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{agent.name}</div>
                    <div className="text-xs" style={{ color: "#94A3B8", fontFamily: "var(--font-ui)", fontSize: 11 }}>
                      {agent.role}
                    </div>
                  </div>
                  <div style={STATUS_STYLES[agent.status]} />
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {agent.skills.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(37,99,235,0.1)", color: "#94A3B8", border: "1px solid rgba(37,99,235,0.15)" }}>
                      {s}
                    </span>
                  ))}
                </div>

                {/* Task + progress */}
                <div className="text-xs mb-2" style={{ color: "#94A3B8" }}>{agent.task}</div>
                <div className="h-1.5 rounded-full overflow-hidden mb-2"
                  style={{ background: "rgba(30,41,59,1)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${agent.progress}%`, background: "linear-gradient(90deg, #2563EB, #06B6D4)" }} />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9 }}>
                  <span style={{ color: "#64748B" }}>⚡ {agent.tasksToday} tasks</span>
                  <span style={{ color: "#FBBF24" }}>⭐ Lv.{agent.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Anti-Slop Value Props ─── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            반복은 AI에게. 결정은 당신에게.
          </h2>
          <p className="mb-12 max-w-xl mx-auto" style={{ color: "#94A3B8" }}>
            코드 리뷰, 버그 수정, 배포, 보안 점검 — AI Crew가 처리하는 동안, 당신은 비즈니스에 집중하세요.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="p-6 rounded-2xl transition hover:translate-y-[-2px]"
                style={{ background: "rgba(15,23,41,0.5)", border: "1px solid rgba(37,99,235,0.1)" }}>
                <img src={v.icon} alt="" className="w-12 h-12 mb-3 mx-auto" style={{ imageRendering: "pixelated" }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: "#FFFFFF" }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Department Icons Showcase ─── */}
      <section className="py-12 px-6" style={{ borderTop: "1px solid rgba(37,99,235,0.1)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-medium uppercase tracking-wider mb-8"
            style={{ color: "#64748B" }}>
            10 Specialized Departments
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {DEPARTMENTS.map((d) => (
              <div key={d.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center transition group-hover:scale-110"
                  style={{ background: `${d.color}15`, border: `1px solid ${d.color}30` }}>
                  <img src={d.icon} alt={d.label} className="w-10 h-10" />
                </div>
                <span className="text-xs font-medium" style={{ color: d.color }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wider mb-6" style={{ color: "#64748B" }}>
            10+ AI Models, One Crew
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Claude", "GPT-5", "Gemini", "Codex", "OpenCode", "LLaMA"].map((m) => (
              <span key={m} className="px-4 py-1.5 rounded-full text-sm"
                style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", color: "#94A3B8" }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything You Need to Lead an AI Team
            </h2>
            <p style={{ color: "#94A3B8" }} className="max-w-xl mx-auto">
              From hiring to delegation, review to reporting — manage your AI crew like you'd manage a real team.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="p-6 rounded-xl transition hover:border-[rgba(6,182,212,0.3)]"
                style={{ background: "rgba(15,23,41,0.3)", border: "1px solid rgba(37,99,235,0.1)" }}>
                <img src={f.icon} alt="" className="w-10 h-10 mb-3" style={{ imageRendering: "pixelated" }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: "#FFFFFF" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(37,99,235,0.1)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Build Your AI Crew?
          </h2>
          <p className="mb-8" style={{ color: "#94A3B8" }}>
            Start free. No credit card required. 7-day trial with full access.
          </p>
          <button onClick={() => navigate("/login")}
            className="px-8 py-4 rounded-xl text-lg font-semibold text-white transition hover:brightness-110"
            style={{ background: "#2563EB", boxShadow: "0 0 30px rgba(37,99,235,0.3)" }}>
            Get Started Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: "1px solid rgba(37,99,235,0.1)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm" style={{ color: "#64748B" }}>
            © 2026 Next AI Crew. All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-sm" style={{ color: "#64748B" }}>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
