# Next AI Crew — 랜딩 페이지 리디자인 와이어프레임

> 2026-04-12 | Designer: Ivy | Kevin 지시
> 방향: Neon Dark + 글래스모피즘 + 가상 인물 사진 + 영어 우선
> 제거: 픽셀 아이콘, 게이미피케이션, 한/영 혼재, 정보 과밀

---

## 문제점 분석 (Kevin 캡처 기준)

| 문제 | 현재 | 개선 |
|------|------|------|
| 언어 혼재 | 한국어/영어 뒤섞임 | 영어 메인 + 한국어 서브텍스트 |
| 픽셀 아이콘 | 레트로 게임 스타일 | 원형 인물 사진 + 네온 glow |
| 게이미피케이션 | 레벨/태스크/경험치 뱃지 | 완전 제거 |
| 정보 과밀 | 섹션 너무 많음 | 5섹션으로 압축 |
| 아바타 | 이니셜/픽셀 | AI 생성 가상 인물 WebP |

---

## 페이지 구조 (5섹션)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (NAV)                                            │
├──────────────────────────────────────────────────────────┤
│  01. HERO                                                │
├──────────────────────────────────────────────────────────┤
│  02. FEATURE (3-col)                                     │
├──────────────────────────────────────────────────────────┤
│  03. SOUL TEAM SHOWCASE                                  │
├──────────────────────────────────────────────────────────┤
│  04. PRICING                                             │
├──────────────────────────────────────────────────────────┤
│  05. CTA + FOOTER                                        │
└──────────────────────────────────────────────────────────┘
```

---

## HEADER (Sticky Nav)

```
┌──────────────────────────────────────────────────────────┐
│  [LOGO] Next AI Crew          [Features] [Pricing] [Demo]│
│                                     [Log in] [Get Started]│
└──────────────────────────────────────────────────────────┘

배경: rgba(8,11,18,0.9) + backdrop-blur(20px)
보더: border-bottom: 1px solid rgba(59,130,246,0.1)
sticky top:0 z-index:100
```

**카피:**
- Logo: `Next AI Crew` (픽셀 워드마크 유지)
- Nav: Features / Pricing / Demo
- CTA 버튼: `Log in` (ghost) | `Get Started →` (primary blue glow)

---

## 01. HERO SECTION

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────── 좌측 (60%) ───────────────┐            │
│  │  [Badge] AI Agent Platform               │  ┌── 우측 ─┐│
│  │                                          │  │Soul    ││
│  │  Hire AI Colleagues.                     │  │Team    ││
│  │  <span>Not Tools.</span>                 │  │Preview ││
│  │                                          │  │(3명+N) ││
│  │  한국어: 당신의 AI 팀원을 고용하세요.         │  └────────┘│
│  │                                          │            │
│  │  [Get Started Free →] [Watch Demo ▶]    │            │
│  │                                          │            │
│  │  ─── 신뢰 지표 ───                        │            │
│  │  ⚡ 500+ Teams  ·  🌐 30+ Countries      │            │
│  │  ⭐ 4.9/5.0  ·  🔒 SOC 2 Ready          │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**CSS 스펙:**
```css
.hero {
  min-height: 100vh;
  background: var(--bg-base);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 120px 80px 80px;
  position: relative;
  overflow: hidden;
}
/* 배경 radial glow */
.hero::before {
  content: "";
  position: absolute;
  top: -20%; left: -10%;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
  pointer-events: none;
}
/* 우측 cyan glow */
.hero::after {
  content: "";
  position: absolute;
  bottom: -10%; right: -5%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%);
  pointer-events: none;
}
```

**카피:**
```
[뱃지] ✦ AI Agent Platform  (cyan 글로우 pill)

Hire AI Colleagues.
Not Tools.           ← "Not Tools." = #00D4FF cyan

한국어: 당신의 AI 팀원을 채용하세요.
영어: Build your AI crew with real names,
     personalities, and expertise.

[Get Started Free →]   [Watch Demo ▶]
↑ primary blue glow    ↑ ghost border
```

**Hero 우측 — Soul Team Preview:**
```
┌─────────────────────────────┐
│  glass card (blur 20px)     │
│                             │
│  Your AI Team               │
│  ─────────────────          │
│  ● [Alex]  Online  Dev      │
│    "I can help with React"  │
│  ─────────────────          │
│  ● [Sophia] Idle  Design    │
│  ─────────────────          │
│  ● [Marcus] Online Security │
│  ─────────────────          │
│  +17 more Souls ›           │
│                             │
│  [Hire Your First Soul →]   │
└─────────────────────────────┘
```

```css
.hero-soul-preview {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.1);
}
.hero-soul-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border-subtle);
}
.hero-soul-item:last-child { border-bottom: none; }
.hero-soul-msg {
  font: 400 12px var(--font-ui);
  color: var(--text-tertiary);
  font-style: italic;
}
```

---

## 02. FEATURE SECTION (3-col)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Why teams choose Next AI Crew                          │
│  당신의 팀이 Next AI Crew를 선택하는 이유                    │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │  🧠 ICON   │  │  🤝 ICON   │  │  ⚡ ICON   │          │
│  │            │  │            │  │            │          │
│  │  Soul      │  │  Always    │  │  10x Faster│          │
│  │  Identity  │  │  Available │  │  Execution │          │
│  │            │  │            │  │            │          │
│  │  Each Soul │  │  Your crew │  │  Parallel  │          │
│  │  has a     │  │  works 24/7│  │  AI agents │          │
│  │  name,     │  │  no sick   │  │  complete  │          │
│  │  persona & │  │  days, no  │  │  tasks in  │          │
│  │  expertise │  │  overtime  │  │  minutes   │          │
│  │            │  │            │  │            │          │
│  │  [→]       │  │  [→]       │  │  [→]       │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**카피:**
```
섹션 타이틀:
EN: Why teams choose Next AI Crew
KO: 당신의 팀이 Next AI Crew를 선택하는 이유

Feature 1 — Soul Identity
아이콘: 뇌/인물 아이콘 (네온 blue)
EN: Each AI has a name, personality, and expertise
KO: 이름, 성격, 전문성을 가진 나만의 AI 동료

Feature 2 — Always Available
아이콘: 시계/24 아이콘 (네온 cyan)
EN: Your crew works 24/7. No sick days, no overtime complaints.
KO: 아픈 날도, 야근 불만도 없는 24/7 팀원

Feature 3 — 10x Faster Execution
아이콘: 번개 아이콘 (네온 green)
EN: Parallel AI agents complete tasks in minutes, not days.
KO: 병렬 AI 에이전트로 몇 분 안에 완료
```

**Feature 카드 CSS:**
```css
.feature-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 32px 28px;
  position: relative; overflow: hidden;
}
.feature-card::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent);
}
.feature-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  font-size: 24px;
}
.feature-icon.blue   { background: rgba(59,130,246,0.15); box-shadow: 0 0 16px rgba(59,130,246,0.2); }
.feature-icon.cyan   { background: rgba(0,212,255,0.12);  box-shadow: 0 0 16px rgba(0,212,255,0.15); }
.feature-icon.green  { background: rgba(16,185,129,0.12); box-shadow: 0 0 16px rgba(16,185,129,0.15); }
.feature-title {
  font: 700 20px var(--font-ui); color: var(--text-primary);
  margin-bottom: 12px;
}
.feature-desc {
  font: 400 15px/1.6 var(--font-body); color: var(--text-secondary);
  margin-bottom: 16px;
}
.feature-desc-ko {
  font: 400 13px var(--font-body); color: var(--text-tertiary);
  margin-bottom: 20px;
}
.card-bottom-bar {
  height: 3px; margin: 0 -28px -32px;
  background: linear-gradient(90deg, var(--brand-blue), var(--brand-cyan));
  border-radius: 0 0 16px 16px;
  box-shadow: 0 0 8px rgba(59,130,246,0.4);
}
```

---

## 03. SOUL TEAM SHOWCASE

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Meet Your AI Crew                                       │
│  AI 동료들을 만나보세요                                      │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │[Alex]│  │[Maya]│  │[Mar] │  │[Yuna]│  │[Liam]│  ... │
│  │ Dev  │  │Design│  │Secur │  │  PM  │  │DevOps│      │
│  │●     │  │●     │  │●     │  │●     │  │●     │      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  Selected: Alex                                   │   │
│  │  ┌──────┐  Alex Chen  ·  Full-Stack Developer    │   │
│  │  │[Photo│  ────────────────────────────────────  │   │
│  │  │      │  "안녕하세요! 개발자 Alex입니다.          │   │
│  │  │      │   코드 리뷰, 디버깅, 새 기능 구현         │   │
│  │  │      │   어떤 것이든 도와드릴게요. 🚀"           │   │
│  │  └──────┘  ────────────────────────────────────  │   │
│  │  Skills: React  TypeScript  Node.js  +3          │   │
│  │                              [Hire Alex →]       │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│                    [Browse All 20 Souls →]               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**카피:**
```
섹션 타이틀:
EN: Meet Your AI Crew
KO: AI 동료들을 만나보세요

서브: 20 AI professionals, each with a unique name, personality, and expertise.
     이름, 성격, 전문성을 가진 20명의 AI 전문가.

선택된 Soul 카드:
- 이름 + 직책 (영문)
- 인사말 메시지 (한국어 — Soul의 개성 표현)
- 스킬 태그
- [Hire {name} →] CTA
```

**아바타 호버 효과:**
```css
.showcase-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  cursor: pointer; transition: all 0.2s;
  border: 2px solid transparent;
}
.showcase-avatar:hover,
.showcase-avatar.active {
  border-color: var(--brand-blue);
  box-shadow: 0 0 16px rgba(59,130,246,0.4);
  transform: translateY(-3px);
}
.showcase-detail-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 28px;
  animation: slide-up 0.2s ease;
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 04. PRICING SECTION

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Simple, Transparent Pricing                             │
│  투명한 요금제                                             │
│                                                          │
│  [Monthly] ● Annual  (토글 — Annual: 20% OFF)            │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Starter  │ │   Pro    │ │  Team ⭐  │ │Business  │   │
│  │          │ │          │ │(Most Pop)│ │          │   │
│  │  Free    │ │  $19/mo  │ │  $49/mo  │ │  $99/mo  │   │
│  │          │ │          │ │          │ │          │   │
│  │ 2 Souls  │ │ 10 Souls │ │ 25 Souls │ │Unlimited │   │
│  │ 50K tok  │ │500K tok  │ │  2M tok  │ │  10M tok │   │
│  │          │ │          │ │          │ │          │   │
│  │[Start →] │ │[Start →] │ │[Start →] │ │[Start →] │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

기존 Pricing v3 (5티어) 그대로 유지 — Enterprise 별도 섹션 생략 가능.
Team 카드 강조: `border: 1px solid rgba(59,130,246,0.4)` + shimmer.

---

## 05. CTA + FOOTER

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│           Start building your AI crew today.            │
│           오늘 당신의 AI 팀을 구성하세요.                    │
│                                                          │
│              [Get Started Free →]                        │
│          No credit card required. Free forever.         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  © 2026 Next AI Crew  ·  Privacy  ·  Terms  ·  Contact  │
└──────────────────────────────────────────────────────────┘
```

**CTA 섹션 배경:**
```css
.cta-section {
  text-align: center; padding: 120px 80px;
  background: radial-gradient(ellipse 60% 40% at 50% 50%,
    rgba(59,130,246,0.1) 0%, transparent 70%);
}
.cta-title {
  font: 800 48px/1.1 var(--font-ui); color: var(--text-primary);
  margin-bottom: 8px;
}
.cta-title span { color: var(--brand-cyan); }
.cta-sub-ko {
  font: 400 18px var(--font-body); color: var(--text-tertiary);
  margin-bottom: 40px;
}
.cta-btn {
  font: 700 18px var(--font-ui); padding: 16px 40px;
  background: var(--brand-blue); color: white;
  border-radius: 12px; border: none; cursor: pointer;
  box-shadow: 0 0 32px rgba(59,130,246,0.4);
}
.cta-note {
  margin-top: 16px;
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
}
```

---

## 반응형 브레이크포인트

| 화면 | 변경 |
|------|------|
| ≥1280px | 풀 레이아웃 |
| 1024px | Hero 2col → 1col (Soul Preview 아래로) |
| 768px | Feature 3col → 1col 스택 |
| 375px | 패딩 축소, 폰트 크기 조정 |

---

## 구현 우선순위

| 순서 | 섹션 | 비고 |
|------|------|------|
| P0 | Header (Nav) | sticky + blur |
| P0 | Hero | 카피 + Soul Preview 카드 |
| P0 | Soul Showcase | 아바타 클릭 → 상세 |
| P1 | Feature 3-col | 글래스 카드 |
| P1 | Pricing | 기존 v3 재사용 |
| P2 | CTA + Footer | 간단 |

---

## 제거 항목 체크리스트

- [ ] 픽셀 아이콘/캐릭터 이미지
- [ ] 레벨업/경험치 뱃지
- [ ] 태스크 완료 카운터
- [ ] 부서 이모지 10개 행
- [ ] 오피스 미니맵
- [ ] 한국어 메인 타이틀 (서브텍스트로 유지)
- [ ] 게이지/프로그레스 게임 UI
