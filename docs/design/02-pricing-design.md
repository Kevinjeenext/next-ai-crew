# Pricing 페이지 UI/UX 디자인 — 5티어 요금제

> Day 3 Sprint | 2026-04-05 | Designer: Ivy

---

## 1. 요금제 티어 구조

### 레이아웃: 5-Column Card Grid
- 데스크톱: 5열 (각 카드 동일 너비)
- 태블릿: 2+3 또는 스크롤
- 모바일: 세로 스택 (추천 티어 강조)

---

### 🆓 Starter (무료)
```
아이콘: 픽셀 캐릭터 1명 (solo)
컬러: crew-400 (뉴트럴)
가격: Free
서브: "혼자서 시작하기"

포함:
• AI 에이전트 1명
• 기본 오피스 (1룸)
• 일 50회 메시지
• 커뮤니티 지원
• 기본 캐릭터 스킨

CTA: "Start Free" (ghost button)
```

### 🚀 Pro
```
아이콘: 픽셀 캐릭터 3명 (small team)
컬러: crew-blue (#2563EB)
가격: $29/mo
서브: "소규모 팀 빌딩"

포함:
• AI 에이전트 5명
• 확장 오피스 (3룸)
• 일 500회 메시지
• 이메일 지원
• 커스텀 Soul 설정
• 기본 워크플로우 자동화
• 다크/라이트 테마

CTA: "Get Pro" (filled blue)
```

### ⭐ Team (추천)
```
아이콘: 픽셀 캐릭터 7명 (full team, 활기)
컬러: crew-cyan (#06B6D4) — 강조
가격: $79/mo
서브: "본격적인 AI 오피스"
배지: ⭐ MOST POPULAR (soul-gradient 배경)

포함:
• AI 에이전트 15명
• 풀 오피스 (10룸 + 회의실)
• 무제한 메시지
• 우선 지원
• 고급 Soul 커스터마이징
• 팀 협업 대시보드
• 워크플로우 빌더
• API 액세스
• 멀티 AI 프로바이더

CTA: "Start Team" (filled cyan, soul-glow)

카드 스타일: 약간 스케일업 (scale 1.03), soul-glow border
```

### 💼 Business
```
아이콘: 픽셀 캐릭터 15명 (busy office)
컬러: crew-indigo (#6366F1)
가격: $199/mo
서브: "스케일업을 위한 파워"

포함:
• AI 에이전트 50명
• 멀티 오피스 (무제한 룸)
• 무제한 메시지
• 전담 지원
• 어드민 콘솔
• SSO / 팀 관리
• 고급 분석 대시보드
• 커스텀 워크플로우
• 프라이빗 모델 연결
• SLA 99.9%

CTA: "Get Business" (filled indigo)
```

### 🏢 Enterprise
```
아이콘: 픽셀 빌딩 + 다수 캐릭터
컬러: soul-gradient (블루→시안→인디고)
가격: "Custom"
서브: "맞춤형 AI 조직"

포함:
• 무제한 에이전트
• 온프레미스 / 프라이빗 클라우드
• 전용 인프라
• 커스텀 AI 모델 학습
• 화이트 라벨링
• 전담 CSM
• 맞춤 SLA
• 보안 감사 리포트
• 24/7 프리미엄 지원

CTA: "Contact Sales" (gradient border, ghost)
```

---

## 2. UI 디자인 스펙

### Pricing Card 컴포넌트
```css
.pricing-card {
  background: var(--th-card-bg);
  border: 1px solid var(--th-card-border);
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

/* 추천 티어 강조 */
.pricing-card.recommended {
  border: 2px solid transparent;
  background-image: linear-gradient(var(--th-card-bg), var(--th-card-bg)),
                    linear-gradient(135deg, #2563EB, #06B6D4, #6366F1);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  transform: scale(1.03);
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.12);
}

/* 가격 표시 */
.price {
  font-family: "Space Grotesk", sans-serif;
  font-weight: 700;
  font-size: 42px;
  color: var(--th-text-heading);
}

.price-period {
  font-size: 14px;
  font-weight: 400;
  color: var(--th-text-muted);
}

/* MOST POPULAR 배지 */
.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #2563EB, #06B6D4);
  color: white;
  padding: 4px 16px;
  border-radius: 9999px;
  font-family: "Press Start 2P", monospace;
  font-size: 8px;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* 기능 리스트 */
.feature-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
  color: var(--th-text-secondary);
}

.feature-list li::before {
  content: "✓";
  color: #10B981;
  font-weight: 700;
  font-size: 12px;
}

/* CTA 버튼 */
.pricing-cta {
  width: 100%;
  padding: 12px 0;
  border-radius: 12px;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: center;
}

.pricing-cta.primary {
  background: var(--tier-color);
  color: white;
  border: none;
}

.pricing-cta.primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 20px rgba(var(--tier-color-rgb), 0.3);
}

.pricing-cta.ghost {
  background: transparent;
  color: var(--tier-color);
  border: 1.5px solid var(--tier-color);
}
```

### 토글: Monthly / Annual
```
┌──────────────────────┐
│ Monthly  ●──○ Annual │   ← 연간 선택 시 20% 할인 표시
│              Save 20% │   ← crew-emerald 텍스트
└──────────────────────┘
```

### 비교 테이블 (하단)
- "Compare all features" 토글로 펼치기/접기
- 가로 스크롤 가능한 비교표
- 체크/X 아이콘으로 기능 유무 표시
- 현재 티어 컬럼 하이라이트

### FAQ 섹션
- 아코디언 UI
- "Can I change plans?", "What AI models are supported?", "Is my data private?" 등

---

## 3. 반응형 브레이크포인트

| 화면 | 레이아웃 | 특이사항 |
|------|---------|---------|
| ≥1280px | 5열 카드 | 추천 티어 scale(1.03) |
| 1024-1279 | 3+2열 | 추천 티어 상단 |
| 768-1023 | 2열 + 스크롤 | 가격만 보이게 접기 |
| <768 | 1열 스택 | 추천 티어 first, 나머지 아코디언 |
