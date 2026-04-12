# Pro UI — 전체 CSS 통합 파일

> 2026-04-12 | Designer: Ivy
> 00~04 설계서 CSS 전체 통합본 — 태영 구현용

---

## 목차

1. CSS 변수 (토큰)
2. 리셋 + 기본
3. 레이아웃 셸
4. 사이드바
5. 콘텐츠 영역 공통
6. 공통 컴포넌트 (버튼/인풋/뱃지/아바타/상태 도트)
7. 메인 대시보드
8. Soul 채용 페이지
9. 채팅 인터페이스
10. 설정/빌링
11. 반응형

---

## 1. CSS 변수

```css
/* pro-ui.css */
:root {
  --bg-base:        #0F1117;
  --bg-surface:     #161B27;
  --bg-elevated:    #1E2536;
  --bg-overlay:     #252D40;

  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-tertiary:  #475569;
  --text-disabled:  #334155;

  --brand-blue:   #2563EB;
  --brand-blue-h: #1D4ED8;
  --brand-cyan:   #06B6D4;

  --success: #10B981;
  --warning: #F59E0B;
  --error:   #EF4444;
  --info:    #3B82F6;

  --font-ui:   "Inter", "Space Grotesk", -apple-system, sans-serif;
  --font-body: "Pretendard", "Inter", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

---

## 2. 리셋 + 기본

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg-base);
  color: var(--text-primary);
  font: 400 14px/1.5 var(--font-ui);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh; overflow: hidden;
}
a { text-decoration: none; color: inherit; }
button { font: inherit; cursor: pointer; }
```

---

## 3. 레이아웃 셸

```css
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.app-sidebar {
  flex-shrink: 0;
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}
.app-content::-webkit-scrollbar { width: 4px; }
.app-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
```

---

## 4. 사이드바

```css
/* ─── 글로벌 사이드바 ─── */
.sidebar {
  width: 240px;
  height: 100vh;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar::-webkit-scrollbar { width: 3px; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.sidebar-logo { height: 28px; }

.sidebar-nav { padding: 8px; flex: 1; }

.sidebar-section-label {
  padding: 16px 10px 6px;
  font: 600 11px var(--font-ui);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.sidebar-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 8px 10px;
}
.sidebar-bottom {
  padding: 8px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  font: 500 13px var(--font-ui);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
  margin-bottom: 1px;
}
.nav-item svg { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.7; }
.nav-item:hover  { background: var(--bg-overlay); color: var(--text-primary); }
.nav-item:hover svg { opacity: 1; }
.nav-item.active { background: rgba(37,99,235,0.12); color: #93BBFC; }
.nav-item.active svg { opacity: 1; }
.nav-badge {
  margin-left: auto;
  background: var(--brand-blue);
  color: white;
  min-width: 18px; height: 18px;
  border-radius: 9px; padding: 0 5px;
  font: 700 11px var(--font-ui);
  display: flex; align-items: center; justify-content: center;
}

/* 사이드바 Soul 아이템 */
.sidebar-soul-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 1px;
}
.sidebar-soul-item:hover  { background: var(--bg-overlay); }
.sidebar-soul-item.active { background: rgba(37,99,235,0.1); }
.sidebar-soul-name {
  flex: 1;
  font: 500 13px var(--font-ui);
  color: var(--text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sidebar-soul-item.active .sidebar-soul-name { color: var(--text-primary); }
.sidebar-soul-role {
  font: 400 11px var(--font-ui);
  color: var(--text-tertiary);
}

/* 사이드바 추가 버튼 */
.sidebar-add-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 6px; cursor: pointer;
  font: 500 13px var(--font-ui); color: var(--text-tertiary);
  background: transparent; border: none; width: 100%;
  transition: background 0.12s, color 0.12s;
}
.sidebar-add-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
```

---

## 5. 공통 페이지 헤더

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-title {
  font: 700 20px var(--font-ui);
  color: var(--text-primary);
}
.page-actions { display: flex; gap: 8px; align-items: center; }
```

---

## 6. 공통 컴포넌트

```css
/* ─── 버튼 ─── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: 9px 16px; border-radius: 8px; border: none;
  font: 600 13px var(--font-ui); cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.btn-primary {
  background: var(--brand-blue); color: white;
}
.btn-primary:hover { background: var(--brand-blue-h); box-shadow: 0 0 0 3px rgba(37,99,235,0.25); }
.btn-secondary {
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover { border-color: var(--border-strong); background: var(--bg-overlay); color: var(--text-primary); }
.btn-ghost {
  background: transparent; color: var(--text-secondary); border: none;
}
.btn-ghost:hover { background: var(--bg-overlay); color: var(--text-primary); }
.btn-danger { background: var(--error); color: white; }
.btn-danger:hover { background: #DC2626; }
.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; }
.btn-lg { padding: 12px 24px; font-size: 15px; border-radius: 10px; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

/* 아이콘 버튼 */
.icon-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 7px; border: none; background: transparent;
  color: var(--text-tertiary); cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.icon-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }

/* ─── 인풋 ─── */
.input {
  width: 100%; padding: 9px 13px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-default);
  font: 400 14px var(--font-ui); color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.input::placeholder { color: var(--text-tertiary); }
.input.error { border-color: rgba(239,68,68,0.5); box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
.field-error { font: 400 12px var(--font-ui); color: #FCA5A5; margin-top: 4px; }
.field-label {
  display: block; font: 500 12px var(--font-ui);
  color: var(--text-secondary); margin-bottom: 6px;
}

/* 검색 인풋 */
.search-input-wrap { position: relative; }
.search-input-wrap svg {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--text-tertiary); width: 15px; height: 15px; pointer-events: none;
}
.search-input-wrap .input { padding-left: 34px; }

/* ─── 뱃지 ─── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 5px;
  font: 500 11px var(--font-ui);
}
.badge-blue    { background: rgba(37,99,235,0.15);  color: #93BBFC; }
.badge-green   { background: rgba(16,185,129,0.15); color: #6EE7B7; }
.badge-amber   { background: rgba(245,158,11,0.15); color: #FCD34D; }
.badge-red     { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.badge-gray    { background: var(--bg-overlay);     color: var(--text-tertiary); }
.badge-cyan    { background: rgba(6,182,212,0.15);  color: #67E8F9; }

/* ─── 아바타 ─── */
/* v1.1: 원형 통일 (ClawPoD 기준, Soul=사람 컨셉) */
.avatar {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; flex-shrink: 0; user-select: none;
  font-weight: 600; background: var(--bg-overlay); color: var(--text-secondary);
}
.avatar-xs  { width: 24px; height: 24px; border-radius: 50%; font: 600 10px var(--font-ui); }
.avatar-sm  { width: 32px; height: 32px; border-radius: 50%; font: 600 12px var(--font-ui); }
.avatar-md  { width: 40px; height: 40px; border-radius: 50%; font: 600 14px var(--font-ui); }
.avatar-lg  { width: 56px; height: 56px; border-radius: 50%; font: 600 18px var(--font-ui); }
.avatar-xl  { width: 72px; height: 72px; border-radius: 50%; font: 600 22px var(--font-ui); }

.avatar-developer { background: rgba(37,99,235,0.2);  color: #93BBFC; }
.avatar-designer  { background: rgba(6,182,212,0.2);  color: #67E8F9; }
.avatar-pm        { background: rgba(245,158,11,0.2); color: #FCD34D; }
.avatar-security  { background: rgba(239,68,68,0.2);  color: #FCA5A5; }
.avatar-qa        { background: rgba(16,185,129,0.2); color: #6EE7B7; }
.avatar-devops    { background: rgba(249,115,22,0.2); color: #FDB07A; }
.avatar-marketer  { background: rgba(236,72,153,0.2); color: #F9A8D4; }
.avatar-ea        { background: rgba(139,92,246,0.2); color: #C4B5FD; }
.avatar-cto       { background: rgba(6,182,212,0.2);  color: #67E8F9; }
.avatar-ceo       { background: rgba(245,158,11,0.2); color: #FCD34D; }

/* ─── 상태 도트 ─── */
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.status-dot.online  { background: #10B981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
.status-dot.busy    { background: #F59E0B; }
.status-dot.offline { background: #475569; }

/* ─── 카드 ─── */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
  overflow: hidden; /* 하단 바 클립을 위해 */
}
.card-hover {
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  cursor: pointer;
}
/* 카드 하단 컬러 바 — v1.1 추가 (ClawPoD 패턴) */
.card-bottom-bar {
  height: 3px;
  background: var(--brand-blue);
  border-radius: 0 0 12px 12px;
  margin: 12px -20px -20px;
}
.card-bottom-bar.green  { background: var(--success); }
.card-bottom-bar.amber  { background: var(--warning); }
.card-bottom-bar.red    { background: var(--error); }
.card-hover:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}

/* ─── 구분선 ─── */
.divider { height: 1px; background: var(--border-subtle); border: none; margin: 16px 0; }

/* ─── 스켈레톤 ─── */
.skeleton {
  background: var(--bg-overlay);
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* ─── 토스트 ─── */
.toast-container {
  position: fixed; bottom: 24px; right: 24px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 9999; pointer-events: none;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  font: 400 13px var(--font-ui); color: var(--text-primary);
  pointer-events: all;
  animation: toast-in 0.2s ease;
  max-width: 360px;
}
@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
.toast-success { border-left: 3px solid var(--success); }
.toast-error   { border-left: 3px solid var(--error); }
.toast-warning { border-left: 3px solid var(--warning); }

/* ─── 드롭다운 ─── */
.dropdown {
  position: absolute; z-index: 100;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  padding: 6px;
  min-width: 180px;
}
.dropdown-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 6px;
  font: 400 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: background 0.1s, color 0.1s;
}
.dropdown-item:hover { background: var(--bg-overlay); color: var(--text-primary); }
.dropdown-item.danger { color: #FCA5A5; }
.dropdown-item.danger:hover { background: rgba(239,68,68,0.08); }
.dropdown-divider { height: 1px; background: var(--border-subtle); margin: 4px 0; }
```

---

## 7. 메인 대시보드

```css
/* 요약 카드 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 28px;
}
.summary-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px; padding: 16px 20px;
}
.summary-label {
  font: 500 11px var(--font-ui); color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}
.summary-value { font: 700 24px var(--font-ui); color: var(--text-primary); line-height: 1; margin-bottom: 4px; }
.summary-sub   { font: 400 12px var(--font-ui); color: var(--text-tertiary); }

/* Soul 팀 카드 그리드 */
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px; margin-bottom: 28px;
}
.soul-team-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 20px;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;
}
.soul-team-card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.soul-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.soul-card-info { flex: 1; min-width: 0; }
.soul-card-name { font: 600 15px var(--font-ui); color: var(--text-primary); }
.soul-card-role { font: 400 12px var(--font-ui); color: var(--text-secondary); margin-top: 2px; }

.soul-skill-list { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; }
.soul-skill-chip {
  padding: 3px 8px; border-radius: 4px;
  font: 500 11px var(--font-mono);
  background: var(--bg-overlay); color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.soul-card-stats {
  display: flex; gap: 16px;
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  padding: 12px 0; border-top: 1px solid var(--border-subtle); margin-bottom: 12px;
}
.soul-card-stats strong { color: var(--text-secondary); font-weight: 600; }
.soul-card-actions { display: flex; gap: 8px; }
.soul-chat-btn {
  flex: 1; padding: 8px 0;
  background: var(--brand-blue); color: white; border: none; border-radius: 7px;
  font: 600 13px var(--font-ui); cursor: pointer; transition: background 0.15s;
}
.soul-chat-btn:hover { background: var(--brand-blue-h); }

/* 활동 타임라인 */
.activity-list { display: flex; flex-direction: column; }
.activity-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border-subtle);
  font: 400 13px var(--font-ui); color: var(--text-secondary);
}
.activity-item:last-child { border-bottom: none; }
.activity-content { flex: 1; }
.activity-soul { font-weight: 600; color: var(--text-primary); }
.activity-time  { font: 400 11px var(--font-ui); color: var(--text-tertiary); flex-shrink: 0; }
```

---

## 8. Soul 채용 페이지

```css
.hire-layout { display: flex; height: 100%; gap: 0; }

.hire-filter-sidebar {
  width: 220px; flex-shrink: 0;
  padding: 20px 16px; border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
}
.filter-section { margin-bottom: 20px; }
.filter-section-title {
  font: 600 11px var(--font-ui); color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;
}
.filter-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; }
.filter-row input[type="checkbox"] { accent-color: var(--brand-blue); }
.filter-label { font: 400 13px var(--font-ui); color: var(--text-secondary); }
.filter-count { margin-left: auto; font: 400 11px var(--font-ui); color: var(--text-tertiary); }

.hire-grid-wrap { flex: 1; padding: 24px 28px; overflow-y: auto; }
.hire-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* Soul 카드 (프로) */
.hire-card-pro {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 20px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.hire-card-pro:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}
.hire-card-pro.hired { border-color: rgba(16,185,129,0.3); }

.hire-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.hire-card-meta { flex: 1; min-width: 0; }
.hire-card-name { font: 600 15px var(--font-ui); color: var(--text-primary); margin-bottom: 3px; }
.hire-card-role { font: 400 12px var(--font-ui); color: var(--text-secondary); margin-bottom: 2px; }
.hire-card-dept { font: 400 11px var(--font-ui); color: var(--text-tertiary); }

.hire-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
.hire-skill {
  padding: 2px 7px; border-radius: 4px;
  font: 500 11px var(--font-mono);
  background: var(--bg-overlay); color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

/* 성격 프로그레스 바 */
.pbar-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pbar-row { display: flex; align-items: center; gap: 8px; }
.pbar-label { width: 36px; font: 400 11px var(--font-ui); color: var(--text-tertiary); flex-shrink: 0; }
.pbar-track { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
.pbar-fill  { height: 100%; border-radius: 2px; background: var(--brand-blue); transition: width 0.6s ease; }
.pbar-pct   { font: 500 11px var(--font-mono); color: var(--text-tertiary); width: 28px; text-align: right; }

.hire-quote {
  font: 400 12px/1.6 var(--font-body); color: var(--text-tertiary);
  font-style: italic; padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px;
}

.hire-actions { display: flex; gap: 8px; }
.hire-btn-primary {
  flex: 1; padding: 8px 0;
  background: var(--brand-blue); color: white; border: none; border-radius: 7px;
  font: 600 13px var(--font-ui); cursor: pointer; transition: background 0.15s;
}
.hire-btn-primary:hover { background: var(--brand-blue-h); }
.hire-btn-primary.hired { background: var(--bg-overlay); color: var(--text-tertiary); cursor: not-allowed; }
.hire-btn-ghost {
  padding: 8px 12px; background: transparent;
  border: 1px solid var(--border-default); border-radius: 7px;
  font: 500 12px var(--font-ui); color: var(--text-secondary); cursor: pointer;
  transition: border-color 0.15s, background 0.15s; white-space: nowrap;
}
.hire-btn-ghost:hover { border-color: var(--border-strong); background: var(--bg-overlay); }
```

---

## 9. 채팅 인터페이스

```css
/* 채팅 사이드바 (Soul 채널 목록) */
.chat-sidebar {
  width: 260px; flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex; flex-direction: column; height: 100vh; overflow: hidden;
}
.chat-sidebar-header {
  padding: 16px; border-bottom: 1px solid var(--border-subtle);
  font: 700 15px var(--font-ui); color: var(--text-primary); flex-shrink: 0;
}
.chat-sidebar-body { flex: 1; overflow-y: auto; padding: 4px 8px; }
.chat-sidebar-section-label {
  padding: 12px 8px 4px; font: 600 11px var(--font-ui); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.6px;
}

.soul-channel-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  transition: background 0.12s; margin-bottom: 1px;
}
.soul-channel-item:hover  { background: var(--bg-overlay); }
.soul-channel-item.active { background: rgba(37,99,235,0.12); }
.channel-hash { font: 400 14px var(--font-ui); color: var(--text-tertiary); width: 16px; text-align: center; flex-shrink: 0; }
.channel-name { flex: 1; font: 500 13px var(--font-ui); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.soul-channel-item.active .channel-name { color: var(--text-primary); }
.channel-unread {
  min-width: 18px; height: 18px;
  background: var(--brand-blue); color: white;
  border-radius: 9px; padding: 0 5px;
  font: 700 11px var(--font-ui);
  display: flex; align-items: center; justify-content: center;
}

/* 채팅 메인 */
.chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.chat-main-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface); flex-shrink: 0;
}
.chat-main-title { flex: 1; }
.chat-main-name { font: 600 15px var(--font-ui); color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.chat-main-sub  { font: 400 12px var(--font-ui); color: var(--text-tertiary); margin-top: 2px; }

.chat-messages {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 2px;
}
.chat-messages::-webkit-scrollbar { width: 3px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

.chat-date-divider { display: flex; align-items: center; gap: 10px; padding: 16px 0 8px; }
.chat-date-divider::before, .chat-date-divider::after { content: ""; flex: 1; height: 1px; background: var(--border-subtle); }
.chat-date-label { font: 500 11px var(--font-ui); color: var(--text-tertiary); white-space: nowrap; }

.msg-group { display: flex; gap: 12px; padding: 3px 0; border-radius: 6px; }
.msg-group:hover { background: rgba(255,255,255,0.02); }
.msg-avatar-col { width: 36px; flex-shrink: 0; padding-top: 2px; }
.msg-body-col { flex: 1; min-width: 0; }
.msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.msg-sender-name { font: 600 14px var(--font-ui); color: var(--text-primary); }
.msg-timestamp    { font: 400 11px var(--font-ui); color: var(--text-tertiary); }
.msg-text { font: 400 14px/1.6 var(--font-body); color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; }
.msg-code {
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 6px; padding: 12px 14px; margin: 6px 0;
  font: 400 12px/1.6 var(--font-mono); color: #E2E8F0; overflow-x: auto;
}

.msg-group.user { flex-direction: row-reverse; }
.msg-group.user .msg-header { flex-direction: row-reverse; }
.msg-group.user .msg-text {
  background: var(--brand-blue); color: white;
  padding: 9px 14px; border-radius: 10px; border-bottom-right-radius: 3px;
  display: inline-block; max-width: 80%;
}

.msg-text.streaming::after {
  content: "▋"; color: var(--brand-cyan);
  animation: cursor-blink 0.7s step-end infinite;
}
@keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

.msg-typing .msg-text {
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  padding: 10px 14px; border-radius: 10px; border-bottom-left-radius: 3px;
  display: inline-flex; align-items: center; gap: 4px;
}
.typing-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }

/* 입력창 */
.chat-input-wrap { padding: 12px 20px 16px; border-top: 1px solid var(--border-subtle); flex-shrink: 0; }
.chat-input-box {
  display: flex; align-items: flex-end; gap: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 10px; padding: 10px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.chat-input-box:focus-within {
  border-color: rgba(37,99,235,0.4); box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}
.chat-textarea {
  flex: 1; background: transparent; border: none; outline: none;
  resize: none; max-height: 120px; min-height: 22px;
  font: 400 14px/1.5 var(--font-body); color: var(--text-primary); overflow-y: auto;
}
.chat-textarea::placeholder { color: var(--text-tertiary); }
.chat-send-btn {
  width: 32px; height: 32px; background: var(--brand-blue);
  border: none; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: white; flex-shrink: 0; transition: background 0.15s;
}
.chat-send-btn:hover { background: var(--brand-blue-h); }
.chat-send-btn:disabled { background: var(--bg-overlay); color: var(--text-tertiary); cursor: not-allowed; }
```

---

## 10. 설정/빌링

```css
.settings-layout { display: flex; height: 100%; }
.settings-nav {
  width: 200px; flex-shrink: 0;
  padding: 24px 12px; border-right: 1px solid var(--border-subtle);
}
.settings-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 7px;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: background 0.12s, color 0.12s; margin-bottom: 2px;
}
.settings-nav-item:hover  { background: var(--bg-overlay); color: var(--text-primary); }
.settings-nav-item.active { background: rgba(37,99,235,0.1); color: #93BBFC; }

.settings-content { flex: 1; padding: 32px 40px; overflow-y: auto; max-width: 760px; }
.settings-section-title { font: 700 20px var(--font-ui); color: var(--text-primary); margin-bottom: 24px; }
.settings-section-sub { font: 700 15px var(--font-ui); color: var(--text-primary); margin-bottom: 16px; margin-top: 28px; }

/* 빌링 */
.billing-plan-card {
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;
}
.billing-plan-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.billing-plan-name { font: 700 18px var(--font-ui); color: var(--text-primary); }
.billing-plan-meta { font: 400 13px var(--font-ui); color: var(--text-tertiary); margin-bottom: 14px; }
.billing-bar-label { display: flex; justify-content: space-between; font: 400 12px var(--font-ui); color: var(--text-tertiary); margin-bottom: 6px; }
.billing-bar-track { height: 6px; background: var(--bg-overlay); border-radius: 3px; overflow: hidden; }
.billing-bar-fill  { height: 100%; border-radius: 3px; background: var(--brand-blue); transition: width 0.8s ease; }
.billing-bar-fill[data-usage="caution"] { background: var(--warning); }
.billing-bar-fill[data-usage="danger"]  { background: var(--error); }

/* Soul별 사용량 */
.soul-usage-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border-subtle);
}
.soul-usage-row:last-child { border-bottom: none; }
.soul-usage-info { flex: 1; min-width: 0; }
.soul-usage-name { font: 500 13px var(--font-ui); color: var(--text-primary); }
.soul-usage-role { font: 400 11px var(--font-ui); color: var(--text-tertiary); }
.soul-usage-bar-wrap { width: 120px; }
.soul-usage-bar-track { height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
.soul-usage-bar-fill  { height: 100%; border-radius: 2px; background: var(--brand-blue); }
.soul-usage-stat { font: 500 12px var(--font-mono); color: var(--text-tertiary); text-align: right; width: 80px; white-space: nowrap; }

/* 토큰 충전 패키지 */
.token-packs { display: flex; gap: 12px; margin-top: 16px; }
.token-pack {
  flex: 1; background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 10px; padding: 16px; text-align: center; cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.token-pack:hover { border-color: var(--brand-blue); box-shadow: 0 0 0 1px rgba(37,99,235,0.2); }
.token-pack-amount { font: 700 16px var(--font-mono); color: var(--text-primary); margin-bottom: 4px; }
.token-pack-price  { font: 400 13px var(--font-ui); color: var(--text-tertiary); margin-bottom: 12px; }
.token-pack-btn {
  width: 100%; padding: 7px 0; background: var(--brand-blue); color: white;
  border: none; border-radius: 6px; font: 600 12px var(--font-ui); cursor: pointer;
  transition: background 0.15s;
}
.token-pack-btn:hover { background: var(--brand-blue-h); }
```

---

## 11. 반응형

```css
@media (max-width: 1200px) {
  .team-grid  { grid-template-columns: repeat(2, 1fr); }
  .hire-grid  { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1024px) {
  .sidebar { display: none; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .hire-filter-sidebar { display: none; }
  .settings-nav { display: none; }
  .token-packs  { flex-direction: column; }
  .chat-sidebar { display: none; }
  .app-content  { padding: 20px 16px; }
  .settings-content { padding: 24px 20px; }
}
@media (max-width: 560px) {
  .team-grid  { grid-template-columns: 1fr; }
  .hire-grid  { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
```
