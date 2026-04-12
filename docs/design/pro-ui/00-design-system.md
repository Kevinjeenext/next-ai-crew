# Next AI Crew — Pro UI 디자인 시스템

> 2026-04-12 | Designer: Ivy | Kevin 피벗 확정
> 방향: ClawPoD급 프로페셔널 + Notion/Linear 톤
> 폐기: 픽셀 아바타, 오피스 미니맵, 게이미피케이션
> 유지: Soul 채용 플로우, 토큰 빌링

---

## 컬러 팔레트 (다크 모드 우선)

```css
:root {
  /* 배경 계층 */
  --bg-base:      #0F1117;   /* 최상위 앱 배경 */
  --bg-surface:   #161B27;   /* 카드/패널 */
  --bg-elevated:  #1E2536;   /* 드롭다운/모달 */
  --bg-overlay:   #252D40;   /* 호버/선택 */

  /* 테두리 */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  /* 텍스트 */
  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-tertiary:  #475569;
  --text-disabled:  #334155;

  /* 브랜드 */
  --brand-blue:   #2563EB;
  --brand-blue-h: #1D4ED8;   /* hover */
  --brand-cyan:   #06B6D4;   /* 포인트 */

  /* 시멘틱 */
  --success: #10B981;
  --warning: #F59E0B;
  --error:   #EF4444;
  --info:    #3B82F6;
}
```

---

## 타이포그래피 (2종)

```css
/* UI 텍스트 전용 */
--font-ui:   "Inter", "Space Grotesk", -apple-system, sans-serif;
/* 본문 전용 */
--font-body: "Pretendard", "Inter", sans-serif;
/* 코드/수치 전용 */
--font-mono: "JetBrains Mono", "Fira Code", monospace;

/* 스케일 */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 14px;
--text-md:   16px;
--text-lg:   20px;
--text-xl:   24px;
--text-2xl:  32px;
```

---

## 공통 컴포넌트 토큰

```css
/* 카드 */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}

/* 버튼 */
.btn-primary {
  background: var(--brand-blue);
  color: #fff; border: none;
  padding: 9px 18px; border-radius: 8px;
  font: 600 var(--text-sm) var(--font-ui);
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary:hover { background: var(--brand-blue-h); box-shadow: 0 0 0 3px rgba(37,99,235,0.25); }

.btn-secondary {
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: 9px 18px; border-radius: 8px;
  font: 500 var(--text-sm) var(--font-ui);
  transition: border-color 0.15s, background 0.15s;
}
.btn-secondary:hover { border-color: var(--border-strong); background: var(--bg-overlay); color: var(--text-primary); }

/* 인풋 */
.input {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-default);
  border-radius: 8px; padding: 9px 13px;
  font: 400 var(--text-sm) var(--font-ui);
  color: var(--text-primary);
  outline: none; width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.input::placeholder { color: var(--text-tertiary); }

/* 뱃지 */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 5px;
  font: 500 11px var(--font-ui);
}
.badge-blue    { background: rgba(37,99,235,0.15);  color: #93BBFC; }
.badge-green   { background: rgba(16,185,129,0.15); color: #6EE7B7; }
.badge-amber   { background: rgba(245,158,11,0.15); color: #FCD34D; }
.badge-red     { background: rgba(239,68,68,0.15);  color: #FCA5A5; }

/* 아바타 (이니셜/프로필) */
.avatar {
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  font: 600 var(--text-sm) var(--font-ui);
  background: var(--bg-overlay);
  color: var(--text-secondary);
  flex-shrink: 0;
  user-select: none;
}
.avatar-sm { width: 32px; height: 32px; border-radius: 8px; font-size: 12px; }
.avatar-md { width: 40px; height: 40px; border-radius: 10px; font-size: 14px; }
.avatar-lg { width: 56px; height: 56px; border-radius: 14px; font-size: 18px; }
/* 부서별 아바타 컬러 */
.avatar-developer { background: rgba(37,99,235,0.2);  color: #93BBFC; }
.avatar-designer  { background: rgba(6,182,212,0.2);  color: #67E8F9; }
.avatar-pm        { background: rgba(245,158,11,0.2); color: #FCD34D; }
.avatar-security  { background: rgba(239,68,68,0.2);  color: #FCA5A5; }
.avatar-qa        { background: rgba(16,185,129,0.2); color: #6EE7B7; }
.avatar-devops    { background: rgba(249,115,22,0.2); color: #FDB07A; }
.avatar-marketer  { background: rgba(236,72,153,0.2); color: #F9A8D4; }
.avatar-ea        { background: rgba(139,92,246,0.2); color: #C4B5FD; }

/* 구분선 */
.divider {
  height: 1px;
  background: var(--border-subtle);
  border: none; margin: 0;
}

/* 상태 도트 */
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.online  { background: #10B981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
.status-dot.busy    { background: #F59E0B; }
.status-dot.offline { background: #475569; }
```
