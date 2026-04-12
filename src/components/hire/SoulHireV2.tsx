/**
 * SoulHireV2 — Ivy 16-soul-hire-v2.md
 * Carousel + Detail Panel + Radar Chart
 */
import { useState, useCallback } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Search, MessageCircle, UserPlus, UserCheck as UserCheckIcon, Check, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./soul-hire-v2.css";

// ─── Types ───
interface SoulCapability { label: string; supported: boolean; }
interface SoulStats { analysis: number; judgment: number; research: number; writing: number; reliability: number; monitoring: number; }

interface SoulPreset {
  id: string;
  name: string;
  display_name: string;
  category: string;
  experience: string;
  greeting_message: string;
  thumbnail_url: string;
  skill_tags: string[];
  capabilities: SoulCapability[];
  stats: SoulStats;
  token_efficiency: string;
  token_pct: number;
  match_score: number;
  hired_by_count: number;
}

// ─── Data ───
const PRESETS: SoulPreset[] = [
  { id: "alex-developer", name: "Alex", display_name: "Alex Chen", category: "Developer", experience: "Senior", greeting_message: "안녕하세요! 풀스택 개발자 Alex입니다. 코드 리뷰부터 새 기능 구현까지 뭐든 도와드려요. 🚀", thumbnail_url: "/avatars/souls/soul_01_alex.webp", skill_tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"], capabilities: [{ label: "코드 리뷰 & 버그 수정", supported: true }, { label: "REST API / GraphQL 설계", supported: true }, { label: "데이터베이스 쿼리 최적화", supported: true }, { label: "CI/CD 파이프라인 구축", supported: true }, { label: "모바일 앱 개발", supported: false }], stats: { analysis: 88, judgment: 92, research: 75, writing: 70, reliability: 95, monitoring: 82 }, token_efficiency: "Efficient", token_pct: 30, match_score: 94, hired_by_count: 1240 },
  { id: "maya-designer", name: "Maya", display_name: "Maya Kim", category: "Designer", experience: "Senior", greeting_message: "디자인은 사용자의 마음을 읽는 일이에요. 와이어프레임부터 프로토타입까지 함께해요! 🎨", thumbnail_url: "/avatars/souls/soul_02_sophia.webp", skill_tags: ["Figma", "Tailwind", "Accessibility", "Motion", "Design System"], capabilities: [{ label: "UI/UX 디자인 & 와이어프레임", supported: true }, { label: "디자인 시스템 구축", supported: true }, { label: "접근성(A11y) 감사", supported: true }, { label: "모션 그래픽", supported: true }, { label: "3D 모델링", supported: false }], stats: { analysis: 78, judgment: 85, research: 80, writing: 88, reliability: 90, monitoring: 72 }, token_efficiency: "Balanced", token_pct: 50, match_score: 91, hired_by_count: 980 },
  { id: "marcus", name: "Marcus", display_name: "Marcus Lee", category: "Security", experience: "Expert", greeting_message: "보안은 사후 대응이 아니라 설계 단계부터 시작됩니다. 취약점 분석, 코드 감사 맡겨주세요. 🔒", thumbnail_url: "/avatars/souls/soul_03_marcus.webp", skill_tags: ["Penetration Testing", "OWASP", "SOC 2", "Encryption"], capabilities: [{ label: "취약점 스캔 & 침투 테스트", supported: true }, { label: "보안 코드 리뷰", supported: true }, { label: "SOC 2 준비 가이드", supported: true }, { label: "인프라 보안 설계", supported: true }, { label: "물리 보안", supported: false }], stats: { analysis: 95, judgment: 90, research: 85, writing: 65, reliability: 98, monitoring: 92 }, token_efficiency: "Efficient", token_pct: 25, match_score: 87, hired_by_count: 760 },
  { id: "yuna-writer", name: "Yuna", display_name: "Yuna Park", category: "Content", experience: "Senior", greeting_message: "글 한 줄이 브랜드의 첫인상이에요. 콘텐츠 전략부터 실행까지 도울게요! ✍️", thumbnail_url: "/avatars/souls/soul_04_yuna.webp", skill_tags: ["Copywriting", "SEO", "Analytics", "Notion", "Storytelling"], capabilities: [{ label: "블로그/SNS 콘텐츠 작성", supported: true }, { label: "SEO 최적화", supported: true }, { label: "프로젝트 관리 (PM)", supported: true }, { label: "영상 스크립트", supported: true }, { label: "법률 문서 작성", supported: false }], stats: { analysis: 72, judgment: 80, research: 88, writing: 96, reliability: 85, monitoring: 68 }, token_efficiency: "Balanced", token_pct: 55, match_score: 89, hired_by_count: 1120 },
  { id: "liam", name: "Liam", display_name: "Liam O'Brien", category: "DevOps", experience: "Senior", greeting_message: "배포 자동화, 인프라 관리, 모니터링까지. 안정적인 시스템을 만들어드립니다. ⚙️", thumbnail_url: "/avatars/souls/soul_05_liam.webp", skill_tags: ["Docker", "Kubernetes", "CI/CD", "AWS", "Terraform"], capabilities: [{ label: "CI/CD 파이프라인 구축", supported: true }, { label: "컨테이너 오케스트레이션", supported: true }, { label: "모니터링 & 알림 설정", supported: true }, { label: "IaC (Terraform)", supported: true }, { label: "온프레미스 서버 관리", supported: false }], stats: { analysis: 82, judgment: 88, research: 70, writing: 60, reliability: 97, monitoring: 95 }, token_efficiency: "Efficient", token_pct: 28, match_score: 85, hired_by_count: 890 },
  { id: "priya", name: "Priya", display_name: "Priya Sharma", category: "Data", experience: "Senior", greeting_message: "데이터에서 인사이트를 찾아드려요. 대시보드 설계부터 분석까지! 📊", thumbnail_url: "/avatars/souls/soul_06_priya.webp", skill_tags: ["Python", "SQL", "Tableau", "Statistics", "Pandas"], capabilities: [{ label: "데이터 분석 & 시각화", supported: true }, { label: "대시보드 설계", supported: true }, { label: "통계 모델링", supported: true }, { label: "ETL 파이프라인", supported: true }, { label: "딥러닝 모델 학습", supported: false }], stats: { analysis: 96, judgment: 85, research: 92, writing: 75, reliability: 88, monitoring: 80 }, token_efficiency: "Balanced", token_pct: 45, match_score: 92, hired_by_count: 1050 },
  { id: "carlos", name: "Carlos", display_name: "Carlos Rivera", category: "Backend", experience: "Expert", greeting_message: "확장 가능한 API 설계가 전문입니다. 마이크로서비스 아키텍처 상담하세요! 🏗️", thumbnail_url: "/avatars/souls/soul_07_carlos.webp", skill_tags: ["Go", "gRPC", "Redis", "PostgreSQL", "Microservices"], capabilities: [{ label: "마이크로서비스 아키텍처", supported: true }, { label: "고성능 API 설계", supported: true }, { label: "데이터베이스 최적화", supported: true }, { label: "메시지 큐 설계", supported: true }, { label: "프론트엔드 개발", supported: false }], stats: { analysis: 90, judgment: 94, research: 78, writing: 62, reliability: 96, monitoring: 88 }, token_efficiency: "Efficient", token_pct: 22, match_score: 88, hired_by_count: 670 },
  { id: "emma", name: "Emma", display_name: "Emma Wilson", category: "CS", experience: "Senior", greeting_message: "고객의 목소리가 가장 중요해요. CS부터 온보딩 가이드까지 함께합니다. 💬", thumbnail_url: "/avatars/souls/soul_08_emma.webp", skill_tags: ["Zendesk", "Intercom", "CRM", "Onboarding"], capabilities: [{ label: "고객 문의 응대", supported: true }, { label: "온보딩 가이드 작성", supported: true }, { label: "FAQ / 지식 베이스 관리", supported: true }, { label: "이탈 분석 & 리텐션", supported: true }, { label: "기술 지원 (코드)", supported: false }], stats: { analysis: 70, judgment: 82, research: 75, writing: 90, reliability: 92, monitoring: 78 }, token_efficiency: "Heavy", token_pct: 70, match_score: 83, hired_by_count: 540 },
  { id: "jin", name: "Jin", display_name: "Jin Tanaka", category: "ML/AI", experience: "Expert", greeting_message: "모델 학습부터 배포까지, AI/ML 파이프라인을 구축해드립니다. 🤖", thumbnail_url: "/avatars/souls/soul_09_jin.webp", skill_tags: ["PyTorch", "MLOps", "NLP", "LLM", "HuggingFace"], capabilities: [{ label: "모델 학습 & 파인튜닝", supported: true }, { label: "NLP / LLM 파이프라인", supported: true }, { label: "MLOps 인프라", supported: true }, { label: "데이터 전처리", supported: true }, { label: "컴퓨터 비전", supported: false }], stats: { analysis: 98, judgment: 90, research: 95, writing: 68, reliability: 88, monitoring: 85 }, token_efficiency: "Balanced", token_pct: 48, match_score: 90, hired_by_count: 820 },
  { id: "amara", name: "Amara", display_name: "Amara Johnson", category: "Marketing", experience: "Senior", greeting_message: "데이터 기반 마케팅으로 성장을 이끌어요. 퍼포먼스부터 브랜딩까지! 📈", thumbnail_url: "/avatars/souls/soul_10_amara.webp", skill_tags: ["Google Ads", "SEO", "A/B Test", "Funnel", "Analytics"], capabilities: [{ label: "퍼포먼스 마케팅", supported: true }, { label: "SEO / SEM 전략", supported: true }, { label: "A/B 테스트 설계", supported: true }, { label: "콘텐츠 마케팅", supported: true }, { label: "오프라인 이벤트 기획", supported: false }], stats: { analysis: 85, judgment: 80, research: 88, writing: 82, reliability: 78, monitoring: 90 }, token_efficiency: "Balanced", token_pct: 52, match_score: 86, hired_by_count: 930 },
];

const CATEGORIES = ["전체", "Developer", "Designer", "Security", "Content", "DevOps", "Data", "Backend", "CS", "ML/AI", "Marketing"];

function radarData(stats: SoulStats) {
  return [
    { axis: "분석력", value: stats.analysis },
    { axis: "판단력", value: stats.judgment },
    { axis: "조사력", value: stats.research },
    { axis: "작성력", value: stats.writing },
    { axis: "안정성", value: stats.reliability },
    { axis: "모니터링", value: stats.monitoring },
  ];
}

function avgScore(stats: SoulStats) {
  const vals = Object.values(stats);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ─── Toast ───
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="hmc-toast" style={{ position: "fixed", top: 24, right: 24, zIndex: 9999 }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", marginLeft: 8 }}><X size={14} /></button>
    </div>
  );
}

// ─── Main Component ───
export default function SoulHireV2() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [hiring, setHiring] = useState(false);
  const [hiredIds, setHiredIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const filtered = PRESETS.filter((s) => {
    if (filter !== "전체" && s.category !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const soul = filtered[selectedIdx] || filtered[0];

  const handleHire = useCallback(async () => {
    if (!soul || hiredIds.has(soul.id)) return;
    setHiring(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API}/api/souls`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ preset_id: soul.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setHiredIds((prev) => new Set(prev).add(soul.id));
      setToast(`${soul.name} 채용 완료! 🎉`);
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      setToast(`채용 실패: ${e.message}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setHiring(false);
    }
  }, [soul, hiredIds]);

  return (
    <div className="hire-page">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="hire-header">
        <h1>Find Your AI Soul</h1>
        <div className="hire-search">
          <Search size={16} strokeWidth={1.5} />
          <input placeholder="Search souls..." value={search} onChange={(e) => { setSearch(e.target.value); setSelectedIdx(0); }} />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="hire-filter-chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={`hire-chip${filter === c ? " active" : ""}`} onClick={() => { setFilter(c); setSelectedIdx(0); }}>{c}</button>
        ))}
      </div>

      {/* Carousel */}
      <div className="soul-carousel">
        {filtered.map((s, i) => (
          <div key={s.id} className={`soul-card${i === selectedIdx ? " selected" : ""}`} onClick={() => setSelectedIdx(i)}>
            <img src={s.thumbnail_url} alt={s.name} className="soul-card-avatar" />
            <div className="soul-card-name">{s.name}</div>
            <div className="soul-card-role">{s.category}</div>
            <div className="soul-card-status"><span className="dot" /> Online</div>
            <div className="soul-card-match">Match {s.match_score}%</div>
          </div>
        ))}
      </div>

      {/* Detail + Radar */}
      {soul && (
        <div className="hire-detail-grid" key={soul.id}>
          {/* Left: Detail Panel */}
          <div className="soul-detail-panel">
            <div className="soul-detail-header">
              <img src={soul.thumbnail_url} alt={soul.display_name} className="soul-detail-avatar" />
              <div className="soul-detail-info">
                <div className="soul-detail-name">{soul.display_name}</div>
                <div className="soul-detail-role">{soul.category}</div>
                <div className="soul-detail-exp">Experience: {soul.experience}</div>
                <div className="soul-detail-hired">{soul.hired_by_count.toLocaleString()} teams hired</div>
              </div>
            </div>

            <div className="soul-detail-section-label">소개</div>
            <div className="soul-greeting">"{soul.greeting_message}"</div>

            <div className="soul-detail-section-label">핵심 전문 분야</div>
            <ul className="skill-checklist">
              {soul.capabilities.map((cap) => (
                <li key={cap.label}>
                  <span className={`skill-check ${cap.supported ? "checked" : "unchecked"}`}>
                    {cap.supported ? <Check size={12} strokeWidth={2} /> : null}
                  </span>
                  {cap.label}
                </li>
              ))}
            </ul>

            <div className="soul-detail-section-label">기술 스택</div>
            <div className="soul-skill-tags">
              {soul.skill_tags.map((t) => <span key={t} className="soul-skill-tag">{t}</span>)}
            </div>

            <div className="soul-detail-section-label">토큰 소비율</div>
            <div className="token-bar-wrap">
              <div className="token-bar-label">
                <span>{soul.token_efficiency}</span>
                <span>~{soul.token_pct * 20} tokens/req</span>
              </div>
              <div className="token-bar">
                <div className="token-bar-fill" style={{ width: `${soul.token_pct}%` }} />
              </div>
            </div>

            <div className="hire-actions">
              <button className="btn-chat-soul"><MessageCircle size={16} strokeWidth={1.5} /> 채팅하기</button>
              {hiredIds.has(soul.id) ? (
                <button className="btn-hire-soul hired"><UserCheckIcon size={16} strokeWidth={1.5} /> 채용 완료</button>
              ) : (
                <button className="btn-hire-soul" onClick={handleHire} disabled={hiring}>
                  <UserPlus size={16} strokeWidth={1.5} /> {hiring ? "채용 중..." : "채용하기 →"}
                </button>
              )}
            </div>
          </div>

          {/* Right: Radar Chart */}
          <div className="radar-card">
            <div className="radar-title">역량 분석 — {soul.display_name}</div>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData(soul.stats)} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" gridType="polygon" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={({ x, y, payload, index }: any) => {
                    const d = radarData(soul.stats);
                    const val = d[index]?.value ?? 0;
                    return (
                      <g>
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.7)" fontSize={13} fontWeight={600}>{payload.value}</text>
                        <text x={x} y={y + 16} textAnchor="middle" dominantBaseline="central" fill="#00D4FF" fontSize={12} fontWeight={700}>{val}</text>
                      </g>
                    );
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tickCount={6}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name={soul.name}
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="rgba(59,130,246,0.15)"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#00D4FF", stroke: "#3B82F6", strokeWidth: 1.5 }}
                  animationDuration={300}
                />
                <Tooltip
                  contentStyle={{ background: "rgba(13,17,32,0.95)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, fontSize: 13 }}
                  itemStyle={{ color: "#00D4FF" }}
                  formatter={(value: any) => [`${value}점`, ""]}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="radar-score-summary">
              <span>종합 점수</span>
              <span className="score-value">{avgScore(soul.stats)}<small>/100</small></span>
            </div>
            <div className="radar-stats-grid">
              {radarData(soul.stats).map((d) => (
                <div key={d.axis} className="radar-stat-item">
                  <span className="radar-stat-label">{d.axis}</span>
                  <div className="radar-stat-bar"><div className="radar-stat-fill" style={{ width: `${d.value}%` }} /></div>
                  <span className="radar-stat-val">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
