# ClawPoD Cloud UI 분석 보고서

> 2026-04-12 | Ivy 분석
> 캡처 01: 대시보드 / 캡처 02: 조직 페이지

---

## 1. 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  사이드바 (~210px)  │  헤더 (48px)                           │
│                     │──────────────────────────────────────  │
│                     │  메인 콘텐츠 (여백 32px)               │
└──────────────────────────────────────────────────────────────┘
```

- **라이트 모드** — 흰 배경 기반 (Next AI Crew는 다크 모드 우선 → 색상 반전 적용)
- 사이드바: 흰색 배경 `#FFFFFF`, 우측 경계선 없음 (shadow only)
- 헤더: 우측 상단에 번역/알림/설정 아이콘 + "제팀" "관리자" 탭 버튼

---

## 2. 컬러 팔레트 (라이트 → 다크 대응)

| 역할 | ClawPoD (라이트) | Next AI Crew (다크 대응) |
|------|----------------|------------------------|
| 배경 base | `#FFFFFF` | `#0F1117` |
| 배경 surface | `#F8F9FA` | `#161B27` |
| 텍스트 primary | `#111827` | `#F1F5F9` |
| 텍스트 secondary | `#6B7280` | `#94A3B8` |
| 브랜드 accent | `#E11D48` (rose-600) | `#2563EB` (crew-blue) |
| 성공/업무중 | `#10B981` (green) | `#10B981` (동일) |
| 배지 배경 | `rgba(16,185,129,0.1)` | `rgba(16,185,129,0.15)` |
| 차트 라인 | `#F43F5E` (rose) | `#3B82F6` (blue) |

---

## 3. 타이포그래피

- **폰트**: 시스템 폰트 계열 (한글: Pretendard 추정, 영문: Inter)
- 페이지 타이틀: `font: 700 24px` — "대시보드", "조직"
- 섹션 타이틀: `font: 600 14px` — "빠른 인사이트", "상위 에이전트"
- 본문: `font: 400 13px` — 부제목, 설명
- 수치: `font: 700 32px` — "3.2K" (JetBrains Mono 추정)
- 메타: `font: 400 11~12px` — 타임스탬프, 설명

---

## 4. 사이드바 컴포넌트

```css
/* 추정 CSS */
.sidebar { width: 210px; background: #fff; padding: 0; }
.sidebar-logo { padding: 16px; display: flex; align-items: center; gap: 10px; font: 600 14px; }
.nav-section-label { padding: 16px 16px 4px; font: 600 11px; color: #9CA3AF; text-transform: none; letter-spacing: 0; }
.nav-item { padding: 8px 16px; border-radius: 6px; font: 400 13px; color: #374151; }
.nav-item.active { background: #F3F4F6; color: #111827; font-weight: 500; }
```

**섹션 구조:**
- 온보딩 / 대시보드 (상단)
- 관리: 에이전트, 조직, 태스크
- 분석: 분석 요약, LLM 사용 비용
- 스토어: 에이전트 스킬
- 연동: 팀훅
- 플랫폼: 사용자 관리, 공지 관리, 요금재 관리, 감사 로그
- 하단: 사용자 프로필 (Kevin, 테넌트 관리자)

---

## 5. 대시보드 컴포넌트

### 요약 카드 (5개)
```
┌─────────────────────────────┐
│  [아이콘]  카드명    [↗]    │
│                              │
│  숫자                        │
│  ─────────────────────────   │  ← 하단 red 바
└─────────────────────────────┘
```
```css
.summary-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; }
.summary-card-bottom-bar { height: 3px; background: #E11D48; border-radius: 0 0 8px 8px; margin: 12px -16px -16px; }
```

### 차트 (LLM 호출 추이)
- 라인 차트 (rose/pink 계열)
- 배경 그리드 없음, 매우 미니멀
- x축: 요일 라벨, y축 없음

### 상위 에이전트 테이블
```
[아바타 32px] Hanbin  ● 업무중  $138.7 (100%)  ████████████
```
- 아바타: 실제 프로필 사진 원형 32px
- 진행 바: rose 컬러, 얇은 4px
- 뱃지: `● 업무중` green pill

---

## 6. 조직 페이지 — 핵심 UI 패턴 🔑

### 에이전트/멤버 카드 (가로 스크롤 캐러셀)

```
┌─────────────────────────────┐
│  [AD] 뱃지                  │  ← 상단 role 뱃지 (AD/ME/초대)
│                              │
│  [프로필 사진 원형 64px]     │
│                              │
│  Kevin                       │
│  CEO                         │
└─────────────────────────────┘
```

```css
/* 인물 카드 */
.agent-card {
  width: ~110px; padding: 16px 12px;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 12px; text-align: center;
  position: relative;
}
.agent-card-badge {
  position: absolute; top: 8px; left: 8px;
  padding: 2px 6px; border-radius: 4px;
  font: 600 10px; /* AD=파랑, ME=초록(teal) */
}
.agent-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  margin: 0 auto 10px; overflow: hidden;
  border: 2px solid transparent; /* 업무중: green 보더 */
}
.agent-name  { font: 600 13px; color: #111827; }
.agent-role  { font: 400 11px; color: #6B7280; margin-top: 3px; }
```

**업무 중 뱃지:** `● 업무 중` — 카드 상단 right에 green pill 뱃지
**왕관 아이콘:** Admin/Owner 표시 — 프로필 사진 우하단 overlay

### 캐러셀 네비
- 좌우 화살표 버튼 (원형 흰색, border, shadow)
- 그룹 제목: `👥 사용자 (3)` / `🤖 AI Crew (5명)` — 이모지 + 카운트

---

## 7. 버튼 스타일

```css
/* Primary — rose/brand */
.btn-primary {
  background: #E11D48; color: white;
  padding: 8px 16px; border-radius: 8px;
  font: 600 13px; display: flex; align-items: center; gap: 6px;
}
/* "조직 생성 (1/1)" — 카운트 포함 */

/* Ghost/Icon */
.btn-icon {
  width: 32px; height: 32px; border-radius: 6px;
  background: transparent; border: none;
  color: #9CA3AF;
}
.btn-icon:hover { background: #F3F4F6; }
```

---

## 8. Next AI Crew 적용 포인트 (다크 모드)

| ClawPoD 패턴 | Next AI Crew 적용 |
|-------------|-----------------|
| 원형 프로필 사진 | 이니셜 아바타 (border-radius: 50%) ← 기존 10px → 원형으로 변경 |
| 가로 스크롤 캐러셀 | /hire 카드 그리드 + 모바일 스크롤 |
| 하단 red 진행 바 | 하단 blue 진행 바 (`#2563EB`) |
| ● 업무중 green 뱃지 | ● Online/Active 상태 동일 패턴 |
| 왕관 overlay | Senior/Lead 레벨 뱃지 overlay |
| 캐러셀 화살표 | Soul 팀 카드 모바일 스와이프 |
| 역할 뱃지 (AD/ME) | CEO/CTO/PM 역할 뱃지 |
| LLM 비용 차트 | 토큰 사용량 라인 차트 |

---

## 9. 아바타 형태 변경 권고

**현재 설계서**: `border-radius: 10~14px` (사각형)
**ClawPoD 기준**: `border-radius: 50%` (원형)

→ **권고**: 이니셜 아바타를 원형(`border-radius: 50%`)으로 변경
→ 더 친근하고 사람 느낌 (Soul = 사람 컨셉에 맞음)

```css
/* 변경 */
.avatar     { border-radius: 50% !important; }
.avatar-sm  { width: 32px; height: 32px; border-radius: 50%; }
.avatar-md  { width: 40px; height: 40px; border-radius: 50%; }
.avatar-lg  { width: 56px; height: 56px; border-radius: 50%; }
.avatar-xl  { width: 72px; height: 72px; border-radius: 50%; }
```
