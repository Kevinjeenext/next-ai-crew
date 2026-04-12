# 4. 설정/빌링 — 프로페셔널 대시보드

---

## 전체 레이아웃

```
┌────────────────────────────────────────────────────────────┐
│  [← 대시보드]  설정                                        │
├──────────────────┬─────────────────────────────────────────┤
│  설정 탭 (200px) │  콘텐츠 영역                             │
│                  │                                         │
│  ■ 일반          │                                         │
│  ■ 내 팀 (Soul)  │                                         │
│  ■ 빌링    ←     │                                         │
│  ■ 보안          │                                         │
│  ■ 알림          │                                         │
└──────────────────┴─────────────────────────────────────────┘
```

---

## 빌링 탭

```
┌─────────────────────────────────────────────────────────┐
│  현재 플랜                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Team                              [플랜 변경 →] │   │
│  │  ₩99,000 / 월 · 결제일 2026-05-12 (30일 남음)    │   │
│  │  Soul 정원: ████████████░░░░  12 / 15명           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  토큰 사용량                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  이번 달                    [+ 토큰 충전]         │   │
│  │  1,400,000 / 2,000,000   70%                     │   │
│  │  ████████████████░░░░░░░░░░░░  caution           │   │
│  │  리셋: 30일 후                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Soul별 사용량                          [전체 보기 →]   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Ar] Aria · Developer   ████████░░  42%  588K   │   │
│  │  [Ka] Kai · DevOps       ████░░░░░░  18%  252K   │   │
│  │  [Lu] Luna · Designer    ███░░░░░░░  10%  140K   │   │
│  │  기타 (9명)              ██████░░░░  30%  420K   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  충전 패키지                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ +500K    │  │ +2M      │  │ +10M     │              │
│  │ ₩9,900   │  │ ₩29,000  │  │ ₩99,000  │              │
│  │ [충전]   │  │ [충전]   │  │ [충전]   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

```css
/* 설정 탭 레이아웃 */
.settings-layout {
  display: flex; height: 100%;
}
.settings-nav {
  width: 200px; flex-shrink: 0;
  padding: 24px 12px;
  border-right: 1px solid var(--border-subtle);
}
.settings-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 7px;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: background 0.12s, color 0.12s;
  margin-bottom: 2px;
}
.settings-nav-item:hover  { background: var(--bg-overlay); color: var(--text-primary); }
.settings-nav-item.active { background: rgba(37,99,235,0.1); color: #93BBFC; }

.settings-content { flex: 1; padding: 32px 40px; overflow-y: auto; max-width: 760px; }
.settings-section-title {
  font: 700 20px var(--font-ui); color: var(--text-primary);
  margin-bottom: 24px;
}

/* 플랜 카드 */
.billing-plan-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px; padding: 20px 24px;
  margin-bottom: 16px;
}
.billing-plan-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
}
.billing-plan-name {
  font: 700 18px var(--font-ui); color: var(--text-primary);
}
.billing-plan-meta {
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 14px;
}
.billing-capacity-bar {
  margin-bottom: 4px;
}
.billing-capacity-label {
  display: flex; justify-content: space-between;
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 6px;
}
.billing-bar-track {
  height: 6px; background: var(--bg-overlay); border-radius: 3px; overflow: hidden;
}
.billing-bar-fill {
  height: 100%; border-radius: 3px; background: var(--brand-blue);
  transition: width 0.8s ease;
}
.billing-bar-fill[data-usage="caution"] { background: var(--warning); }
.billing-bar-fill[data-usage="danger"]  { background: var(--error); }

/* Soul별 사용량 */
.soul-usage-table { display: flex; flex-direction: column; gap: 0; }
.soul-usage-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border-subtle);
}
.soul-usage-row:last-child { border-bottom: none; }
.soul-usage-info { flex: 1; min-width: 0; }
.soul-usage-name {
  font: 500 13px var(--font-ui); color: var(--text-primary);
}
.soul-usage-role {
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
}
.soul-usage-bar-wrap { width: 120px; }
.soul-usage-bar-track {
  height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden;
}
.soul-usage-bar-fill {
  height: 100%; border-radius: 2px; background: var(--brand-blue);
}
.soul-usage-stat {
  font: 500 12px var(--font-mono); color: var(--text-tertiary);
  text-align: right; width: 80px; white-space: nowrap;
}

/* 충전 패키지 */
.token-packs {
  display: flex; gap: 12px; margin-top: 16px;
}
.token-pack {
  flex: 1; background: var(--bg-surface);
  border: 1px solid var(--border-default); border-radius: 10px;
  padding: 16px; text-align: center; cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.token-pack:hover {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 1px rgba(37,99,235,0.2);
}
.token-pack-amount {
  font: 700 16px var(--font-mono); color: var(--text-primary);
  margin-bottom: 4px;
}
.token-pack-price {
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 12px;
}
.token-pack-btn {
  width: 100%; padding: 7px 0;
  background: var(--brand-blue); color: white;
  border: none; border-radius: 6px;
  font: 600 12px var(--font-ui); cursor: pointer;
  transition: background 0.15s;
}
.token-pack-btn:hover { background: var(--brand-blue-h); }
```

---

## 반응형

```css
/* 태블릿 (768px) */
@media (max-width: 1024px) {
  .sidebar { display: none; }          /* 사이드바 → 햄버거 메뉴 */
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .team-grid  { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .hire-filter-sidebar { display: none; } /* 채용 필터 → 바텀시트 */
  .settings-nav { display: none; }        /* 설정 탭 → 드롭다운 */
  .token-packs  { flex-direction: column; }
}
@media (max-width: 560px) {
  .team-grid { grid-template-columns: 1fr; }
  .chat-sidebar { display: none; }      /* 채팅 사이드바 → 햄버거 */
}
```
