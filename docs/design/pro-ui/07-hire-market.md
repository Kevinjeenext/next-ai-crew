# /hire — Soul 마켓플레이스 (프로페셔널 버전)

> 2026-04-12 | Designer: Ivy
> 레이아웃: 3열 그리드 + 상단 필터바 (Linear 이슈 리스트 톤)

---

## 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│  [헤더] Soul 채용         [검색 🔍]                [내 팀 5/15] │
├─────────────────────────────────────────────────────────────────┤
│  [필터 바]  역할 ▼   스킬 ▼   레벨 ▼   [초기화 ×]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Soul 카드   │  │ Soul 카드   │  │ Soul 카드   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Soul 카드   │  │ Soul 카드   │  │ Soul 카드   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  총 20개 프리셋  ·  내 팀에 5명                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 상단 필터 바 (좌측 사이드바 대신)

```css
.hire-header {
  padding: 24px 32px 0;
  flex-shrink: 0;
}
.hire-top-row {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
}
.hire-title {
  font: 700 20px var(--font-ui); color: var(--text-primary); flex: 1;
}
.hire-team-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
}
.hire-team-bar {
  width: 60px; height: 4px;
  background: var(--bg-overlay); border-radius: 2px; overflow: hidden;
}
.hire-team-bar-fill { height: 100%; background: var(--brand-blue); border-radius: 2px; }

/* 필터 바 */
.hire-filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 0 32px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.filter-dropdown-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 7px;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.filter-dropdown-btn:hover { border-color: var(--border-strong); background: var(--bg-overlay); color: var(--text-primary); }
.filter-dropdown-btn.active {
  border-color: var(--brand-blue);
  background: rgba(37,99,235,0.08);
  color: #93BBFC;
}
.filter-dropdown-btn svg { width: 14px; height: 14px; opacity: 0.6; }
.filter-spacer { flex: 1; }
.filter-reset-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; background: transparent; border: none;
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
  cursor: pointer; transition: color 0.12s; border-radius: 7px;
}
.filter-reset-btn:hover { color: var(--text-secondary); background: var(--bg-overlay); }

/* 필터 활성 태그 */
.filter-active-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 32px; flex-shrink: 0; }
.filter-tag {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 5px;
  background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2);
  font: 500 12px var(--font-ui); color: #93BBFC;
}
.filter-tag-remove {
  background: transparent; border: none; cursor: pointer;
  color: rgba(147,187,252,0.6); line-height: 1;
  padding: 0; font-size: 14px;
  transition: color 0.12s;
}
.filter-tag-remove:hover { color: #93BBFC; }
```

---

## Soul 카드 (마켓플레이스 최적화)

```
┌──────────────────────────────────────────────────────────┐
│  [Ar]  Aria                               ● Online       │
│  (dev) Senior Developer                                  │
│  개발팀 · 경력 5년+                                      │
│                                                          │
│  ──────────────────────────────────────────────────      │
│  React   Python   TypeScript   Node.js   +2              │
│  ──────────────────────────────────────────────────      │
│                                                          │
│  꼼꼼함  ████████░░                                      │
│  창의성  ██████░░░░                                      │
│  속도    ██████████                                      │
│                                                          │
│  ──────────────────────────────────────────────────      │
│  "코드는 시(詩)다. 나는 매일 한 줄씩                    │
│   더 나은 시를 쓴다."                                    │
│  ──────────────────────────────────────────────────      │
│                                                          │
│  [       채용하기       ]  [프로필]                      │
└──────────────────────────────────────────────────────────┘
```

```css
.hire-grid-area {
  flex: 1; overflow-y: auto; padding: 20px 32px 32px;
}
.hire-grid-area::-webkit-scrollbar { width: 4px; }
.hire-grid-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

.hire-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* Soul 마켓 카드 */
.hire-market-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 0;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.hire-market-card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}
.hire-market-card.is-hired {
  border-color: rgba(16,185,129,0.25);
  background: rgba(16,185,129,0.03);
}

/* 카드 헤더 */
.hmc-head {
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;
}
.hmc-meta   { flex: 1; min-width: 0; }
.hmc-name   { font: 600 15px var(--font-ui); color: var(--text-primary); margin-bottom: 3px; }
.hmc-role   { font: 400 12px var(--font-ui); color: var(--text-secondary); margin-bottom: 3px; }
.hmc-detail { font: 400 11px var(--font-ui); color: var(--text-tertiary); }

/* 스킬 (최대 4개 + 나머지 +N) */
.hmc-skills {
  display: flex; flex-wrap: wrap; gap: 4px;
  padding: 12px 0; margin: 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 12px;
}
.hmc-skill {
  padding: 2px 7px; border-radius: 4px;
  font: 500 11px var(--font-mono);
  background: var(--bg-overlay); color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}
.hmc-skill-more {
  padding: 2px 7px; border-radius: 4px;
  font: 500 11px var(--font-ui); color: var(--text-tertiary);
}

/* 성격 바 (3개) */
.hmc-pbars { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.hmc-pbar-row { display: flex; align-items: center; gap: 7px; }
.hmc-pbar-label {
  width: 32px; font: 400 10px var(--font-ui); color: var(--text-tertiary);
  flex-shrink: 0; font-variant-numeric: tabular-nums;
}
.hmc-pbar-track {
  flex: 1; height: 3px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden;
}
.hmc-pbar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
.hmc-pbar-fill.thoroughness { background: #3B82F6; }
.hmc-pbar-fill.creativity   { background: #06B6D4; }
.hmc-pbar-fill.speed        { background: #10B981; }
.hmc-pbar-fill.teamwork     { background: #8B5CF6; }

/* 한 줄 소개 */
.hmc-quote {
  font: 400 12px/1.65 var(--font-body); color: var(--text-tertiary);
  font-style: italic;
  padding: 10px 0; border-top: 1px solid var(--border-subtle); margin-bottom: 14px;
  flex: 1;
}

/* 채용 버튼 */
.hmc-actions { display: flex; gap: 8px; margin-top: auto; }
.hmc-hire-btn {
  flex: 1; padding: 9px 0;
  background: var(--brand-blue); color: white;
  border: none; border-radius: 8px;
  font: 600 13px var(--font-ui); cursor: pointer;
  transition: background 0.15s;
}
.hmc-hire-btn:hover { background: var(--brand-blue-h); }
.hmc-hire-btn.hired {
  background: rgba(16,185,129,0.12); color: #6EE7B7;
  border: 1px solid rgba(16,185,129,0.2); cursor: default;
}
.hmc-profile-btn {
  padding: 9px 12px; background: transparent;
  border: 1px solid var(--border-default); border-radius: 8px;
  font: 500 12px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;
}
.hmc-profile-btn:hover { border-color: var(--border-strong); background: var(--bg-overlay); }
```

---

## Soul 프로필 모달 (채용 버튼 클릭)

```
┌──────────────────────────────────────────────────────────────┐
│  [×]                                                         │
│                                                              │
│  [Ar 56px]  Aria                           ● Online         │
│             Senior Developer · 개발팀 · 경력 5년+           │
│                                                              │
│  ──────────────────────────────────────────────────────      │
│                                                              │
│  💼 담당 업무 선택                                           │
│  다음 업무를 담당할 Soul을 선택하세요.                       │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ ✓ 코드 리뷰        │  │   API 개발         │            │
│  └────────────────────┘  └────────────────────┘            │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   버그 수정        │  │   기술 문서 작성   │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                              │
│  📝 추가 지시 사항 (선택)                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 예) 우리 프로덕트는 Next.js + Python FastAPI 스택...   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│  정원 12/15명 이용 가능      [ 취소 ]  [ 채용 확정 → ]      │
└──────────────────────────────────────────────────────────────┘
```

```css
/* 모달 오버레이 */
.hire-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 500;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* 모달 박스 */
.hire-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  width: 540px; max-width: 90vw;
  max-height: 85vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  animation: modalIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:none; } }

.hire-modal-header {
  display: flex; align-items: center; justify-content: flex-end;
  padding: 16px 20px 0;
}
.hire-modal-body { padding: 20px 28px 28px; }
.hire-modal-soul {
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
}
.hire-modal-soul-info { flex: 1; }
.hire-modal-soul-name { font: 700 18px var(--font-ui); color: var(--text-primary); margin-bottom: 4px; }
.hire-modal-soul-meta { font: 400 13px var(--font-ui); color: var(--text-secondary); }

.hire-modal-section-title {
  font: 600 13px var(--font-ui); color: var(--text-secondary);
  margin-bottom: 12px; display: flex; align-items: center; gap: 7px;
}

/* 업무 선택 그리드 */
.task-select-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px;
}
.task-select-item {
  padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--border-default);
  font: 400 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.task-select-item:hover { border-color: var(--border-strong); background: var(--bg-overlay); }
.task-select-item.selected {
  border-color: var(--brand-blue);
  background: rgba(37,99,235,0.08); color: #93BBFC;
}
.task-select-item.selected::before { content: "✓  "; }

/* 모달 푸터 */
.hire-modal-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 28px;
  border-top: 1px solid var(--border-subtle);
}
.hire-modal-capacity {
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  display: flex; align-items: center; gap: 6px;
}
.hire-modal-capacity strong { color: var(--text-secondary); }
.hire-modal-actions { display: flex; gap: 8px; }
```

---

## 반응형

```css
@media (max-width: 1200px) {
  .hire-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .hire-filter-bar { padding: 0 16px 12px; overflow-x: auto; flex-wrap: nowrap; }
  .hire-grid-area  { padding: 16px; }
  .hire-grid { grid-template-columns: 1fr; }
  .hire-modal { width: 95vw; max-height: 90vh; }
  .task-select-grid { grid-template-columns: 1fr; }
}
```
