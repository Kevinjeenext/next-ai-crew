# 2. Soul 채용 페이지 — 프로페셔널 카탈로그

> 레이아웃: 필터 사이드바(220px) + 카드 그리드 (Notion DB 뷰 스타일)

---

## 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  [헤더: Soul 채용   검색창                    [내 팀 5/15 ▼]]│
├────────────────────┬─────────────────────────────────────────┤
│  필터 (220px)      │  Soul 카드 그리드                       │
│                    │                                         │
│  역할              │  ┌───────┐  ┌───────┐  ┌───────┐       │
│  □ 개발자          │  │ 카드  │  │ 카드  │  │ 카드  │       │
│  □ 디자이너        │  └───────┘  └───────┘  └───────┘       │
│  □ PM              │  ┌───────┐  ┌───────┐  ┌───────┐       │
│  □ 보안            │  │ 카드  │  │ 카드  │  │ 카드  │       │
│  ...               │  └───────┘  └───────┘  └───────┘       │
│                    │                                         │
│  스킬              │                                         │
│  □ React           │                                         │
│  □ Python          │                                         │
│  ...               │                                         │
└────────────────────┴─────────────────────────────────────────┘
```

---

## 필터 사이드바

```css
.hire-filter-sidebar {
  width: 220px; flex-shrink: 0;
  padding: 20px 16px;
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
}
.filter-section-title {
  font: 600 11px var(--font-ui);
  color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.6px;
  margin-bottom: 8px;
}
.filter-checkbox-row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 0; cursor: pointer;
}
.filter-checkbox-row input[type="checkbox"] { accent-color: var(--brand-blue); }
.filter-checkbox-label {
  font: 400 13px var(--font-ui); color: var(--text-secondary);
}
.filter-count {
  margin-left: auto;
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
}
```

---

## Soul 프로페셔널 카드

```
┌───────────────────────────────────────────┐
│  [Ar]  Aria                     ● Online  │  ← 이니셜 아바타 + 상태
│        Senior Developer                   │
│        개발팀                              │
│                                           │
│  React · Python · TypeScript · API        │  ← 스킬 (JetBrains Mono)
│                                           │
│  ────────────────────────────────────     │
│  꼼꼼함  ████████░░  78%                  │  ← 얇은 프로그레스 바
│  창의성  ██████░░░░  60%                  │
│  속도    ██████████  95%                  │
│                                           │
│  "코드는 시(詩)다."                        │  ← 한 줄 소개 (따옴표)
│                                           │
│  ────────────────────────────────────     │
│  [채용하기]              [프로필 보기 →]  │
└───────────────────────────────────────────┘
```

```css
.hire-card-pro {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 20px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  cursor: default;
}
.hire-card-pro:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}
/* 채용됨 */
.hire-card-pro.hired {
  border-color: rgba(16,185,129,0.3);
  box-shadow: 0 0 0 1px rgba(16,185,129,0.1);
}

/* 헤더 */
.hire-card-head {
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;
}
.hire-card-meta { flex: 1; min-width: 0; }
.hire-card-name {
  font: 600 15px var(--font-ui); color: var(--text-primary);
  margin-bottom: 3px;
}
.hire-card-role {
  font: 400 12px var(--font-ui); color: var(--text-secondary);
  margin-bottom: 2px;
}
.hire-card-dept {
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
}

/* 스킬 */
.hire-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
.hire-skill  {
  padding: 2px 7px; border-radius: 4px;
  font: 500 11px var(--font-mono);
  background: var(--bg-overlay);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

/* 성격 프로그레스 바 */
.personality-bars { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pbar-row { display: flex; align-items: center; gap: 8px; }
.pbar-label {
  width: 36px; font: 400 11px var(--font-ui);
  color: var(--text-tertiary); flex-shrink: 0;
}
.pbar-track {
  flex: 1; height: 4px;
  background: var(--bg-overlay); border-radius: 2px; overflow: hidden;
}
.pbar-fill {
  height: 100%; border-radius: 2px;
  background: var(--brand-blue);
  transition: width 0.6s ease;
}
.pbar-pct { font: 500 11px var(--font-mono); color: var(--text-tertiary); width: 28px; text-align: right; }

/* 한 줄 소개 */
.hire-quote {
  font: 400 12px/1.6 var(--font-body); color: var(--text-tertiary);
  font-style: italic; padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px;
}

/* 액션 버튼 */
.hire-actions { display: flex; gap: 8px; }
.hire-btn-primary {
  flex: 1; padding: 8px 0;
  background: var(--brand-blue); color: white;
  border: none; border-radius: 7px;
  font: 600 13px var(--font-ui); cursor: pointer;
  transition: background 0.15s;
}
.hire-btn-primary:hover { background: var(--brand-blue-h); }
.hire-btn-primary.hired { background: var(--bg-overlay); color: var(--text-tertiary); cursor: not-allowed; }
.hire-btn-ghost {
  padding: 8px 12px;
  background: transparent; border: 1px solid var(--border-default);
  border-radius: 7px; font: 500 12px var(--font-ui);
  color: var(--text-secondary); cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;
}
.hire-btn-ghost:hover { border-color: var(--border-strong); background: var(--bg-overlay); }
```

---

## Soul 채용 온보딩 (슬라이드오버)

채용 버튼 클릭 → 우측 슬라이드오버 480px

```
┌─────────────────────────────────────────────┐
│  [×]  Aria 채용                              │
│  Senior Developer                           │
│  ─────────────────────────────────────────  │
│                                             │
│  💼 담당 업무                                │
│  ┌────────────────┐  ┌────────────────┐     │
│  │ ✓ 코드 리뷰    │  │   API 개발     │     │
│  └────────────────┘  └────────────────┘     │
│  ┌────────────────┐  ┌────────────────┐     │
│  │   버그 수정    │  │   문서 작성    │     │
│  └────────────────┘  └────────────────┘     │
│                                             │
│  📝 추가 설명 (선택)                         │
│  ┌─────────────────────────────────────┐   │
│  │ 예) 우리 백엔드 API 개발...          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ─────────────────────────────────────────  │
│                  [ 취소 ]  [ 채용 확정 → ]  │
└─────────────────────────────────────────────┘
```
