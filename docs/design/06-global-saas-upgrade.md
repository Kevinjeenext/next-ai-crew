# 글로벌 SaaS 품질 업그레이드 가이드

> 2026-04-12 | Designer: Ivy
> 기준: Notion / Linear / Vercel + ClawPoD 톤 (캡처 도착 시 보완)
> 목표: "상업화 수준의 심플+사용자 친화" — 노동환경을 바꾸는 서비스의 품격

---

## 핵심 원칙 비교

| | 현재 Next AI Crew | 글로벌 SaaS 기준 | 액션 |
|--|----------------|----------------|------|
| 여백 | 카드 padding 24px | 32~40px | +8~16px 확대 |
| 색상 사용 | 강조 빈도 높음 (cyan glow 많음) | 포인트 컬러 10% 이하 | glow 줄이고 hover만 |
| 타이포그래피 | 폰트 4종 혼용 | 2종 최대 (display+body) | Press Start 2P → 아이덴티티 포인트에만 |
| 카드 경계 | 1px border 상시 | border 최소화, 그림자 활용 | subtle shadow 우선 |
| CTA | gradient 버튼 다수 | 주 CTA 1개, 나머지 ghost | 화면당 gradient 1개 |
| 애니메이션 | transition 다수 | 의미 있는 1가지 | hover 단순화 |

---

## 1. 여백 시스템 업그레이드

### 현재 → 목표

```css
/* 현재 */
.soul-hire-card { padding: 24px; }
.soul-hire-grid { gap: 20px; }

/* 목표 (Linear 수준) */
.soul-hire-card { padding: 28px 32px; }
.soul-hire-grid { gap: 24px; }

/* 섹션 여백 */
.soul-hire-section {
  padding: 64px 32px;  /* 현재 48px → 64px */
  max-width: 1160px;   /* 현재 1200px → 약간 좁게, 더 집중된 느낌 */
}
```

### 내부 컴포넌트 여백 조정
```css
/* 카드 헤더 → 컨텐츠 간격 */
.soul-card-header   { margin-bottom: 16px; }  /* 12px → 16px */
.soul-quote         { margin: 12px 0 16px; }  /* 4→12, 12→16 */
.soul-skills        { margin-bottom: 16px; }  /* 12px → 16px */

/* 구분선 제거 → 여백으로 대체 */
.soul-quote {
  border-top: none;
  border-bottom: none;
  padding: 0;
  margin: 14px 0;
  color: var(--th-text-muted);
}
```

---

## 2. 색상 절제 — Vercel/Linear 스타일

### 기본 상태: 거의 무채색

```css
/* 현재: 기본 카드에도 컬러 많음 */
/* 목표: 기본은 완전 뉴트럴, 인터랙션 시에만 컬러 */

.soul-hire-card {
  background: var(--th-card-bg);
  border: 1px solid rgba(255,255,255,0.06);  /* 더 subtle */
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);     /* 그림자 추가 */
  border-radius: 14px;
}

/* hover: 컬러 딱 1가지 */
.soul-hire-card:hover {
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  transform: translateY(-2px);  /* -4px → -2px로 축소 */
  /* soul-glow 제거 — 너무 화려함 */
}

/* 채용됨: 골드 대신 subtle accent */
.soul-hire-card.hired {
  border-color: rgba(251,191,36,0.3);  /* 진한 골드 → subtle */
  box-shadow: 0 0 0 1px rgba(251,191,36,0.15);
}
```

### 포인트 컬러 사용 규칙 (화면당)

| 요소 | 사용 | 이유 |
|------|------|------|
| 주 CTA 버튼 1개 | crew-gradient | 행동 유도 |
| Soul 레벨 숫자 | Soul Warm #FBBF24 | 아이덴티티 |
| 채용됨 상태 | #FBBF24 subtle | 피드백 |
| hover border | rgba(255,255,255,0.12) | 뉴트럴 |
| 나머지 전부 | 회색 계열 | 절제 |

---

## 3. 타이포그래피 계층 단순화

### 2종 원칙 (Linear 방식)

```css
/* Primary: Space Grotesk — UI 텍스트 전용 */
/* Secondary: Pretendard — 본문 전용 */
/* Press Start 2P — Soul 이름 딱 하나 (아이덴티티 포인트) */
/* JetBrains Mono — 코드/토큰 수치 전용 */

/* 타이포 스케일 (4단계) */
--type-display: 700 28px/1.2 "Space Grotesk";   /* 페이지 타이틀 */
--type-heading: 600 18px/1.4 "Space Grotesk";   /* 카드 섹션 헤더 */
--type-body:    400 14px/1.6 "Pretendard";       /* 본문 */
--type-caption: 400 12px/1.5 "Pretendard";      /* 보조 텍스트 */
```

### 현재 → 목표 적용

```css
/* Soul 직군 */
.soul-role {
  font: 500 13px/1.4 "Space Grotesk", sans-serif;  /* 현재 12px */
  color: var(--th-text-muted);
  letter-spacing: 0;  /* 현재 없음 */
}

/* Soul 한 줄 소개 */
.soul-quote {
  font: 400 13px/1.7 "Pretendard", sans-serif;  /* line-height 1.6→1.7 */
  color: var(--th-text-muted);
  /* font-style: italic 제거 — Linear처럼 일반 텍스트로 */
}

/* 스킬 태그 */
.soul-skill-tag {
  font: 500 11px/1 "Space Grotesk", sans-serif;  /* JetBrains → Space Grotesk */
  /* 코드 스택이 아닌 스킬이므로 Space Grotesk가 더 자연스러움 */
}

/* 섹션 필터 탭 */
.soul-filter-tab {
  font: 500 13px/1 "Space Grotesk", sans-serif;
  letter-spacing: 0;  /* uppercase 제거 */
}
```

---

## 4. 버튼 시스템 단순화 (Vercel 원칙)

### 화면당 gradient CTA 1개 원칙

```css
/* Primary CTA (채용하기, 플랜 시작하기) */
.btn-primary {
  background: #2563EB;  /* gradient 제거 → 단색 */
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font: 600 14px/1 "Space Grotesk";
  border: none;
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary:hover {
  background: #1D4ED8;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.25);
}

/* Secondary (프로필 더 보기, 나중에) */
.btn-secondary {
  background: transparent;
  color: var(--th-text-body);
  padding: 10px 20px;
  border-radius: 8px;
  font: 500 14px/1 "Space Grotesk";
  border: 1px solid rgba(255,255,255,0.1);
  transition: border-color 0.15s, background 0.15s;
}
.btn-secondary:hover {
  border-color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.04);
}

/* Danger/경고 */
.btn-danger {
  background: transparent;
  color: #F43F5E;
  border: 1px solid rgba(244,63,94,0.3);
  padding: 10px 20px;
  border-radius: 8px;
  font: 500 14px/1 "Space Grotesk";
}
```

### gradient 유지 예외 (딱 2곳)
1. **히어로 섹션 주 CTA** — 랜딩페이지 첫 번째 버튼
2. **Team 플랜 추천 카드** — 가장 중요한 전환 포인트

---

## 5. 카드 디자인 — Notion 수준 depth

```css
/* 기존: border 강조 → 목표: depth (그림자) 강조 */

/* 기본 카드 */
.soul-hire-card {
  background: var(--th-card-bg);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.15),
    0 2px 8px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s, transform 0.2s;
}

.soul-hire-card:hover {
  border-color: rgba(255,255,255,0.10);
  box-shadow:
    0 4px 12px rgba(0,0,0,0.2),
    0 8px 32px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

/* 부서 컬러 밴드 → 더 subtle */
.soul-hire-card::before {
  height: 2px;  /* 3px → 2px */
  opacity: 0.7; /* 약간 투명 */
}
```

---

## 6. 상태/피드백 시스템 — 의미 있는 색상만

### 토큰 게이지 색상 단순화

```css
/* 현재: 5단계 그라디언트 → 목표: 3단계 명확한 신호 */

.token-bar-fill[data-usage="normal"]   { background: #2563EB; }        /* 파랑 = 정상 */
.token-bar-fill[data-usage="caution"]  { background: #F59E0B; }        /* 노랑 = 주의 */
.token-bar-fill[data-usage="warning"]  { background: #F59E0B; }        /* (caution과 통합) */
.token-bar-fill[data-usage="danger"]   { background: #EF4444; }        /* 빨강 = 위험 */
.token-bar-fill[data-usage="exceeded"] { background: #EF4444; animation: danger-blink 1s infinite; }
```

### 상태 뱃지 (가이드 통일)

```css
/* Notion 스타일 뱃지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 5px;
  font: 500 12px/1 "Space Grotesk";
}
.status-badge.normal  { background: rgba(37,99,235,0.12);  color: #93BBFC; }
.status-badge.caution { background: rgba(245,158,11,0.12); color: #FCD34D; }
.status-badge.danger  { background: rgba(239,68,68,0.12);  color: #FCA5A5; }
.status-badge.success { background: rgba(16,185,129,0.12); color: #6EE7B7; }
```

---

## 7. 인터랙션 밀도 감소

### 제거 or 축소
- ~~soul-glow cyan glow 기본 상태~~ → hover에만
- ~~translateY(-4px)~~ → -2px로 축소
- ~~`will-change: transform` 남용~~ → 애니메이션 요소만
- ~~여러 색상 동시 glow~~ → 단색 border 강조

### 유지 (의미 있는 것만)
- 입사 환영 soul-spark 파티클 (감정적 순간)
- 레벨업 burst 애니메이션 (성취 순간)
- 토큰 danger-blink (긴급 경고)
- 채용 카드 is-new 펄스 (신규 배치 피드백)

---

## 8. 종합 적용 우선순위

| 우선순위 | 변경 항목 | 영향 범위 | 난이도 |
|---------|---------|---------|------|
| P0 | 카드 padding 24→28~32px | 전체 | Easy |
| P0 | hover: -4px→-2px, glow 제거 | 전체 | Easy |
| P0 | 기본 border opacity 낮추기 | 전체 | Easy |
| P0 | btn-primary: gradient→단색 | 전체 | Easy |
| P1 | 타이포 scale 4단계 통일 | 전체 | Medium |
| P1 | soul-quote italic 제거 | hire 페이지 | Easy |
| P1 | 토큰 게이지 3단계 단순화 | billing | Easy |
| P2 | 카드 depth (shadow) 강조 | 전체 | Easy |
| P2 | 스킬 태그 폰트 변경 | hire 페이지 | Easy |

---

## 9. ClawPoD 캡처 도착 시 추가 분석 예정

- ClawPoD 고유 레이아웃 패턴
- 네비게이션/사이드바 구조
- 데이터 테이블/리스트 스타일
- 색상 팔레트 실제 사용 비율
- 빈 상태(empty state) 처리 방식

캡처 공유해 주시면 위 항목 즉시 분석 후 이 문서에 통합하겠습니다.
