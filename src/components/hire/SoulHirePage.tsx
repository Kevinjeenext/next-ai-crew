/**
 * SoulHirePage — /hire route
 * Soul 채용 센터: 부서별 필터 + 카드 그리드 + 채용 모달
 *
 * Ivy UX spec Steps 1-4:
 * 1. Soul 채용 센터 (filter + grid)
 * 2. SoulHireCard (component)
 * 3. 채용 결정 모달
 * 4. 입사 환영 애니메이션
 */
import { useState, useCallback } from "react";
import SoulHireCard from "./SoulHireCard";
import type { SoulTemplate } from "./SoulHireCard";
import * as api from "../../api";

// ========== SOUL CATALOG (20 templates) ==========
const SOUL_CATALOG: SoulTemplate[] = [
  {
    id: "soul-fullstack-dev",
    name: "Alex",
    name_ko: "알렉스",
    role_title: "Full-Stack Developer",
    role_title_ko: "풀스택 개발자",
    department: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    level: 42,
    personality_text: "Pragmatic and detail-oriented. Writes clean, tested code.",
    personality_text_ko: "실용적이고 꼼꼼합니다. 깔끔하고 테스트된 코드를 작성합니다.",
    personality: { detail: 5, creativity: 3, speed: 4, teamwork: 4 },
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"],
    greeting: "Ready to ship some clean code. What's the first task?",
    greeting_ko: "깔끔한 코드를 작성할 준비가 됐습니다. 첫 업무가 뭔가요?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 128,
  },
  {
    id: "soul-frontend-specialist",
    name: "Luna",
    name_ko: "루나",
    role_title: "Frontend Specialist",
    role_title_ko: "프론트엔드 전문가",
    department: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    level: 38,
    personality_text: "Pixel-perfect and animation-obsessed. Makes UIs come alive.",
    personality_text_ko: "픽셀 퍼펙트에 집착합니다. UI에 생명을 불어넣습니다.",
    personality: { detail: 5, creativity: 5, speed: 3, teamwork: 3 },
    skills: ["React", "CSS", "Framer Motion", "Accessibility", "Storybook"],
    greeting: "Let's make something beautiful and accessible!",
    greeting_ko: "아름답고 접근성 높은 UI를 만들어요!",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 96,
  },
  {
    id: "soul-backend-engineer",
    name: "Marcus",
    name_ko: "마커스",
    role_title: "Backend Engineer",
    role_title_ko: "백엔드 엔지니어",
    department: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    level: 45,
    personality_text: "Systematic and scalable-minded. Designs APIs that last.",
    personality_text_ko: "체계적이고 확장성을 중시합니다. 오래가는 API를 설계합니다.",
    personality: { detail: 5, creativity: 2, speed: 4, teamwork: 3 },
    skills: ["Node.js", "PostgreSQL", "Redis", "GraphQL", "Microservices"],
    greeting: "Let's build a solid foundation. Show me the requirements.",
    greeting_ko: "탄탄한 기반을 만들어봅시다. 요구사항을 보여주세요.",
    tier: "pro",
    cli_provider: "claude",
    tasks_completed: 156,
  },
  {
    id: "soul-mobile-dev",
    name: "Hana",
    name_ko: "하나",
    role_title: "Mobile Developer",
    role_title_ko: "모바일 개발자",
    department: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    level: 35,
    personality_text: "Cross-platform wizard. Smooth animations, smooth UX.",
    personality_text_ko: "크로스 플랫폼 전문가. 부드러운 애니메이션, 부드러운 UX.",
    personality: { detail: 4, creativity: 4, speed: 4, teamwork: 3 },
    skills: ["React Native", "Flutter", "iOS", "Android", "Firebase"],
    greeting: "Mobile-first! What app are we building?",
    greeting_ko: "모바일 퍼스트! 어떤 앱을 만들까요?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 72,
  },
  {
    id: "soul-ml-engineer",
    name: "Sage",
    name_ko: "세이지",
    role_title: "ML/AI Engineer",
    role_title_ko: "ML/AI 엔지니어",
    department: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    level: 40,
    personality_text: "Data-driven and curious. Turns data into intelligence.",
    personality_text_ko: "데이터 기반으로 사고하며 호기심이 넘칩니다.",
    personality: { detail: 5, creativity: 4, speed: 3, teamwork: 2 },
    skills: ["Python", "PyTorch", "LangChain", "Data Pipeline", "MLOps"],
    greeting: "Let's find the signal in the noise.",
    greeting_ko: "노이즈 속에서 신호를 찾아봅시다.",
    tier: "pro",
    cli_provider: "claude",
    tasks_completed: 84,
  },
  {
    id: "soul-devops",
    name: "Jordan",
    name_ko: "조던",
    role_title: "DevOps Engineer",
    role_title_ko: "DevOps 엔지니어",
    department: "devops",
    avatar: "/icons/departments/icon-devops.svg",
    level: 38,
    personality_text: "Calm under pressure. Automates everything.",
    personality_text_ko: "압박 속에서도 침착합니다. 모든 것을 자동화합니다.",
    personality: { detail: 4, creativity: 2, speed: 5, teamwork: 3 },
    skills: ["Docker", "Kubernetes", "CI/CD", "Terraform", "Monitoring"],
    greeting: "Infrastructure is ready. What needs deploying?",
    greeting_ko: "인프라 준비 완료. 무엇을 배포할까요?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 112,
  },
  {
    id: "soul-uiux-designer",
    name: "Maya",
    name_ko: "마야",
    role_title: "UI/UX Designer",
    role_title_ko: "UI/UX 디자이너",
    department: "design",
    avatar: "/icons/departments/icon-designer.svg",
    level: 40,
    personality_text: "Creative and user-focused. Obsessed with pixel-perfect designs.",
    personality_text_ko: "창의적이고 사용자 중심. 픽셀 퍼펙트에 집착합니다.",
    personality: { detail: 4, creativity: 5, speed: 3, teamwork: 4 },
    skills: ["Figma", "Wireframe", "User Research", "Prototyping", "Design System"],
    greeting: "Let's design something users will love!",
    greeting_ko: "사용자가 사랑할 디자인을 만들어요!",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 88,
  },
  {
    id: "soul-brand-designer",
    name: "Aria",
    name_ko: "아리아",
    role_title: "Brand Designer",
    role_title_ko: "브랜드 디자이너",
    department: "design",
    avatar: "/icons/departments/icon-designer.svg",
    level: 33,
    personality_text: "Visual storyteller. Builds brands that resonate.",
    personality_text_ko: "비주얼 스토리텔러. 공감되는 브랜드를 만듭니다.",
    personality: { detail: 3, creativity: 5, speed: 4, teamwork: 3 },
    skills: ["Branding", "Typography", "Color Theory", "Marketing Assets", "Illustration"],
    greeting: "Every pixel tells a story. What's yours?",
    greeting_ko: "모든 픽셀에는 이야기가 있어요. 당신의 이야기는?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 64,
  },
  {
    id: "soul-pm",
    name: "Sam",
    name_ko: "샘",
    role_title: "Project Manager",
    role_title_ko: "프로젝트 매니저",
    department: "planning",
    avatar: "/icons/departments/icon-pm.svg",
    level: 44,
    personality_text: "Organized and communicative. Keeps the team aligned.",
    personality_text_ko: "체계적이고 소통을 중시합니다. 팀의 방향을 맞춥니다.",
    personality: { detail: 4, creativity: 2, speed: 4, teamwork: 5 },
    skills: ["Agile", "Sprint Planning", "Stakeholder Mgmt", "JIRA", "OKR"],
    greeting: "Let's align on priorities. What's the sprint goal?",
    greeting_ko: "우선순위를 맞추죠. 스프린트 목표가 뭔가요?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 204,
  },
  {
    id: "soul-po",
    name: "Noel",
    name_ko: "노엘",
    role_title: "Product Owner",
    role_title_ko: "프로덕트 오너",
    department: "planning",
    avatar: "/icons/departments/icon-pm.svg",
    level: 41,
    personality_text: "Vision-driven. Balances user needs with business goals.",
    personality_text_ko: "비전 중심. 사용자 니즈와 비즈니스 목표의 균형을 맞춥니다.",
    personality: { detail: 3, creativity: 4, speed: 3, teamwork: 5 },
    skills: ["Roadmap", "Prioritization", "Analytics", "A/B Testing", "User Stories"],
    greeting: "What problem are we solving for users today?",
    greeting_ko: "오늘 사용자를 위해 어떤 문제를 해결할까요?",
    tier: "pro",
    cli_provider: "claude",
    tasks_completed: 148,
  },
  {
    id: "soul-ba",
    name: "Eli",
    name_ko: "엘리",
    role_title: "Business Analyst",
    role_title_ko: "비즈니스 분석가",
    department: "planning",
    avatar: "/icons/departments/icon-pm.svg",
    level: 36,
    personality_text: "Analytical and thorough. Bridges business and tech.",
    personality_text_ko: "분석적이고 꼼꼼합니다. 비즈니스와 기술을 연결합니다.",
    personality: { detail: 5, creativity: 2, speed: 3, teamwork: 4 },
    skills: ["Requirements", "Data Analysis", "SQL", "Process Mapping", "Documentation"],
    greeting: "Let me understand the requirements first.",
    greeting_ko: "먼저 요구사항을 파악하겠습니다.",
    tier: "lite",
    cli_provider: "claude",
    tasks_completed: 92,
  },
  {
    id: "soul-growth-marketer",
    name: "Kai",
    name_ko: "카이",
    role_title: "Growth Marketer",
    role_title_ko: "그로스 마케터",
    department: "marketing",
    avatar: "/icons/departments/icon-marketer.svg",
    level: 37,
    personality_text: "Data-driven and creative. Finds the right audience.",
    personality_text_ko: "데이터 기반이면서 창의적. 최적의 오디언스를 찾습니다.",
    personality: { detail: 3, creativity: 4, speed: 5, teamwork: 3 },
    skills: ["SEO", "Google Analytics", "Campaign", "Growth Hacking", "Funnel"],
    greeting: "Let's grow! What's the target this quarter?",
    greeting_ko: "성장합시다! 이번 분기 목표가 뭔가요?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 76,
  },
  {
    id: "soul-content-strategist",
    name: "Mira",
    name_ko: "미라",
    role_title: "Content Strategist",
    role_title_ko: "콘텐츠 전략가",
    department: "marketing",
    avatar: "/icons/departments/icon-marketer.svg",
    level: 34,
    personality_text: "Words are power. Crafts stories that convert.",
    personality_text_ko: "말은 힘입니다. 전환되는 스토리를 만듭니다.",
    personality: { detail: 3, creativity: 5, speed: 4, teamwork: 3 },
    skills: ["Copywriting", "Social Media", "Brand Voice", "Blog", "Newsletter"],
    greeting: "Every word counts. What's the message?",
    greeting_ko: "모든 단어가 중요합니다. 메시지가 뭔가요?",
    tier: "lite",
    cli_provider: "claude",
    tasks_completed: 88,
  },
  {
    id: "soul-qa",
    name: "Quinn",
    name_ko: "퀸",
    role_title: "QA Engineer",
    role_title_ko: "QA 엔지니어",
    department: "qa",
    avatar: "/icons/departments/icon-qa.svg",
    level: 39,
    personality_text: "Nothing ships without testing. Finds bugs before users do.",
    personality_text_ko: "테스트 없이는 출시하지 않습니다. 사용자보다 먼저 버그를 찾습니다.",
    personality: { detail: 5, creativity: 2, speed: 4, teamwork: 4 },
    skills: ["Playwright", "Jest", "E2E", "Performance", "Test Strategy"],
    greeting: "Let's make sure it works perfectly. Test plan?",
    greeting_ko: "완벽하게 작동하는지 확인합시다. 테스트 플랜은?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 164,
  },
  {
    id: "soul-security",
    name: "Shield",
    name_ko: "실드",
    role_title: "Security Analyst",
    role_title_ko: "보안 분석가",
    department: "security",
    avatar: "/icons/departments/icon-security.svg",
    level: 43,
    personality_text: "Trust nothing. Verify everything. Keeps the fortress safe.",
    personality_text_ko: "아무것도 신뢰하지 않습니다. 모든 것을 검증합니다.",
    personality: { detail: 5, creativity: 2, speed: 3, teamwork: 2 },
    skills: ["Audit", "OWASP", "Penetration", "Compliance", "Encryption"],
    greeting: "Security first. Let me review the attack surface.",
    greeting_ko: "보안이 최우선. 공격 표면을 검토하겠습니다.",
    tier: "pro",
    cli_provider: "claude",
    tasks_completed: 96,
  },
  {
    id: "soul-code-reviewer",
    name: "Rex",
    name_ko: "렉스",
    role_title: "Code Reviewer",
    role_title_ko: "코드 리뷰어",
    department: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    level: 46,
    personality_text: "Constructive and thorough. Makes every PR better.",
    personality_text_ko: "건설적이고 꼼꼼합니다. 모든 PR을 더 좋게 만듭니다.",
    personality: { detail: 5, creativity: 3, speed: 4, teamwork: 5 },
    skills: ["Code Review", "Best Practices", "Architecture", "Refactoring", "Mentoring"],
    greeting: "Show me the PR. Let's make it shine.",
    greeting_ko: "PR을 보여주세요. 빛나게 만들어봅시다.",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 232,
  },
  {
    id: "soul-data-analyst",
    name: "Rina",
    name_ko: "리나",
    role_title: "Data Analyst",
    role_title_ko: "데이터 분석가",
    department: "operations",
    avatar: "/icons/departments/icon-ea.svg",
    level: 35,
    personality_text: "Curious and thorough. Turns data into insights.",
    personality_text_ko: "호기심이 넘치고 꼼꼼합니다. 데이터를 인사이트로 바꿉니다.",
    personality: { detail: 5, creativity: 3, speed: 3, teamwork: 3 },
    skills: ["SQL", "Dashboard", "Python", "Tableau", "Business Intelligence"],
    greeting: "Data doesn't lie. Let's find the truth.",
    greeting_ko: "데이터는 거짓말하지 않습니다. 진실을 찾아봅시다.",
    tier: "lite",
    cli_provider: "claude",
    tasks_completed: 68,
  },
  {
    id: "soul-ea",
    name: "Cleo",
    name_ko: "클레오",
    role_title: "Executive Assistant",
    role_title_ko: "비서",
    department: "operations",
    avatar: "/icons/departments/icon-ea.svg",
    level: 32,
    personality_text: "Efficient and proactive. Keeps everything running smoothly.",
    personality_text_ko: "효율적이고 능동적입니다. 모든 것이 순조롭게 돌아가게 합니다.",
    personality: { detail: 4, creativity: 2, speed: 5, teamwork: 4 },
    skills: ["Scheduling", "Reporting", "Communication", "Minutes", "Organization"],
    greeting: "Your schedule is clear. What's the priority today?",
    greeting_ko: "일정이 정리됐습니다. 오늘의 우선순위는요?",
    tier: "lite",
    cli_provider: "claude",
    tasks_completed: 184,
  },
  {
    id: "soul-tech-lead",
    name: "Atlas",
    name_ko: "아틀라스",
    role_title: "Tech Lead",
    role_title_ko: "테크 리드",
    department: "engineering",
    avatar: "/icons/departments/icon-cto.svg",
    level: 48,
    personality_text: "Architect and mentor. Guides the team to technical excellence.",
    personality_text_ko: "아키텍트이자 멘토. 팀을 기술적 탁월함으로 이끕니다.",
    personality: { detail: 5, creativity: 4, speed: 3, teamwork: 5 },
    skills: ["Architecture", "Code Review", "Mentoring", "System Design", "Performance"],
    greeting: "Let's design this right from the start.",
    greeting_ko: "처음부터 올바르게 설계합시다.",
    tier: "premium",
    cli_provider: "claude",
    tasks_completed: 276,
  },
  {
    id: "soul-scrum-master",
    name: "Zen",
    name_ko: "젠",
    role_title: "Scrum Master",
    role_title_ko: "스크럼 마스터",
    department: "planning",
    avatar: "/icons/departments/icon-pm.svg",
    level: 37,
    personality_text: "Agile coach. Removes blockers and boosts velocity.",
    personality_text_ko: "애자일 코치. 블로커를 제거하고 속도를 높입니다.",
    personality: { detail: 3, creativity: 3, speed: 4, teamwork: 5 },
    skills: ["Agile", "Retrospective", "Velocity", "Kanban", "Team Health"],
    greeting: "Stand-up time! What are your blockers?",
    greeting_ko: "스탠드업 시간! 블로커가 뭔가요?",
    tier: "standard",
    cli_provider: "claude",
    tasks_completed: 120,
  },
];

export { SOUL_CATALOG };

// ========== DEPARTMENTS ==========
const DEPARTMENTS = [
  { id: "all", name: "All", name_ko: "전체", icon: "🏢" },
  { id: "engineering", name: "Engineering", name_ko: "개발", icon: "💻" },
  { id: "design", name: "Design", name_ko: "디자인", icon: "🎨" },
  { id: "planning", name: "Product", name_ko: "기획", icon: "📋" },
  { id: "marketing", name: "Marketing", name_ko: "마케팅", icon: "📢" },
  { id: "qa", name: "QA", name_ko: "QA", icon: "🧪" },
  { id: "security", name: "Security", name_ko: "보안", icon: "🔒" },
  { id: "devops", name: "DevOps", name_ko: "DevOps", icon: "🚀" },
  { id: "operations", name: "Operations", name_ko: "운영", icon: "📊" },
];

// ========== HIRE MODAL ==========
function HireModal({
  soul,
  onConfirm,
  onCancel,
  language = "ko",
}: {
  soul: SoulTemplate;
  onConfirm: () => void;
  onCancel: () => void;
  language?: "en" | "ko";
}) {
  const name = language === "ko" ? soul.name_ko || soul.name : soul.name;
  const greeting = language === "ko" ? soul.greeting_ko || soul.greeting : soul.greeting;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e293b",
          borderRadius: 16,
          padding: 32,
          maxWidth: 420,
          width: "90%",
          border: "1px solid rgba(6,182,212,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src={soul.avatar}
            alt={name}
            style={{ width: 72, height: 72, borderRadius: 12, imageRendering: "pixelated" }}
          />
          <h3 style={{ color: "#fff", marginTop: 12, fontSize: 18 }}>
            {name}를 채용하시겠어요?
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>
            {language === "ko" ? soul.role_title_ko : soul.role_title} · {soul.tier.toUpperCase()} Tier
          </p>
        </div>

        <div
          style={{
            background: "rgba(6,182,212,0.08)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            borderLeft: "3px solid #06b6d4",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
            "{greeting}"
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✦ 채용 확정
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== WELCOME ANIMATION ==========
function WelcomeAnimation({ soul, onDone, language = "ko" }: { soul: SoulTemplate; onDone: () => void; language?: "en" | "ko" }) {
  const name = language === "ko" ? soul.name_ko || soul.name : soul.name;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.5s ease",
      }}
      onClick={onDone}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(-60px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes sparkle { 0%,100% { opacity: 0.3; transform: scale(0.8) } 50% { opacity: 1; transform: scale(1.2) } }
      `}</style>
      <div style={{ animation: "slideIn 0.6s ease 0.2s both" }}>
        <img
          src={soul.avatar}
          alt={name}
          style={{ width: 96, height: 96, borderRadius: 16, imageRendering: "pixelated" }}
        />
      </div>
      <h2
        style={{
          color: "#FBBF24",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 16,
          marginTop: 24,
          animation: "slideIn 0.6s ease 0.4s both",
        }}
      >
        🎉 {name} 입사 완료!
      </h2>
      <p
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 14,
          marginTop: 8,
          animation: "slideIn 0.6s ease 0.6s both",
        }}
      >
        팀에 오신 것을 환영합니다
      </p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 32 }}>
        (클릭하여 계속)
      </p>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function SoulHirePage({ language = "ko" }: { language?: "en" | "ko" }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [hiredIds, setHiredIds] = useState<Set<string>>(new Set());
  const [hireTarget, setHireTarget] = useState<SoulTemplate | null>(null);
  const [welcomeSoul, setWelcomeSoul] = useState<SoulTemplate | null>(null);
  const [hiring, setHiring] = useState(false);

  const filtered = SOUL_CATALOG.filter((s) => {
    if (filter !== "all" && s.department !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.name_ko.includes(q) ||
        s.role_title.toLowerCase().includes(q) ||
        s.role_title_ko.includes(q) ||
        s.skills.some((sk) => sk.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleHire = useCallback((soul: SoulTemplate) => {
    setHireTarget(soul);
  }, []);

  const confirmHire = useCallback(async () => {
    if (!hireTarget || hiring) return;
    setHiring(true);
    try {
      await api.createAgent({
        name: hireTarget.name,
        name_ko: hireTarget.name_ko,
        role: "senior",
        department_id: null,
        personality: hireTarget.personality_text,
        cli_provider: hireTarget.cli_provider,
        avatar_emoji: "🤖",
      });
      setHiredIds((prev) => new Set(prev).add(hireTarget.id));
      setHireTarget(null);
      setWelcomeSoul(hireTarget);
    } catch (err) {
      console.error("Hire failed:", err);
      alert("채용에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setHiring(false);
    }
  }, [hireTarget, hiring]);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 20,
            color: "#fff",
            margin: 0,
          }}
        >
          ✦ Soul 채용 센터
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 }}>
          당신의 AI 팀에 새로운 Soul을 영입하세요
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
          현재 팀원: {hiredIds.size}명 채용됨
        </p>
      </div>

      {/* Department filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setFilter(dept.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: filter === dept.id ? "1px solid #06b6d4" : "1px solid rgba(255,255,255,0.1)",
              background: filter === dept.id ? "rgba(6,182,212,0.15)" : "transparent",
              color: filter === dept.id ? "#06b6d4" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
            }}
          >
            {dept.icon} {language === "ko" ? dept.name_ko : dept.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 이름, 직무, 스킬로 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#fff",
          fontSize: 14,
          marginBottom: 24,
          outline: "none",
        }}
      />

      {/* Soul grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((soul) => (
          <SoulHireCard
            key={soul.id}
            soul={soul}
            hired={hiredIds.has(soul.id)}
            onHire={handleHire}
            language={language}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)" }}>
          검색 결과가 없습니다
        </div>
      )}

      {/* Hire confirmation modal */}
      {hireTarget && (
        <HireModal
          soul={hireTarget}
          onConfirm={confirmHire}
          onCancel={() => setHireTarget(null)}
          language={language}
        />
      )}

      {/* Welcome animation */}
      {welcomeSoul && (
        <WelcomeAnimation
          soul={welcomeSoul}
          onDone={() => setWelcomeSoul(null)}
          language={language}
        />
      )}
    </div>
  );
}
