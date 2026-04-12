# Paperclip-Inspired UI 설계서

> 2026-04-13 | Designer: Ivy | Kevin 지시
> 참고: paperclip.ing (AI 에이전트 조직 운영 플랫폼)
> 테마: Neon Dark v2 + 글래스모피즘

---

## Paperclip 핵심 개념 분석

Paperclip = "회사처럼 AI를 운영하는 플랫폼"
- **Org Chart**: 계층형 조직도, Soul에게 상사/직책/역할 부여
- **Goal Alignment**: 미션 → 프로젝트 → 태스크 계층 추적
- **Heartbeats**: 에이전트 주기적 활성화 & 위임 흐름
- **Cost Control**: Soul별 월 예산 한도 설정 & 소비 모니터링
- **Ticket System**: 모든 대화/결정 추적, 도구 호출 감사 로그
- **Governance**: 사용자 = 이사회, 채용/전략 승인/종료 권한

**Next AI Crew 적용 포인트**: Soul이 동료를 넘어 실제 조직 멤버로 — 조직도, 목표, 예산, 티켓 시스템으로 경영 경험 제공

---

## 사이드바 메뉴 구조 추가

```
기존:
  LayoutDashboard   대시보드
  Store             채용
  MessageSquare     채팅

추가:
  ──────────────
  Network           조직도
  Target            목표/미션
  Wallet            예산 관리
  TicketCheck       태스크/티켓
  ──────────────
  Settings          설정
```

---

## 페이지 1 — 🏢 조직도 (Org Chart)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  조직도                    [+ Soul 추가] [📋 목록 뷰] [🌳 트리]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  필터: [전체 ▼] [부서 ▼] [상태: 활성 ▼]                      │
│                                                              │
│                     ┌──────────────┐                        │
│                     │  👤 CEO       │                        │
│                     │  Alex Chen   │                        │
│                     │  Engineering │                        │
│                     └──────┬───────┘                        │
│              ┌─────────────┼─────────────┐                  │
│              ▼             ▼             ▼                  │
│      ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│      │ CTO      │  │ CMO      │  │ COO      │             │
│      │ Sophia   │  │ Carlos   │  │ Amara    │             │
│      │ Design   │  │ Mktg     │  │ Ops      │             │
│      └────┬─────┘  └──────────┘  └──────────┘             │
│           ▼                                                  │
│    ┌──────────┐  ┌──────────┐                              │
│    │ 백엔드   │  │ 프론트   │                              │
│    │ Jin      │  │ Noah     │                              │
│    └──────────┘  └──────────┘                              │
│                                                              │
│  ── 팀 요약 ───────────────────────────────────────────     │
│  활성 Soul: 8명  /  오늘 처리 태스크: 142건  /  월 비용: ₩240K │
└──────────────────────────────────────────────────────────────┘
```

### 조직도 노드 카드

```
┌────────────────────────────────┐
│ [아바타 40px]  Alex Chen        │
│               CEO              │
│               Engineering      │
│  ● 온라인  /  오늘 28 tasks     │
│  [채팅]  [설정]  [점 3개 메뉴]  │
└────────────────────────────────┘
```

### CSS

```css
/* 트리 컨테이너 */
.org-tree {
  overflow: auto; padding: 32px;
  display: flex; flex-direction: column; align-items: center;
  gap: 0; position: relative;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle); border-radius: 16px;
  min-height: 400px;
}

/* 노드 카드 */
.org-node {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 12px 14px;
  min-width: 140px; text-align: center;
  cursor: pointer; position: relative;
  transition: all 0.2s;
  user-select: none;
}
.org-node:hover {
  border-color: rgba(59,130,246,0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.org-node.selected {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 1px var(--brand-blue), 0 8px 24px rgba(59,130,246,0.2);
}
.org-node::after {
  /* 하단 3px 포지션 바 */
  content: ""; position: absolute;
  bottom: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--brand-blue), var(--brand-cyan));
  border-radius: 0 0 14px 14px;
}

.org-node-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  margin: 0 auto 6px; object-fit: cover;
  border: 2px solid rgba(59,130,246,0.25);
}
.org-node-name  { font: 600 13px var(--font-ui); color: var(--text-primary); }
.org-node-title { font: 400 11px var(--font-ui); color: var(--brand-cyan); margin: 2px 0; }
.org-node-dept  { font: 400 11px var(--font-ui); color: var(--text-tertiary); }
.org-node-status {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  font: 400 10px var(--font-ui); color: var(--text-tertiary);
  margin-top: 6px;
}
.org-node-status .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22C55E; box-shadow: 0 0 5px #22C55E80;
}

/* 연결선 */
.org-connector {
  width: 2px; height: 24px;
  background: linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(59,130,246,0.1));
  margin: 0 auto;
}
.org-connector-h {
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(59,130,246,0.3), transparent);
}

/* 레벨 행 */
.org-level {
  display: flex; gap: 20px; align-items: flex-start;
  justify-content: center;
}
```

### 데이터 구조

```typescript
interface OrgNode {
  soul_id: string;
  title: string;          // 'CEO' | 'CTO' | 'Engineer'
  department: string;
  parent_soul_id?: string;
  level: number;          // 0=CEO, 1=C-level, 2=...
  reports_to?: string;    // 상사 soul_id
  direct_reports: string[]; // 부하 soul_id[]
  task_count_today: number;
  is_active: boolean;
}

interface OrgChart {
  company_id: string;
  nodes: OrgNode[];
  root_soul_id: string;
}
```

---

## 페이지 2 — 🎯 목표/미션 (Goals & Mission)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  목표 & 미션                              [+ 새 목표]          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 회사 미션 ────────────────────────────────────────────   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🏆 AI 인력으로 소상공인 노동 비용 50% 절감          │   │
│  │  2026 연간 목표  /  기간: 2026.01 ~ 2026.12         │   │
│  │  ████████████░░░░░░░░  58% 달성                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── 프로젝트 ─────────────────────────────────────────────   │
│  ┌──────────────────────────────────────┐  ┌────────────┐   │
│  │ 🎯 Soul 마켓 100종 출시              │  │  진행 중   │   │
│  │ 담당: Marketing → Carlos            │  │  72%       │   │
│  │ 마감: 2026-04-30  /  태스크 12/17   │  │ ████████░  │   │
│  │ [태스크 보기] [Soul 배정]            │  │            │   │
│  └──────────────────────────────────────┘  └────────────┘   │
│  ┌──────────────────────────────────────┐  ┌────────────┐   │
│  │ 🎯 카카오 주문 시스템 런칭           │  │  진행 중   │   │
│  │ 담당: Engineering → Alex            │  │  45%       │   │
│  │ 마감: 2026-04-08  /  태스크 5/11    │  │ █████░░░░  │   │
│  └──────────────────────────────────────┘  └────────────┘   │
│                                                              │
│  ── 태스크 상세 (프로젝트 선택 시) ──────────────────────    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ● Soul 프리셋 데이터 21~31 등록     ✅ 완료          │   │
│  │  ● 아바타 WebP 11종 생성             ✅ 완료          │   │
│  │  ● 카테고리 필터 7개 추가            🔄 진행 중       │   │
│  │  ● 레이더 차트 데이터 연동           ⏳ 대기          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### CSS

```css
/* 미션 배너 */
.mission-banner {
  background: linear-gradient(135deg,
    rgba(59,130,246,0.1) 0%,
    rgba(0,212,255,0.06) 100%);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 16px; padding: 20px 24px;
  position: relative; overflow: hidden;
}
.mission-banner::before {
  content: ""; position: absolute;
  top: -40px; right: -40px;
  width: 120px; height: 120px;
  background: radial-gradient(circle, rgba(0,212,255,0.08), transparent 70%);
  border-radius: 50%;
}
.mission-title {
  font: 700 18px var(--font-ui); color: var(--text-primary);
  margin-bottom: 6px;
}
.mission-meta {
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 14px;
}

/* 진행률 바 */
.progress-bar {
  height: 6px; background: var(--bg-overlay);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--brand-blue), var(--brand-cyan));
  transition: width 0.5s ease;
}
.progress-label {
  font: 600 12px var(--font-ui); color: var(--brand-cyan);
  margin-top: 4px; text-align: right;
}

/* 프로젝트 카드 */
.goal-project-card {
  display: grid; grid-template-columns: 1fr auto;
  gap: 12px; align-items: center;
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 12px;
  padding: 16px 18px;
  transition: all 0.15s;
}
.goal-project-card:hover { border-color: rgba(59,130,246,0.3); }
.goal-project-name {
  font: 600 15px var(--font-ui); color: var(--text-primary);
  margin-bottom: 4px;
}
.goal-project-meta {
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
}

/* 태스크 상태 */
.task-status { display: flex; align-items: center; gap: 6px; padding: 6px 0; }
.task-status-icon { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
.task-status-icon.done     { background: #22C55E; }
.task-status-icon.progress { background: var(--brand-blue); animation: pulse-blue 2s infinite; }
.task-status-icon.pending  { background: var(--border-subtle); }
@keyframes pulse-blue {
  0%,100% { box-shadow: 0 0 4px rgba(59,130,246,0.4); }
  50%     { box-shadow: 0 0 10px rgba(59,130,246,0.7); }
}
```

### 데이터 구조

```typescript
interface Mission {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  progress: number;       // 0-100
}

interface Project {
  id: string;
  mission_id: string;
  title: string;
  assigned_soul_id: string;
  deadline: string;
  task_total: number;
  task_done: number;
  status: 'active' | 'completed' | 'paused';
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  assigned_soul_id?: string;
  status: 'done' | 'in_progress' | 'pending' | 'blocked';
  created_at: string;
  updated_at: string;
}
```

---

## 페이지 3 — 💰 예산 관리 (Budget)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  예산 관리                      [이번 달: 2026년 4월 ▼]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 월간 요약 KPI ─────────────────────────────────────────  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │ 총 예산    │  │ 사용액     │  │ 남은 예산  │  │Soul 수 │ │
│  │ ₩500,000   │  │ ₩240,000   │  │ ₩260,000   │  │ 8명    │ │
│  │ 이번 달    │  │ 48% 사용   │  │ 52% 남음   │  │ 활성   │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────┘ │
│                                                              │
│  ── Soul별 예산 현황 ────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [아바타] Alex        Engineering    ₩40,000 / ₩80,000  │ │
│  │                      ████████████░░░░░  50%            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [아바타] Sophia      Design         ₩35,000 / ₩60,000  │ │
│  │                      ████████████████░  58%            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [아바타] Carlos      Marketing      ₩28,000 / ₩40,000  │ │
│  │                      ██████████████████  70% ⚠️         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ── 비용 추이 차트 (선 그래프) ──────────────────────────── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ₩50K ─────────────────────────────────────────────  │   │
│  │  ₩40K ─────────╮──────────────────────────────────   │   │
│  │  ₩30K ─────────╯─────────╮────────────────────────   │   │
│  │  ₩20K ───────────────────╯────────────────────────   │   │
│  │        4/1  4/3  4/5  4/7  4/9  4/11 4/13           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### CSS

```css
/* 예산 KPI 그리드 */
.budget-kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
@media (max-width: 768px) { .budget-kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.budget-kpi-card {
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 12px;
  padding: 16px;
}
.budget-kpi-label { font: 400 12px var(--font-ui); color: var(--text-tertiary); }
.budget-kpi-value { font: 700 22px var(--font-ui); color: var(--text-primary); margin: 4px 0; }
.budget-kpi-sub   { font: 400 12px var(--font-ui); color: var(--text-secondary); }

/* Soul 예산 행 */
.budget-soul-list { display: flex; flex-direction: column; gap: 0; }
.budget-soul-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.1s;
}
.budget-soul-row:hover { background: rgba(255,255,255,0.02); }
.budget-soul-info { flex: 1; }
.budget-soul-name { font: 500 14px var(--font-ui); color: var(--text-primary); }
.budget-soul-dept { font: 400 12px var(--font-ui); color: var(--text-tertiary); }
.budget-soul-bar-wrap { width: 180px; }
.budget-soul-bar-label {
  display: flex; justify-content: space-between;
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 4px;
}
.budget-bar {
  height: 6px; background: var(--bg-overlay); border-radius: 3px; overflow: hidden;
}
.budget-bar-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--brand-blue), var(--brand-cyan));
  transition: width 0.4s;
}
.budget-bar-fill.warning {
  background: linear-gradient(90deg, #F59E0B, #EF4444);
}
.budget-bar-fill.critical { background: #EF4444; }

/* 경고 뱃지 */
.budget-warn-badge {
  padding: 2px 7px; border-radius: 20px;
  background: rgba(239,68,68,0.1); color: #EF4444;
  font: 600 11px var(--font-ui);
}
```

### 데이터 구조

```typescript
interface SoulBudget {
  soul_id: string;
  soul_name: string;
  soul_avatar?: string;
  department: string;
  budget_limit: number;   // 월 한도 (원)
  budget_used: number;    // 사용액
  budget_pct: number;     // 사용률 0-100
  alert_threshold: number; // 경고 기준 (기본 80%)
}

interface BudgetSummary {
  month: string;          // '2026-04'
  total_budget: number;
  total_used: number;
  active_souls: number;
  soul_budgets: SoulBudget[];
}

interface BudgetTrend {
  date: string;           // '2026-04-01'
  amount: number;
}
```

---

## 페이지 4 — 📋 태스크/티켓 (Tasks & Tickets)

### 레이아웃 — 듀얼 뷰 (칸반 / 리스트 토글)

```
┌──────────────────────────────────────────────────────────────┐
│  태스크 & 티켓    [🔍 검색]  [Soul ▼]  [┣ 칸반]  [☰ 리스트]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 칸반 뷰 ─────────────────────────────────────────────   │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │  ⏳ 대기   │ │  🔄 진행중 │ │  👀 검토중 │ │  ✅ 완료 │ │
│  │  (3)       │ │  (5)       │ │  (2)       │ │  (12)    │ │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├──────────┤ │
│  │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │          │ │
│  │ │ 카카오 │ │ │ │ Soul   │ │ │ │ 레이더 │ │ │ ...      │ │
│  │ │ UX설계 │ │ │ │ 마켓   │ │ │ │ 차트   │ │ │          │ │
│  │ │ Alex   │ │ │ │ Carlos │ │ │ │ QA     │ │ │          │ │
│  │ │ 4/8    │ │ │ │ 4/15   │ │ │ │ Ivy    │ │ │          │ │
│  │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │          │ │
│  │ [+ 추가]   │ │ [+ 추가]   │ │ [+ 추가]   │ │          │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│                                                              │
│  ── 리스트 뷰 ───────────────────────────────────────────   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #  제목              Soul     상태      마감    우선순위 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ 001 카카오 UX 설계   Alex     🔄 진행  4/8   🔴 긴급   │ │
│  │ 002 Soul 마켓 확장   Carlos   🔄 진행  4/15  🟡 보통   │ │
│  │ 003 레이더 차트 QA   Ivy      👀 검토  4/12  🟢 낮음   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 칸반 카드 CSS

```css
/* 칸반 보드 */
.kanban-board {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  overflow-x: auto; padding-bottom: 8px;
}
@media (max-width: 768px) {
  .kanban-board { grid-template-columns: repeat(2, 1fr); }
}

.kanban-column {
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 12px;
  min-height: 300px; display: flex; flex-direction: column; gap: 8px;
}
.kanban-column-header {
  display: flex; align-items: center; gap: 6px;
  font: 600 13px var(--font-ui); color: var(--text-secondary);
  padding-bottom: 10px; border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 4px;
}
.kanban-count {
  background: var(--bg-overlay); color: var(--text-tertiary);
  padding: 1px 6px; border-radius: 10px;
  font: 400 11px var(--font-ui); margin-left: auto;
}

/* 태스크 카드 */
.task-card {
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 10px;
  padding: 12px; cursor: grab;
  transition: all 0.15s;
  position: relative; overflow: hidden;
}
.task-card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
}
.task-card.priority-urgent::before  { background: #EF4444; }
.task-card.priority-normal::before  { background: #F59E0B; }
.task-card.priority-low::before     { background: #22C55E; }
.task-card:hover {
  border-color: rgba(59,130,246,0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.task-card:active { cursor: grabbing; transform: scale(0.98); }

.task-card-title {
  font: 500 13px var(--font-ui); color: var(--text-primary);
  margin-bottom: 8px; line-height: 1.4;
}
.task-card-meta {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.task-soul-chip {
  display: flex; align-items: center; gap: 4px;
  background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
  padding: 2px 7px; border-radius: 20px;
  font: 400 11px var(--font-ui); color: var(--text-secondary);
}
.task-soul-chip img { width: 14px; height: 14px; border-radius: 50%; }
.task-deadline {  font: 400 11px var(--font-ui); color: var(--text-tertiary);
  margin-left: auto;
}
.task-deadline.overdue { color: #EF4444; }

/* 리스트 뷰 테이블 */
.task-table { width: 100%; border-collapse: collapse; }
.task-table th {
  font: 500 12px var(--font-ui); color: var(--text-tertiary);
  text-align: left; padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.task-table td {
  font: 400 13px var(--font-ui); color: var(--text-primary);
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  vertical-align: middle;
}
.task-table tr:hover td { background: rgba(255,255,255,0.02); }

/* 상태 뱃지 */
.ticket-status {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 20px;
  font: 500 11px var(--font-ui);
}
.ticket-status.pending  { background: rgba(255,255,255,0.05); color: var(--text-tertiary); }
.ticket-status.progress { background: rgba(59,130,246,0.1);   color: var(--brand-blue); }
.ticket-status.review   { background: rgba(250,204,21,0.1);   color: #FBBF24; }
.ticket-status.done     { background: rgba(34,197,94,0.1);    color: #22C55E; }

/* 우선순위 */
.priority-dot {
  width: 8px; height: 8px; border-radius: 50%; display: inline-block;
}
.priority-dot.urgent { background: #EF4444; }
.priority-dot.normal { background: #F59E0B; }
.priority-dot.low    { background: #22C55E; }
```

### 데이터 구조

```typescript
type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'blocked';
type Priority   = 'urgent' | 'normal' | 'low';

interface Ticket {
  id: string;               // '#001'
  title: string;
  description?: string;
  project_id?: string;
  assigned_soul_id?: string;
  assigned_soul_name?: string;
  assigned_soul_avatar?: string;
  status: TaskStatus;
  priority: Priority;
  deadline?: string;
  created_at: string;
  updated_at: string;
  tool_call_log?: ToolCallLog[];
}

interface ToolCallLog {
  timestamp: string;
  tool: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
}
```

---

## 사이드바 메뉴 Lucide 매핑

```typescript
// AppShell.tsx — 사이드바 메뉴 추가
const NAV_ITEMS = [
  { path: '/dashboard',          icon: LayoutDashboard, label: '대시보드' },
  { path: '/hire',               icon: Store,           label: '채용' },
  { path: '/chat',               icon: MessageSquare,   label: '채팅' },
  // ─── 신규 ───
  { path: '/org',                icon: Network,         label: '조직도' },
  { path: '/goals',              icon: Target,          label: '목표' },
  { path: '/budget',             icon: Wallet,          label: '예산' },
  { path: '/tasks',              icon: TicketCheck,     label: '태스크' },
  // ────────────
  { path: '/settings',           icon: Settings,        label: '설정' },
];
```

Lucide 아이콘 추가 import:
```ts
import { Network, Target, Wallet, TicketCheck } from 'lucide-react';
```

---

## React 라우트 추가

```tsx
// App.tsx
<Route path="/org"     element={<ProtectedRoute><OrgChartPage /></ProtectedRoute>} />
<Route path="/goals"   element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
<Route path="/budget"  element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
<Route path="/tasks"   element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
```

---

## 구현 우선순위

| 순서 | 페이지 | 이유 |
|------|--------|------|
| P0 | 조직도 트리 (정적) | Kevin 핵심 비전 — Soul=조직 멤버 |
| P0 | 태스크 칸반 기본 | 운영 관리 핵심 |
| P1 | 목표/미션 계층 | 전략 방향성 |
| P1 | 예산 대시보드 | Cost control (Paperclip 핵심 기능) |
| P2 | 조직도 — 드래그 리오더 | 복잡도 높음 |
| P2 | 태스크 — 드래그앤드롭 칸반 | react-dnd 필요 |
| P2 | 예산 — 실시간 토큰 비용 연동 | API 연동 필요 |

---

## Paperclip vs Next AI Crew 차별화 포인트

| 기능 | Paperclip | Next AI Crew |
|------|-----------|--------------|
| 대상 | 글로벌 영어권 | **한국 소상공인/기업** |
| Soul 개성 | 일반 에이전트 | **가상 인물, 레이더 스탯, 인사말** |
| 채용 UX | 단순 설정 | **HR 채용 메타포, 체크리스트** |
| 조직도 | 기본 트리 | **Neon Dark + 애니메이션 연결선** |
| 모바일 | 지원 | **PWA + 반응형 우선** |
| 라이선스 | Open source | **SaaS (Pro/Enterprise)** |
