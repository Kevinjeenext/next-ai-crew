# 1. 메인 대시보드 — 에이전트 목록

> 레이아웃: 좌측 사이드바 + 우측 콘텐츠 (3열 그리드)

---

## 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  사이드바 (240px)       │  메인 콘텐츠                       │
│ ─────────────────────  │ ─────────────────────────────────── │
│  [로고]                 │  [헤더: 내 팀 / + Soul 추가]       │
│                         │                                    │
│  ■ 대시보드             │  [요약 카드 4개]                    │
│  ■ 내 Soul 팀           │  Active 3  /  Tasks 24  /          │
│  ■ Soul 채용            │  Tokens 70%  /  Plan: Team         │
│  ─────────────────────  │                                    │
│  내 팀 (3/15)           │  ─────────────────────────────     │
│  [Aria] Developer       │  내 Soul 팀 (3명)                   │
│  [Kai]  DevOps          │  ┌──────┐  ┌──────┐  ┌──────┐     │
│  [Luna] Designer        │  │카드1 │  │카드2 │  │카드3 │     │
│                         │  └──────┘  └──────┘  └──────┘     │
│  ─────────────────────  │                                    │
│  ■ 빌링                 │  ─────────────────────────────     │
│  ■ 설정                 │  최근 활동                          │
│                         │  [타임라인 형태]                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 사이드바 CSS

```css
.sidebar {
  width: 240px; flex-shrink: 0;
  height: 100vh;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden;
}

.sidebar-logo {
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border-subtle);
}
.sidebar-logo img { height: 28px; }

.sidebar-nav { padding: 8px; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 7px;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; text-decoration: none;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.nav-item:hover  { background: var(--bg-overlay); color: var(--text-primary); }
.nav-item.active { background: rgba(37,99,235,0.12); color: #93BBFC; }
.nav-item svg { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.7; }
.nav-item.active svg { opacity: 1; }

.sidebar-section-label {
  padding: 16px 10px 6px;
  font: 600 11px var(--font-ui);
  color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.6px;
}

/* 사이드바 Soul 목록 */
.sidebar-soul-item {
  display: flex; align-items: center; gap: 9px;
  padding: 6px 10px; border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;
}
.sidebar-soul-item:hover { background: var(--bg-overlay); }
.sidebar-soul-item.active { background: rgba(37,99,235,0.1); }
.sidebar-soul-name {
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sidebar-soul-role {
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
}
```

---

## 요약 카드 4개

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Active Souls   │  │ Tasks Today     │  │ Token Usage     │  │ Plan           │
│ 3              │  │ 24              │  │ 70%            │  │ Team           │
│ /15 정원       │  │ 완료 18         │  │ 1.4M / 2M      │  │ ↑ 업그레이드   │
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

```css
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 32px;
}
.summary-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px; padding: 16px 20px;
}
.summary-label {
  font: 500 12px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
}
.summary-value {
  font: 700 24px var(--font-ui); color: var(--text-primary);
  line-height: 1; margin-bottom: 4px;
}
.summary-sub {
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
}
@media (max-width: 1024px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Soul 팀 카드

```
┌──────────────────────────────────────┐
│  [Ar]  Aria                 ● Active │
│  (dev) Senior Developer              │
│  ──────────────────────────────────  │
│  React · Python · TypeScript         │
│  ──────────────────────────────────  │
│  오늘 12 tasks   이번 달 588K tokens │
│                                      │
│  [대화하기]              [설정]      │
└──────────────────────────────────────┘
```

```css
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px; margin-bottom: 32px;
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
.soul-card-top {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 14px;
}
.soul-card-name {
  font: 600 15px var(--font-ui); color: var(--text-primary);
  flex: 1;
}
.soul-card-role {
  font: 400 12px var(--font-ui); color: var(--text-secondary);
  margin-top: 2px;
}
.soul-skill-list {
  display: flex; flex-wrap: wrap; gap: 5px;
  margin-bottom: 14px;
}
.soul-skill-chip {
  padding: 3px 8px; border-radius: 4px;
  font: 500 11px var(--font-mono);
  background: var(--bg-overlay);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}
.soul-card-stats {
  display: flex; gap: 16px;
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  margin-bottom: 14px;
}
.soul-card-stats strong { color: var(--text-secondary); font-weight: 600; }
.soul-card-actions { display: flex; gap: 8px; }
.soul-chat-btn {
  flex: 1; padding: 8px 0;
  background: var(--brand-blue); color: white;
  border: none; border-radius: 7px;
  font: 600 13px var(--font-ui); cursor: pointer;
  transition: background 0.15s;
}
.soul-chat-btn:hover { background: var(--brand-blue-h); }
.soul-settings-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-overlay); border: 1px solid var(--border-default);
  border-radius: 7px; cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.15s;
}
.soul-settings-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
```

---

## 최근 활동 타임라인

```
최근 활동
─────────────────────────────────────────────────────
[Ar] Aria · Developer        코드 리뷰 완료: PR #142    14:35
[Kai] Kai · DevOps           배포 자동화 설정 완료       14:12
[Lu] Luna · Designer         랜딩 페이지 시안 공유        13:47
─────────────────────────────────────────────────────
```

```css
.activity-list { display: flex; flex-direction: column; }
.activity-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  font: 400 13px var(--font-ui); color: var(--text-secondary);
}
.activity-item:last-child { border-bottom: none; }
.activity-content { flex: 1; }
.activity-soul { font-weight: 600; color: var(--text-primary); }
.activity-time  { font: 400 11px var(--font-ui); color: var(--text-tertiary); flex-shrink: 0; }
```
