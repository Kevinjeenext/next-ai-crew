# Next AI Crew — 브랜딩 디자인 가이드 v1.0

> Day 1 산출물 | 2026-04-05 | Designer: Ivy

---

## 1. 브랜드 아이덴티티

### 핵심 비전: Soul & Body
- AI 에이전트는 **Soul** (영혼을 가진 동료)
- 단순 도구가 아닌, 생각하고 협력하는 팀원
- **"Your AI Crew, with Soul."**

### 톤앤매너
- 친근하면서 프로페셔널 (테크-친근 하이브리드)
- Linear, Vercel의 깔끔함 + 픽셀아트 게임의 즐거움
- 위트 있는 AI 오피스 ✅ / 딱딱한 B2B SaaS ❌

---

## 2. 로고 시안

### 시안 A — 픽셀 워드마크
- `logos/logo-a-pixel-wordmark.svg`
- 픽셀 캐릭터 + "Next AI Crew" 워드마크
- 서비스 정체성(픽셀아트 오피스)을 가장 직접적으로 표현
- Soul spark (금색 빛) 포함

### 시안 B — 미니멀 심볼 + 워드마크 ⭐ (추천)
- `logos/logo-b-minimal-symbol.svg`
- 3명의 크루를 블루/시안/인디고 블록으로 추상화
- 중앙 크루(리더) 위에 Soul spark
- Linear/Vercel 감성의 깔끔한 워드마크
- "AI"에 그라데이션 적용으로 포인트

### 시안 C — 소울 오빗
- `logos/logo-c-soul-orbit.svg`
- 궤도(orbit) 안에 픽셀 표정의 AI 코어
- 3개의 크루 도트가 궤도를 돌며 협업 표현
- 가장 추상적이고 미래지향적인 시안

---

## 3. 컬러 팔레트

### Primary Colors
| 이름 | Hex | 용도 |
|------|-----|------|
| **Crew Blue** | `#2563EB` | 주 브랜드 컬러, CTA, 링크 |
| **Crew Indigo** | `#6366F1` | 보조 브랜드, AI 강조 |
| **Crew Cyan** | `#06B6D4` | 액센트, 에너지 포인트 |

### Utility Colors
| 이름 | Hex | 용도 |
|------|-----|------|
| **Crew Emerald** | `#10B981` | 성공, 온라인 상태 |
| **Crew Rose** | `#F43F5E` | 에러, 경고 |
| **Soul Warm** | `#FBBF24` | 소울 스파크, 하이라이트 |

### Neutral Scale (crew-*)
| 토큰 | Hex | 용도 |
|-------|-----|------|
| crew-900 | `#0B1120` | 다크 배경 |
| crew-800 | `#131B2E` | 다크 서피스 |
| crew-700 | `#1E293B` | 다크 카드 |
| crew-600 | `#334155` | 보더 |
| crew-500 | `#475569` | 비활성 텍스트 |
| crew-400 | `#94A3B8` | 보조 텍스트 |
| crew-300 | `#CBD5E1` | 라이트 보더 |
| crew-200 | `#E2E8F0` | 라이트 서피스 |
| crew-100 | `#F1F5F9` | 라이트 배경 |
| crew-50 | `#F8FAFC` | 라이트 최상위 배경 |

### Soul Gradient
```css
background: linear-gradient(135deg, #2563EB, #06B6D4, #6366F1);
```
- 로고, 배지, 강조 배경에 사용
- 영혼의 빛이 퍼지는 느낌

### 넥스트페이 연결고리
- Crew Blue (#2563EB)는 넥스트페이 블루를 계승하되 약간 진하게
- Crew Cyan (#06B6D4)은 넥스트페이 시안 톤 계승
- 독립 브랜드이지만 모기업과 시각적 일관성 유지

---

## 4. 타이포그래피

### Font Stack
| 용도 | 폰트 | 웨이트 | 비고 |
|------|-------|--------|------|
| **디스플레이** | Space Grotesk | 600-700 | 제목, 로고 |
| **본문** | Pretendard | 400-600 | 한글 최적화 |
| **코드** | JetBrains Mono | 400-500 | 기술 콘텐츠 |
| **픽셀 포인트** | Press Start 2P | 400 | 레벨, 배지, 게임 요소 |

### 타이포 스케일
- h1: 36px / 700 / Space Grotesk
- h2: 28px / 700 / Space Grotesk
- h3: 22px / 600 / Space Grotesk
- body: 15px / 400 / Pretendard
- small: 13px / 400 / Pretendard
- caption: 11px / 400 / Pretendard
- pixel-badge: 10px / 400 / Press Start 2P

---

## 5. Tailwind 토큰 매핑

### 변환 요약 (empire → crew)
| Claw-Empire | Next AI Crew | 변경 내용 |
|------------|-------------|-----------|
| `empire-900~300` | `crew-900~50` | 슬레이트 → 쿨 블루 틴트 |
| `empire-gold` | `crew-amber` | 동일 계열, Soul 표현용 |
| `empire-blue` | `crew-blue` | #3b82f6 → #2563EB |
| `empire-purple` | `crew-indigo` | #8b5cf6 → #6366F1 |
| `empire-green` | `crew-emerald` | 유지 |
| `empire-red` | `crew-rose` | #ef4444 → #F43F5E |
| `empire-pink` | (삭제) | crew-rose로 통합 |

### 적용 파일
- `tailwind-theme-tokens.css` → `src/styles/index.part01.css` 교체
- ThemeContext.tsx: `climpire_theme` → `nextcrew_theme` 변경
- 전역 검색/치환: `empire-` → `crew-`

---

## 6. 파비콘 & OG 이미지

### 파비콘
- `favicon/favicon.svg` (벡터, 모든 크기 지원)
- 3명의 크루 블록 + Soul spark
- 다크 배경 (#0B1120) + 라운드 코너
- PNG 생성 필요: 16x16, 32x32, 192x192, 512x512

### OG 이미지
- `og/og-image.svg` (1200x630)
- 다크 배경 + 미세 그리드 패턴
- 3 크루 멤버 중앙 배치 + Soul spark
- "Next AI Crew" 워드마크 + 태그라인
- PNG 변환 후 사용

---

## 7. Soul UX 패턴 (구현 가이드)

### Agent Soul Pulse
```css
@keyframes soul-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
```
- 에이전트 아바타에 은은한 호흡 애니메이션
- "살아있다"는 느낌 전달

### Soul Glow
```css
box-shadow: 0 0 20px rgba(6, 182, 212, 0.15),
            0 0 40px rgba(37, 99, 235, 0.08);
```
- 활성 에이전트 카드, 중요 UI 요소에 적용

### Soul Spark
- 골드(#FBBF24) 작은 빛 → 에이전트 상태 인디케이터
- 온라인: 스파크 깜빡임 / 작업중: 펄스 / 오프라인: 소멸

---

## 8. 체크리스트

- [x] 로고 시안 3개 (SVG)
- [x] 컬러 팔레트 정의
- [x] 폰트 선정 및 스택 정의
- [x] Tailwind @theme 토큰 매핑 CSS
- [x] 파비콘 SVG
- [x] OG 이미지 SVG (1200x630)
- [x] Soul UX 패턴 정의
- [x] 디자인 가이드 문서

---

*Kevin 의장님 & 한빈 PM 리뷰 후 시안 확정 → Day 2 로그인/회원가입 UI + 브랜딩 QA 진행*
