# Soul 채용 페이지 v2 — 리디자인 와이어프레임

> 2026-04-12 | Designer: Ivy | Kevin 지시
> 방향: 캐러셀 + 상세 프로필 + 레이더 차트 + 체크리스트

---

## 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│  HIRE PAGE HEADER                                                │
│  "Find Your AI Soul"   [검색] [필터: 역할/분야]                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  【 SOUL CAROUSEL (가로 스크롤) 】                                  │
│  ← [Card] [Card★] [Card] [Card] [Card] [Card] →                 │
│         ↑ selected                                               │
│                                                                  │
├────────────────────────────────┬─────────────────────────────────┤
│  【 좌: 상세 프로필 】            │  【 우: 레이더 차트 】              │
│                                │                                 │
│  [사진 80px]  Alex Chen        │       분석력                     │
│  Full-Stack Developer          │      ●                          │
│  ★★★★☆  Experience: Senior    │   /     \                       │
│                                │  /       \                      │
│  "개발이라면 뭐든 도와드려요!"       │  모니터링 ●   ● 판단력             │
│  "React, Node.js, TypeScript"  │  |         |                   │
│                                │  작성 ●   ● 조사력               │
│  ── 핵심 전문 분야 ──            │   \       /                    │
│  ☑ 코드 리뷰 & 버그 수정          │    \     /                     │
│  ☑ API 설계 & 통합              │     ●                          │
│  ☑ 데이터베이스 최적화             │   안정성                        │
│  ☑ CI/CD 자동화                 │                                 │
│  ☐ UI 컴포넌트 개발 (제한적)       │  [Radar Chart - Chart.js]      │
│                                │                                 │
│  ── 스킬 태그 ──                 │                                 │
│  [React] [TS] [Node] [+3]      │                                 │
│                                │                                 │
│  [채팅하기] [채용하기 →]           │                                 │
│                                │                                 │
└────────────────────────────────┴─────────────────────────────────┘
```

---

## 1. Soul 캐러셀 카드

```
┌──────────────────┐
│  [사진 56x56]     │  ← border-radius: 50%, neon ring if active
│  Alex            │  ← font: 700 14px
│  Developer       │  ← font: 400 12px text-tertiary
│  ● Online        │  ← 상태 dot
│  ─────────────── │
│  Match 94%       │  ← cyan 작은 뱃지
└──────────────────┘
```

**상태별 스타일:**
```css
.soul-card {
  width: 130px; flex-shrink: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.soul-card:hover {
  border-color: rgba(59,130,246,0.3);
  transform: translateY(-2px);
}
.soul-card.selected {
  border-color: var(--brand-blue);
  background: rgba(59,130,246,0.08);
  box-shadow: 0 0 20px rgba(59,130,246,0.2);
}
.soul-card.selected .soul-card-avatar {
  box-shadow: 0 0 0 2px var(--brand-blue), 0 0 16px rgba(59,130,246,0.4);
}
.soul-card-match {
  display: inline-block; margin-top: 8px;
  padding: 2px 8px; border-radius: 20px;
  background: rgba(0,212,255,0.1); color: var(--brand-cyan);
  font: 700 11px var(--font-ui);
}
/* 캐러셀 스크롤 */
.soul-carousel {
  display: flex; gap: 12px;
  overflow-x: auto; padding: 16px 0;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none; scrollbar-width: none;
}
.soul-carousel::-webkit-scrollbar { display: none; }
.soul-card { scroll-snap-align: start; }
```

---

## 2. 상세 프로필 패널 (좌측)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌──────────┐  Alex Chen                          │
│  │          │  Full-Stack Developer               │
│  │  [사진]  │  ─────────────────────────         │
│  │  80x80   │  Experience: Senior                 │
│  │          │  ★★★★☆                             │
│  └──────────┘  Hired: 0 / 1,240 teams             │
│                                                    │
│  ─── 소개 ───────────────────────────────────── ──│
│  "안녕하세요! 풀스택 개발자 Alex입니다.                 │
│   코드 리뷰부터 새 기능 구현까지 뭐든 도와드려요. 🚀"       │
│                                                    │
│  ─── 핵심 전문 분야 ──────────────────────────────  │
│  ☑  코드 리뷰 & 버그 수정                            │
│  ☑  REST API / GraphQL 설계                        │
│  ☑  데이터베이스 쿼리 최적화                          │
│  ☑  CI/CD 파이프라인 구축                            │
│  ☐  모바일 앱 개발 (제한적)                           │
│                                                    │
│  ─── 기술 스택 ────────────────────────────────── │
│  [React] [TypeScript] [Node.js] [PostgreSQL] [+2] │
│                                                    │
│  ─── 토큰 소비율 ──────────────────────────────── │
│  ████████░░  ~800 tokens/req  (Efficient)          │
│                                                    │
│  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ 💬 채팅하기   │  │   👥 채용하기  →           │   │
│  └──────────────┘  └──────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**CSS:**
```css
.soul-detail-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 28px;
  position: relative;
}
.soul-detail-panel::before {
  content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--brand-blue), var(--brand-cyan));
  border-radius: 0 0 20px 20px;
}
.soul-detail-header {
  display: flex; gap: 16px; align-items: flex-start;
  margin-bottom: 20px;
}
.soul-detail-avatar {
  width: 80px; height: 80px; border-radius: 50%;
  border: 2px solid rgba(59,130,246,0.3);
  box-shadow: 0 0 20px rgba(59,130,246,0.25);
  object-fit: cover; object-position: center top;
  flex-shrink: 0;
}
.soul-detail-name {
  font: 700 22px var(--font-ui); color: var(--text-primary);
}
.soul-detail-role {
  font: 400 14px var(--font-body); color: var(--text-tertiary);
  margin: 2px 0 8px;
}
/* 체크리스트 */
.skill-checklist { list-style: none; padding: 0; margin: 0; }
.skill-checklist li {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 0; font: 400 14px var(--font-body);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}
.skill-checklist li:last-child { border-bottom: none; }
.skill-check { width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; }
.skill-check.checked {
  background: rgba(59,130,246,0.15); border: 1.5px solid var(--brand-blue);
  color: var(--brand-blue); display: flex; align-items: center; justify-content: center;
}
.skill-check.unchecked {
  background: transparent; border: 1.5px solid var(--border-subtle);
}
/* CTA 버튼 */
.hire-actions {
  display: flex; gap: 10px; margin-top: 24px;
}
.btn-chat {
  flex: 1; padding: 12px;
  background: transparent; border: 1px solid var(--glass-border);
  border-radius: 10px; color: var(--text-secondary);
  font: 500 14px var(--font-ui); cursor: pointer;
  transition: all 0.15s;
}
.btn-chat:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
.btn-hire {
  flex: 2; padding: 12px 20px;
  background: var(--brand-blue);
  border: none; border-radius: 10px;
  color: white; font: 600 14px var(--font-ui); cursor: pointer;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
  transition: all 0.15s;
}
.btn-hire:hover { background: #2563EB; box-shadow: 0 4px 24px rgba(59,130,246,0.5); }
.btn-hire:disabled { background: var(--border-subtle); color: var(--text-tertiary);
  box-shadow: none; cursor: not-allowed; }
```

---

## 3. 레이더 차트 패널 (우측)

**6축 역량 지표:**
```
축: 분석력(Analysis) / 판단력(Judgment) / 조사력(Research)
    작성력(Writing) / 안정성(Reliability) / 모니터링(Monitoring)
```

**Chart.js Radar 설정:**
```tsx
import { Radar } from 'react-chartjs-2';

const radarData = (soul: Soul) => ({
  labels: ['분석력', '판단력', '조사력', '작성력', '안정성', '모니터링'],
  datasets: [{
    label: soul.name,
    data: soul.radar_scores, // [85, 90, 70, 75, 95, 80]
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: '#3B82F6',
    borderWidth: 2,
    pointBackgroundColor: '#00D4FF',
    pointBorderColor: 'transparent',
    pointRadius: 4,
    pointHoverRadius: 6,
  }],
});

const radarOptions = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    r: {
      min: 0, max: 100,
      ticks: { display: false },
      grid: { color: 'rgba(255,255,255,0.06)' },
      angleLines: { color: 'rgba(255,255,255,0.08)' },
      pointLabels: {
        color: 'rgba(255,255,255,0.6)',
        font: { size: 12, family: 'Inter' },
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(13,17,32,0.9)',
      borderColor: 'rgba(59,130,246,0.3)',
      borderWidth: 1,
      callbacks: {
        label: (ctx: any) => ` ${ctx.raw}점`,
      },
    },
  },
};

// 렌더링
<div className="radar-card glass-card">
  <h4 className="radar-title">역량 분석</h4>
  <Radar data={radarData(selectedSoul)} options={radarOptions} />
  <div className="radar-score-summary">
    <span>종합 점수</span>
    <span className="score-value">82<small>/100</small></span>
  </div>
</div>
```

**레이더 카드 CSS:**
```css
.radar-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 28px;
  display: flex; flex-direction: column; gap: 20px;
}
.radar-title {
  font: 600 16px var(--font-ui); color: var(--text-secondary);
  letter-spacing: 0.02em;
}
.radar-score-summary {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-top: 16px; border-top: 1px solid var(--border-subtle);
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
}
.score-value {
  font: 700 28px var(--font-ui); color: var(--brand-cyan);
}
.score-value small { font-size: 14px; color: var(--text-tertiary); }
```

---

## 4. 데이터 구조

```typescript
interface SoulStats {
  analysis: number;      // 분석력 0-100
  judgment: number;      // 판단력
  research: number;      // 조사력
  writing: number;       // 작성력
  reliability: number;   // 안정성
  monitoring: number;    // 모니터링
}

interface SoulCapability {
  label: string;         // "코드 리뷰 & 버그 수정"
  supported: boolean;    // true = ☑, false = ☐
}

interface SoulPreset {
  id: string;            // "alex-developer"
  name: string;          // "Alex"
  display_name: string;  // "Alex Chen"
  category: string;      // "Developer"
  experience: 'Junior' | 'Mid' | 'Senior' | 'Expert';
  greeting_message: string;
  thumbnail_url: string | null;
  skill_tags: string[];  // ["React", "TypeScript", ...]
  capabilities: SoulCapability[];
  stats: SoulStats;
  token_efficiency: 'Efficient' | 'Balanced' | 'Heavy';
  match_score?: number;  // 사용자별 매칭 점수
  hired_by_count: number;
  is_hired: boolean;     // 현재 사용자가 채용 여부
}
```

**API 응답 예시:**
```json
{
  "id": "alex-developer",
  "name": "Alex",
  "display_name": "Alex Chen",
  "category": "Developer",
  "experience": "Senior",
  "greeting_message": "안녕하세요! 풀스택 개발자 Alex입니다. 코드 리뷰부터 새 기능 구현까지 도와드려요. 🚀",
  "thumbnail_url": "/avatars/souls/soul_01_alex.webp",
  "skill_tags": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
  "capabilities": [
    { "label": "코드 리뷰 & 버그 수정", "supported": true },
    { "label": "REST API / GraphQL 설계", "supported": true },
    { "label": "데이터베이스 쿼리 최적화", "supported": true },
    { "label": "CI/CD 파이프라인 구축", "supported": true },
    { "label": "모바일 앱 개발", "supported": false }
  ],
  "stats": {
    "analysis": 88,
    "judgment": 92,
    "research": 75,
    "writing": 70,
    "reliability": 95,
    "monitoring": 82
  },
  "token_efficiency": "Efficient",
  "match_score": 94,
  "hired_by_count": 1240,
  "is_hired": false
}
```

---

## 5. 페이지 React 구조

```tsx
// pages/Hire.tsx
export function HirePage() {
  const [selectedSoul, setSelectedSoul] = useState<SoulPreset>(presets[0]);

  return (
    <div className="hire-page">
      {/* 헤더 */}
      <div className="hire-header">
        <h1>Find Your AI Soul</h1>
        <SearchBar />
        <FilterBar />
      </div>

      {/* 캐러셀 */}
      <div className="soul-carousel">
        {presets.map(soul => (
          <SoulCard
            key={soul.id}
            soul={soul}
            selected={soul.id === selectedSoul.id}
            onClick={() => setSelectedSoul(soul)}
          />
        ))}
      </div>

      {/* 상세 + 레이더 */}
      <div className="hire-detail-grid">
        <SoulDetailPanel soul={selectedSoul} />
        <SoulRadarPanel soul={selectedSoul} />
      </div>
    </div>
  );
}
```

**레이아웃 CSS:**
```css
.hire-page {
  max-width: 1280px; margin: 0 auto;
  padding: 32px 24px;
  display: flex; flex-direction: column; gap: 32px;
}
.hire-header {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.hire-header h1 {
  font: 700 28px var(--font-ui); color: var(--text-primary);
  flex: 1; margin: 0;
}
.hire-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .hire-detail-grid { grid-template-columns: 1fr; }
}
```

---

## 6. 애니메이션 — Soul 전환

```css
/* 상세 패널 카드 전환 */
.soul-detail-panel,
.radar-card {
  animation: panel-fade 0.2s ease;
}
@keyframes panel-fade {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .soul-detail-panel, .radar-card { animation: none; }
}
```

---

## 구현 우선순위

| 순서 | 항목 | 비고 |
|------|------|------|
| P0 | 캐러셀 + 카드 선택 상태 | 핵심 인터랙션 |
| P0 | 상세 프로필 패널 | 사진+이름+체크리스트+CTA |
| P0 | 채용하기 버튼 활성화 | 현재 disabled → 조건부 |
| P1 | 레이더 차트 | Chart.js radar |
| P1 | 매칭 점수 (match_score) | API에서 계산 |
| P2 | 검색/필터 | 역할/분야별 |
| P2 | 토큰 소비율 게이지 | 미니 프로그레스 바 |
