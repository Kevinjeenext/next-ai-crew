# ClawPoD Cloud UI 전체 분석 (10장)

> 2026-04-12 | Ivy 분석 | 캡처 01~10 전체
> Next AI Crew Pro UI 보완 포인트 도출

---

## 1. 디자인 시스템 요약

### 컬러 팔레트 (확정)
```css
/* ClawPoD 라이트 → Next AI Crew 다크 대응 */
--clawpod-brand:    #E11D48;   /* rose-600 → 우리: #2563EB */
--clawpod-bg:       #FFFFFF;   /* → 우리: #0F1117 */
--clawpod-surface:  #F9FAFB;   /* → 우리: #161B27 */
--clawpod-border:   #E5E7EB;   /* → 우리: rgba(255,255,255,0.08) */
--clawpod-text:     #111827;   /* → 우리: #F1F5F9 */
--clawpod-muted:    #6B7280;   /* → 우리: #94A3B8 */
/* 공통 */
--green-active:   #10B981;   /* 업무중/Online 동일 */
--green-bg:       rgba(16,185,129,0.1);
```

### 타이포그래피
- **페이지 타이틀**: `700 22~24px` (대시보드, 분석 요약, 조직...)
- **섹션 타이틀**: `600 14px` (빠른 인사이트, 활동 패턴...)  
- **KPI 수치**: `700 28~32px` JetBrains Mono 계열
- **본문/메타**: `400 13px`
- **레이블**: `500 11~12px` uppercase

### 레이아웃
- 사이드바: `210px` fixed, 흰 배경, border-right 없음
- 헤더 없음 (사이드바 내 로고 + 우상단 아이콘 직접 배치)
- 콘텐츠 패딩: `32px`
- 카드 gap: `16px`
- 카드 radius: `8~12px`
- 카드 border: `1px solid #E5E7EB`

---

## 2. 페이지별 핵심 UI 패턴

### 03. 분석 요약
- KPI 카드 4개 (4열): 활성 에이전트 / 처리된 메시지 / 총 비용 / 총 토큰
- **증감 뱃지**: `↗ 40.7% 이전 7d 대비` — rose(↑나쁨) / green(↓좋음)
- 영역 차트 (area chart): rose pink + 하단 그라디언트 fill, x축만
- 하단 KPI 2열: LLM 호출 / 전체 다화 / 활성 사용자 / 대화당 평균

```css
/* 증감 뱃지 */
.trend-badge { font: 500 11px; padding: 2px 6px; border-radius: 4px; }
.trend-up    { color: #E11D48; background: rgba(225,29,72,0.08); }   /* 비용 증가 = 나쁨 */
.trend-down  { color: #10B981; background: rgba(16,185,129,0.1); }  /* 토큰 감소 = 좋음 */
/* Next AI Crew: 컬러만 변경 */
```

### 04. 스킬 스토어
- **카드 그리드** (3열): 스킬 이름 + 아이콘(원형 컬러) + 설명 + 태그
- 각 스킬 카드에 `productivity/automation/coding` 카테고리 컬러 도트
- 카드 내 메타: 버전 숫자 + 스킬 수 카운트
- 상단: 검색바 + "새 에이전트 스킬 추가" 버튼

```css
/* 스킬 카드 */
.skill-card { padding: 16px; border-radius: 10px; }
.skill-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.skill-icon.productivity { background: rgba(59,130,246,0.15); color: #3B82F6; }
.skill-icon.automation   { background: rgba(139,92,246,0.15); color: #8B5CF6; }
.skill-icon.coding       { background: rgba(16,185,129,0.15); color: #10B981; }
/* Next AI Crew /hire 카드와 동일 패턴 적용 가능 */
```

### 05. 에이전트 상세 (원격 PC 제어)
- 우측에 **실제 PC 화면 스트림** (큰 영역)
- 에이전트 헤더: 원형 프로필 사진 + 이름 + 역할 + 상태 뱃지 + 시간
- 하단 CTA 3개: `빨간 종료`, `취소`, `확인` 버튼
- 좌측에 PC 제어 상태 패널

→ Next AI Crew에는 원격 PC 없지만, **에이전트 실행 중 상태** 표시 패턴 참고

### 06. 채팅 인터페이스
```
┌──────────────────────────────────────────────────────────────┐
│  [OpenClaw 채팅] [에이전트 선택] [모델 선택 드롭다운]        │
│  ─────────────────────────────────────────────────────────── │
│  [시스템 메시지 박스 (파란 배경)]                             │
│                                                              │
│  [채팅 메시지 영역]                                          │
│                                                              │
│  [입력창]  [첨부] [전송]                                     │
│  ─────────────────────────────────────────────────────────── │
│  [하단 운영 컨트롤: 실행 중 알림, 에러, 취소 버튼]            │
└──────────────────────────────────────────────────────────────┘
```

핵심 특이점:
- **시스템 메시지 박스**: 파란 배경, 코드처럼 표시
- **에러 메시지**: 하단에 rose/red 배경 알림 (`LIMIT reached`)
- **운영 컨트롤 하단 바**: 에이전트 실행 상태 + 인터럽트 버튼

```css
/* 시스템 메시지 박스 */
.chat-system-msg {
  background: rgba(37,99,235,0.08);
  border: 1px solid rgba(37,99,235,0.2);
  border-radius: 8px; padding: 12px 16px;
  font: 400 13px var(--font-mono); color: #93BBFC;
  margin-bottom: 16px;
}
/* 에러 알림 */
.chat-error-bar {
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px; padding: 10px 14px;
  font: 500 13px; color: #FCA5A5;
  display: flex; align-items: center; gap: 8px;
}
```

### 07. LLM 비용 분석
- 상단 KPI 4개 (4열): LLM 호출 수 / API 비용 / 입력 토큰 / 응답 시간
- **세로 막대 차트** (bar chart): LLM 호출 소스별 + 시간대별
- **수평 비교 바**: 에이전트별 사용량
- 하단 테이블: 에이전트 이름 / 대화 수 / 토큰 수

→ Next AI Crew **빌링 대시보드에 LLM 호출 트렌드 차트 추가** 권고

```css
/* 차트 컨테이너 */
.chart-container {
  border: 1px solid var(--border-subtle); border-radius: 10px; padding: 20px;
  background: var(--bg-surface);
}
.chart-title { font: 600 14px; color: var(--text-primary); margin-bottom: 4px; }
.chart-sub   { font: 400 12px; color: var(--text-tertiary); }
```

### 08. AI 리소스 설정 (모델 매핑)
- **테이블 형태**: Role / 기본 모델 / 폴백 모델 / 용도 설명
- 각 행: 역할 아이콘(컬러 원) + 텍스트
- **API Credentials 섹션**: 접힌/펼친 아코디언
- 하단 토글 스위치 (Anthropic/OpenAI)

→ Next AI Crew **Soul 설정 페이지** 모델 매핑 테이블에 동일 패턴 활용

```css
/* 설정 테이블 */
.settings-table { width: 100%; border-collapse: collapse; }
.settings-table th { font: 600 11px; color: var(--text-tertiary); text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); text-align: left; }
.settings-table td { padding: 12px; border-bottom: 1px solid var(--border-subtle); font: 400 13px; color: var(--text-secondary); }
.settings-table tr:last-child td { border-bottom: none; }
```

### 09. Soul 설정 (페르소나 에디터) ⭐ 핵심
```
┌────────────────────────────────────────────────────────┐
│  [Preview] [AI 탭] 탭 선택                            │
│                                                        │
│  [YAML 에디터 (다크 배경)]         [설명 텍스트]      │
│  agent: CEO-Yelin                   identity:...       │
│  role: Chief Executive Officer      Vision & Strategy  │
│  traits: [Visionary, Analytical...                     │
│  ...                                                   │
│                                                        │
│  [Identity 섹션 (라이트)]                              │
└────────────────────────────────────────────────────────┘
```

**YAML 에디터 다크 테마** — ClawPoD의 가장 독특한 UI:
```css
.yaml-editor {
  background: #1E1E2E;  /* 다크 에디터 배경 */
  border-radius: 8px; padding: 16px;
  font: 400 13px/1.6 "JetBrains Mono"; color: #CDD6F4;
}
.yaml-key   { color: #89B4FA; }  /* blue */
.yaml-value { color: #A6E3A1; }  /* green */
.yaml-array { color: #FAB387; }  /* peach */
```

→ Next AI Crew **Soul 상세 설정 페이지**에서 활용 가능

### 10. AI 직원 채용 ⭐ 가장 중요
```
┌────────────────────────────────────────────────────────────────┐
│  AI 직원 채용                                                  │
│  ────────────────────────────────────────────────────────────  │
│  이런 역할이 필요한가요? 한 수 이상의 역할을 선택해 팀을 구성  │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ CEO 원형  │  │ CTO 원형  │  │ DevOps   │  │ EA       │     │
│  │ 사진      │  │ 사진      │  │ 원형사진 │  │ 원형사진 │     │
│  │ CEO       │  │ CTO       │  │ DevOps   │  │ EA       │     │
│  │ Strategic │  │ Tech chall│  │ CI/CD    │  │ Calendar │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                │
│  전문가 프로필                    역량 레이더 차트             │
│  CEO-Yelin                       [정육각형 레이더]            │
│  Vision & strategy                스킬 수준 시각화            │
│  Organizational mission...                                    │
│  Decision support...                                          │
│  ────────────────────────────────────────────────────────────  │
│  [빨간 CTA 버튼: 스킬 연결]                                   │
└────────────────────────────────────────────────────────────────┘
```

**레이더 차트** — Next AI Crew에 바로 적용 가능!
```css
/* Chart.js radar 설정 */
const radarConfig = {
  type: 'radar',
  data: {
    labels: ['리더십', '전략', '소통', '분석', '실행력', '협업'],
    datasets: [{
      data: [90, 85, 80, 88, 75, 82],
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderColor: '#2563EB',
      borderWidth: 2,
      pointBackgroundColor: '#2563EB',
      pointRadius: 4,
    }]
  },
  options: {
    scales: { r: { beginAtZero: true, max: 100,
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { display: false },
      pointLabels: { font: { size: 12 }, color: '#94A3B8' }
    }},
    plugins: { legend: { display: false } }
  }
};
```

---

## 3. Next AI Crew Pro UI 보완 포인트

### 즉시 적용 (P0)

| # | 항목 | 현재 | ClawPoD 기준 | 변경 내용 |
|---|------|------|-------------|---------|
| 1 | 아바타 형태 | `border-radius: 10~14px` | `border-radius: 50%` | 원형으로 통일 |
| 2 | KPI 카드 증감 뱃지 | 없음 | `↗ 40.7%` rose/green | 대시보드 카드에 추가 |
| 3 | 채팅 에러 바 | 없음 | 하단 rose 알림 바 | 토큰 초과/오류 시 표시 |
| 4 | 채용 카드 레이아웃 | 세로 스크롤 | 가로 캐러셀 | 모바일 가로 스와이프 |

### 다음 이터레이션 (P1)

| # | 항목 | ClawPoD 패턴 | Next AI Crew 활용 |
|---|------|-------------|-----------------|
| 5 | 레이더 차트 | 역량 정육각형 | Soul 역량 시각화 (/hire 카드) |
| 6 | YAML 에디터 | 페르소나 직접 편집 | Soul 고급 설정 |
| 7 | LLM 호출 트렌드 | 시간대별 막대 차트 | 빌링 대시보드 추가 |
| 8 | 스킬 카드 그리드 | 카테고리 컬러 도트 | Soul 스킬 뱃지 컬러 확장 |
| 9 | 시스템 메시지 박스 | 파란 배경 코드 뷰 | Soul 채팅 시스템 프롬프트 표시 |

### 설계서 즉시 반영 필요

```css
/* ── P0-1: 아바타 원형 ── */
.avatar, .avatar-sm, .avatar-md, .avatar-lg, .avatar-xl {
  border-radius: 50% !important;
}

/* ── P0-2: KPI 증감 뱃지 ── */
.kpi-trend { font: 500 11px var(--font-ui); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; }
.kpi-trend.up   { color: #FCA5A5; background: rgba(239,68,68,0.1); }
.kpi-trend.down { color: #6EE7B7; background: rgba(16,185,129,0.1); }

/* ── P0-3: 채팅 에러/알림 바 ── */
.chat-alert-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin: 8px 0;
  border-radius: 8px; font: 500 13px var(--font-ui);
}
.chat-alert-bar.error   { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.2);  color: #FCA5A5; }
.chat-alert-bar.warning { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #FCD34D; }
.chat-alert-bar.info    { background: rgba(37,99,235,0.08);  border: 1px solid rgba(37,99,235,0.2);  color: #93BBFC; }

/* ── P1-5: 레이더 차트 컨테이너 ── */
.radar-chart-wrap {
  width: 200px; height: 200px;
  background: var(--bg-elevated); border-radius: 12px; padding: 16px;
}
```

---

## 4. 요약 — ClawPoD vs Next AI Crew 비교

| 항목 | ClawPoD | Next AI Crew |
|------|---------|-------------|
| 모드 | 라이트 | 다크 (우선) |
| 브랜드 컬러 | `#E11D48` rose | `#2563EB` crew-blue |
| 아바타 | 실제 사진 원형 | 이니셜 원형 (변경 권고) |
| 차트 | 영역+막대+레이더 | 라인+레이더 (추가 예정) |
| 채용 UX | 역할 카드 → 레이더 → 스킬 연결 | Soul 카드 → 온보딩 6단계 |
| 설정 | YAML 에디터 직접 | GUI + 고급 YAML (P1) |
| 강점 차별점 | 멀티 에이전트 조직 관리 | **Soul 채용 스토리 + 개성** |
