# 랜딩 히어로 카피 강화 + 에이전트 카드 인터랙션 디자인

> Day 3 Sprint | 2026-04-05 | Designer: Ivy

---

## 1. 히어로 섹션 카피

### Primary Hero (다크 배경)

```
헤드라인 (Space Grotesk 700, 48-64px):
"Your AI Crew, with Soul."

서브헤드 (Pretendard 400, 18-20px, crew-400):
"도구가 아닌 동료. 생각하고, 협력하고, 성장하는 AI 팀을 만나세요."

영문 서브 (Space Grotesk 400, 14px, crew-500):
"Meet the team that never sleeps. They think, they care, they deliver."

CTA 버튼:
[Primary] "Start Building Your Crew" → crew-blue bg, white text, soul-glow hover
[Secondary] "Watch Demo" → ghost button, crew-blue border
```

### Hero Visual
- 배경: 다크 (#0B1120) + 미세 그리드 패턴 (0.03 opacity)
- 중앙: isometric 픽셀 오피스 미니 프리뷰 (현재 오피스 뷰 축소판)
- 에이전트 캐릭터 3~5개가 걸어다니는 애니메이션
- Soul spark 파티클이 에이전트 위로 떠다니는 효과
- 하단: 부드러운 Soul Gradient 라인 디바이더

### Anti-Slop 섹션 (Hero 아래)

```
헤드라인: "반복은 AI에게. 결정은 당신에게."
서브: "코드 리뷰, 버그 수정, 배포, 보안 점검 — 
       AI Crew가 처리하는 동안, 당신은 비즈니스에 집중하세요."

3-column 카드:
[1] 🎯 "지시만 하세요" — 자연어로 업무 지시, AI가 이해하고 실행
[2] 🤝 "팀이 알아서" — 에이전트끼리 협업, 회의, 코드 리뷰
[3] ✅ "결과만 확인" — 완료 보고, 코드 PR, 배포까지 자동
```

### Social Proof 섹션

```
"Trusted by innovative teams worldwide"
- 로고 캐러셀 (향후 고객사 로고)
- 지금은 기술 스택 배지로 대체: Claude, Codex, Gemini, OpenCode...
- "10+ AI Models, One Crew" 태그라인
```

---

## 2. 에이전트 카드 인터랙션 디자인

### 기본 상태 (Default)
```css
.agent-card {
  background: var(--th-card-bg);        /* rgba(15, 23, 41, 0.65) */
  border: 1px solid var(--th-card-border); /* rgba(37, 99, 235, 0.1) */
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Hover 상태
```css
.agent-card:hover {
  background: var(--th-card-bg-hover);
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.1), 0 0 40px rgba(37, 99, 235, 0.05);
  transform: translateY(-2px);
}
```

### 카드 구조
```
┌─────────────────────────────────┐
│  [Avatar]  Name          [Status] │  ← 픽셀 아바타 + soul-pulse
│           Role            ●Online │  ← Press Start 2P, crew-cyan dot
│                                    │
│  ┌─ Skills ──────────────────┐   │
│  │ 🔧 React  🐍 Python  ...  │   │  ← 스킬 뱃지 (pill shape)
│  └───────────────────────────┘   │
│                                    │
│  Current Task: "API 리팩토링"      │  ← crew-400 text, truncate
│  ████████████░░  78%               │  ← 프로그레스 바, soul-gradient
│                                    │
│  ⚡ 12 tasks today  ⭐ Lv.42      │  ← Press Start 2P, 10px
└─────────────────────────────────┘
```

### Avatar 인터랙션
- **온라인**: soul-pulse 애니메이션 (3s 호흡) + soul-spark 골드 점
- **작업중**: 빠른 pulse (1.5s) + crew-cyan 글로우
- **오프라인**: grayscale + opacity 0.5, 펄스 없음
- **회의중**: crew-indigo 글로우 + 회의 아이콘 오버레이

### 카드 클릭 → 확장 패널
```
┌─────────────────────────────────────┐
│  [Avatar Large]                       │
│  Sophia — Senior Developer            │
│  "효율적인 코드를 작성하는 것이 제 Soul입니다" │  ← Soul 한 줄 소개
│                                       │
│  ── Stats ──                          │
│  Tasks: 847 completed | Success: 98%  │
│  Uptime: 2,400h | Level: 42          │
│                                       │
│  ── Recent Activity ──                │
│  • API 리팩토링 완료 (2h ago)          │
│  • 코드 리뷰 3건 (4h ago)             │
│  • 보안 패치 배포 (6h ago)             │
│                                       │
│  [💬 Message]  [📋 Assign Task]       │
└─────────────────────────────────────┘
```

---

## 3. 구현 CSS 스니펫

```css
/* Agent Card Interactions */
.agent-card {
  background: var(--th-card-bg);
  border: 1px solid var(--th-card-border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.agent-card:hover {
  background: var(--th-card-bg-hover);
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 
    0 0 20px rgba(6, 182, 212, 0.1),
    0 0 40px rgba(37, 99, 235, 0.05);
  transform: translateY(-2px);
}

.agent-card:active {
  transform: translateY(0);
}

/* Status indicators */
.status-online {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  animation: soul-spark 2s ease-in-out infinite;
}

.status-working {
  background: #06B6D4;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
  animation: soul-pulse 1.5s ease-in-out infinite;
}

.status-offline {
  background: #475569;
  box-shadow: none;
  animation: none;
}

/* Progress bar with soul gradient */
.task-progress {
  height: 6px;
  border-radius: 3px;
  background: var(--th-bg-secondary);
  overflow: hidden;
}

.task-progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #2563EB, #06B6D4);
  transition: width 0.5s ease;
}

/* Skill badges */
.skill-badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(37, 99, 235, 0.1);
  color: #94A3B8;
  border: 1px solid rgba(37, 99, 235, 0.15);
}

/* Level badge (pixel font) */
.level-badge {
  font-family: "Press Start 2P", monospace;
  font-size: 9px;
  color: #FBBF24;
}
```
