# Next AI Crew — 디자인 시스템 v2 (Neon Dark)

> 2026-04-12 | Designer: Ivy | Kevin 지시
> 방향: ClawPoD 프로페셔널 + GuardianOps 하이테크
> 베이스: Pro UI v1.1 → v2 업그레이드
> 핵심: 딥 다크 + 네온 글로우 + 글래스모피즘

---

## 변경 요약 (v1.1 → v2)

| 항목 | v1.1 | v2 Neon |
|------|------|---------|
| 배경 base | `#0F1117` | `#080B12` (더 어둡게) |
| 배경 surface | `#161B27` | `#0D1120` |
| 배경 elevated | `#1E2536` | `#111827` |
| 카드 스타일 | solid border | 글래스모피즘 (backdrop-blur) |
| 브랜드 액센트 | flat `#2563EB` | 글로우 `#3B82F6` + shadow |
| 보조 액센트 | flat `#06B6D4` | 네온 cyan `#00D4FF` |
| 버튼 | solid | 글로우 hover |
| 차트 | 기본 | 네온 라인 + glow |

---

## 1. CSS 변수 (v2 전체)

```css
/* ═══════════════════════════════════════════════
   Next AI Crew — design-system-v2.css
   ClawPoD Professional × GuardianOps HiTech
   ═══════════════════════════════════════════════ */
:root {
  /* ─── 배경 계층 (더 어둡게) ─── */
  --bg-base:        #080B12;   /* 앱 최상위 — 거의 블랙 */
  --bg-surface:     #0D1120;   /* 카드/패널 */
  --bg-elevated:    #111827;   /* 드롭다운/모달 */
  --bg-overlay:     #1A2234;   /* 호버/선택 */

  /* ─── 글래스모피즘 ─── */
  --glass-bg:       rgba(13,17,32,0.7);
  --glass-border:   rgba(59,130,246,0.15);
  --glass-blur:     16px;
  --glass-bg-hover: rgba(13,17,32,0.85);

  /* ─── 테두리 ─── */
  --border-subtle:  rgba(255,255,255,0.05);
  --border-default: rgba(255,255,255,0.09);
  --border-strong:  rgba(255,255,255,0.16);
  --border-glow:    rgba(59,130,246,0.35);   /* 포커스/강조 */

  /* ─── 텍스트 ─── */
  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-tertiary:  #475569;
  --text-disabled:  #2D3A4E;

  /* ─── 브랜드 (네온 업그레이드) ─── */
  --brand-blue:     #3B82F6;           /* 메인 — 약간 밝게 */
  --brand-blue-h:   #2563EB;           /* hover */
  --brand-blue-glow: rgba(59,130,246,0.35);  /* glow shadow */
  --brand-cyan:     #00D4FF;           /* 강렬한 네온 시안 */
  --brand-cyan-glow: rgba(0,212,255,0.3);
  --brand-purple:   #8B5CF6;           /* 보조 퍼플 */
  --brand-purple-glow: rgba(139,92,246,0.3);

  /* ─── 시멘틱 ─── */
  --success:      #10B981;
  --success-glow: rgba(16,185,129,0.25);
  --warning:      #F59E0B;
  --warning-glow: rgba(245,158,11,0.25);
  --error:        #EF4444;
  --error-glow:   rgba(239,68,68,0.25);

  /* ─── 타이포 ─── */
  --font-ui:   "Inter", "Space Grotesk", -apple-system, sans-serif;
  --font-body: "Pretendard", "Inter", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* ─── 반경 ─── */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

---

## 2. 글래스모피즘 카드 (핵심 변경)

```css
/* ─── 글래스 카드 기본 ─── */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 4px 24px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative; overflow: hidden;
}
/* 상단 shimmer 라인 */
.glass-card::before {
  content: "";
  position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59,130,246,0.4) 30%,
    rgba(0,212,255,0.4) 70%,
    transparent 100%);
}
/* hover */
.glass-card:hover {
  background: var(--glass-bg-hover);
  border-color: var(--border-glow);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.5),
    0 0 0 1px rgba(59,130,246,0.2),
    inset 0 1px 0 rgba(255,255,255,0.08);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* ─── 기존 .card도 글래스 적용 ─── */
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 20px; overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  position: relative;
}
.card::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.3) 50%, transparent 100%);
}
```

---

## 3. 네온 버튼

```css
/* ─── Primary — 네온 글로우 ─── */
.btn-primary {
  background: var(--brand-blue);
  color: white; border: none;
  padding: 9px 18px; border-radius: 8px;
  font: 600 13px var(--font-ui);
  cursor: pointer;
  box-shadow: 0 0 16px var(--brand-blue-glow);
  transition: all 0.2s ease;
  position: relative; overflow: hidden;
}
.btn-primary::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}
.btn-primary:hover {
  background: #2563EB;
  box-shadow:
    0 0 24px var(--brand-blue-glow),
    0 0 48px rgba(59,130,246,0.2);
  transform: translateY(-1px);
}

/* ─── Cyan 버튼 ─── */
.btn-cyan {
  background: transparent;
  color: var(--brand-cyan); border: 1px solid rgba(0,212,255,0.4);
  padding: 9px 18px; border-radius: 8px;
  font: 600 13px var(--font-ui); cursor: pointer;
  box-shadow: 0 0 12px rgba(0,212,255,0.15), inset 0 0 12px rgba(0,212,255,0.05);
  transition: all 0.2s ease;
}
.btn-cyan:hover {
  background: rgba(0,212,255,0.1);
  border-color: var(--brand-cyan);
  box-shadow: 0 0 24px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,212,255,0.08);
}

/* ─── Ghost ─── */
.btn-secondary {
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: 9px 18px; border-radius: 8px;
  font: 500 13px var(--font-ui); cursor: pointer;
  transition: all 0.15s;
}
.btn-secondary:hover {
  border-color: var(--brand-blue-glow);
  background: rgba(59,130,246,0.05);
  color: var(--text-primary);
}
```

---

## 4. 네온 인풋

```css
.input {
  width: 100%; padding: 9px 13px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font: 400 14px var(--font-ui); color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  border-color: var(--brand-blue);
  box-shadow:
    0 0 0 3px rgba(59,130,246,0.12),
    0 0 16px rgba(59,130,246,0.1);
}
.input::placeholder { color: var(--text-tertiary); }
```

---

## 5. 아바타 (원형 유지 + 네온 보더)

```css
.avatar {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  font-weight: 700; flex-shrink: 0; user-select: none;
  position: relative;
}
.avatar-xs { width: 24px; height: 24px; font: 700 10px var(--font-ui); }
.avatar-sm { width: 32px; height: 32px; font: 700 12px var(--font-ui); }
.avatar-md { width: 40px; height: 40px; font: 700 14px var(--font-ui); }
.avatar-lg { width: 56px; height: 56px; font: 700 18px var(--font-ui); }
.avatar-xl { width: 72px; height: 72px; font: 700 22px var(--font-ui); }

/* 부서별 네온 컬러 */
.avatar-developer { background: rgba(59,130,246,0.2);   color: #93BBFC; box-shadow: 0 0 8px rgba(59,130,246,0.3); }
.avatar-designer  { background: rgba(0,212,255,0.15);    color: #67E8F9; box-shadow: 0 0 8px rgba(0,212,255,0.25); }
.avatar-pm        { background: rgba(245,158,11,0.15);   color: #FCD34D; box-shadow: 0 0 8px rgba(245,158,11,0.25); }
.avatar-security  { background: rgba(239,68,68,0.15);    color: #FCA5A5; box-shadow: 0 0 8px rgba(239,68,68,0.2); }
.avatar-qa        { background: rgba(16,185,129,0.15);   color: #6EE7B7; box-shadow: 0 0 8px rgba(16,185,129,0.25); }
.avatar-devops    { background: rgba(249,115,22,0.15);   color: #FDB07A; box-shadow: 0 0 8px rgba(249,115,22,0.2); }
.avatar-marketer  { background: rgba(236,72,153,0.15);   color: #F9A8D4; box-shadow: 0 0 8px rgba(236,72,153,0.2); }
.avatar-ea        { background: rgba(139,92,246,0.15);   color: #C4B5FD; box-shadow: 0 0 8px rgba(139,92,246,0.25); }
.avatar-cto       { background: rgba(0,212,255,0.15);    color: #67E8F9; box-shadow: 0 0 8px rgba(0,212,255,0.25); }
.avatar-ceo       { background: rgba(245,158,11,0.15);   color: #FCD34D; box-shadow: 0 0 8px rgba(245,158,11,0.3); }

/* Online 상태 → 글로우 링 */
.avatar.online::after {
  content: "";
  position: absolute; bottom: 1px; right: 1px;
  width: 9px; height: 9px; border-radius: 50%;
  background: #10B981;
  border: 2px solid var(--bg-base);
  box-shadow: 0 0 6px rgba(16,185,129,0.6);
}
```

---

## 6. 상태 도트 (네온)

```css
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.status-dot.online  {
  background: #10B981;
  box-shadow: 0 0 6px rgba(16,185,129,0.7), 0 0 12px rgba(16,185,129,0.3);
}
.status-dot.busy    { background: #F59E0B; box-shadow: 0 0 6px rgba(245,158,11,0.5); }
.status-dot.offline { background: #2D3A4E; }
```

---

## 7. 뱃지 (네온)

```css
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 5px; font: 500 11px var(--font-ui); }
.badge-blue   { background: rgba(59,130,246,0.12);  color: #93BBFC;  border: 1px solid rgba(59,130,246,0.2);  }
.badge-cyan   { background: rgba(0,212,255,0.1);    color: #67E8F9;  border: 1px solid rgba(0,212,255,0.2);   }
.badge-green  { background: rgba(16,185,129,0.12);  color: #6EE7B7;  border: 1px solid rgba(16,185,129,0.2);  }
.badge-amber  { background: rgba(245,158,11,0.12);  color: #FCD34D;  border: 1px solid rgba(245,158,11,0.2);  }
.badge-red    { background: rgba(239,68,68,0.12);   color: #FCA5A5;  border: 1px solid rgba(239,68,68,0.2);   }
.badge-purple { background: rgba(139,92,246,0.12);  color: #C4B5FD;  border: 1px solid rgba(139,92,246,0.2);  }
.badge-gray   { background: rgba(255,255,255,0.05); color: var(--text-tertiary); border: 1px solid var(--border-subtle); }
```

---

## 8. 카드 하단 네온 바 (v2)

```css
.card-bottom-bar {
  height: 3px;
  background: linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-cyan) 100%);
  border-radius: 0 0 12px 12px;
  margin: 12px -20px -20px;
  box-shadow: 0 0 8px rgba(59,130,246,0.4);
}
.card-bottom-bar.green  { background: var(--success); box-shadow: 0 0 8px var(--success-glow); }
.card-bottom-bar.amber  { background: var(--warning); box-shadow: 0 0 8px var(--warning-glow); }
.card-bottom-bar.red    { background: var(--error);   box-shadow: 0 0 8px var(--error-glow); }
.card-bottom-bar.cyan   { background: var(--brand-cyan); box-shadow: 0 0 8px var(--brand-cyan-glow); }
```

---

## 9. KPI 카드 (v2 네온)

```css
.summary-card {
  /* 글래스 카드 상속 */
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg); padding: 20px;
  position: relative; overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.summary-card::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent);
}
.summary-label {
  font: 500 11px var(--font-ui); color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}
.summary-value {
  font: 700 28px var(--font-mono); color: var(--text-primary);
  line-height: 1; margin-bottom: 4px;
  text-shadow: 0 0 20px rgba(59,130,246,0.3);  /* 숫자 은은한 글로우 */
}
.summary-sub { font: 400 12px var(--font-ui); color: var(--text-tertiary); }

/* KPI 증감 뱃지 */
.kpi-trend { font: 600 11px var(--font-ui); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; margin-top: 6px; }
.kpi-trend.up   { color: #FCA5A5; background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.2); }
.kpi-trend.down { color: #6EE7B7; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
```

---

## 10. 사이드바 (v2)

```css
.sidebar {
  width: 240px;
  background: rgba(8,11,18,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(59,130,246,0.1);
  box-shadow: 4px 0 24px rgba(0,0,0,0.4);
  display: flex; flex-direction: column;
  height: 100vh;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.nav-item:hover {
  background: rgba(59,130,246,0.08);
  color: var(--text-primary);
}
.nav-item.active {
  background: rgba(59,130,246,0.12);
  color: #93BBFC;
  box-shadow: inset 3px 0 0 var(--brand-blue);  /* 좌측 액티브 바 */
}
.nav-item.active svg { filter: drop-shadow(0 0 4px rgba(59,130,246,0.5)); }

/* 사이드바 Soul 아이템 */
.sidebar-soul-item {
  display: flex; align-items: center; gap: 9px;
  padding: 6px 10px; border-radius: 7px; cursor: pointer;
  transition: background 0.12s; margin-bottom: 1px;
}
.sidebar-soul-item:hover  { background: rgba(59,130,246,0.06); }
.sidebar-soul-item.active {
  background: rgba(59,130,246,0.1);
  box-shadow: inset 2px 0 0 var(--brand-cyan);
}
```

---

## 11. 채팅 입력창 (v2)

```css
.chat-input-box {
  display: flex; align-items: flex-end; gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 12px; padding: 10px 14px;
  transition: all 0.15s;
}
.chat-input-box:focus-within {
  border-color: rgba(59,130,246,0.4);
  box-shadow:
    0 0 0 3px rgba(59,130,246,0.08),
    0 0 20px rgba(59,130,246,0.08);
}
/* SSE 스트리밍 커서 — 네온 */
.msg-text.streaming::after {
  content: "▋"; color: var(--brand-cyan);
  text-shadow: 0 0 8px var(--brand-cyan);
  animation: cursor-blink 0.7s step-end infinite;
}
@keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
```

---

## 12. 차트 설정 (Chart.js 네온 테마)

```javascript
// ChartJS 글로벌 네온 설정
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
Chart.defaults.backgroundColor = 'rgba(59,130,246,0.1)';

// 네온 라인 차트 공통 dataset 스타일
const neonLineDataset = {
  borderColor: '#3B82F6',
  borderWidth: 2,
  pointBackgroundColor: '#3B82F6',
  pointRadius: 4,
  pointHoverRadius: 6,
  pointShadowBlur: 10,
  tension: 0.4,
  fill: true,
  backgroundColor: (ctx) => {
    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59,130,246,0.2)');
    gradient.addColorStop(1, 'rgba(59,130,246,0)');
    return gradient;
  }
};

// 네온 레이더 (Soul 역량)
const neonRadarDataset = {
  backgroundColor: 'rgba(59,130,246,0.1)',
  borderColor: '#3B82F6',
  borderWidth: 2,
  pointBackgroundColor: '#00D4FF',
  pointRadius: 4,
  pointHoverRadius: 6,
};
const neonRadarOptions = {
  scales: { r: {
    beginAtZero: true, max: 100,
    grid: { color: 'rgba(255,255,255,0.06)' },
    ticks: { display: false },
    pointLabels: {
      font: { size: 12, family: 'Inter' },
      color: '#94A3B8'
    }
  }},
  plugins: { legend: { display: false } }
};
```

---

## 13. 글로벌 앱 배경 (v2)

```css
body {
  background: var(--bg-base);
  /* 미묘한 그리드 패턴 — GuardianOps 스타일 */
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* 앱 셸 — 배경 노이즈 레이어 */
.app-shell {
  background: radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(59,130,246,0.08) 0%,
    transparent 60%
  );
}
```

---

## 14. 마이그레이션 가이드 (v1.1 → v2)

```diff
/* design-system.css */
- --bg-base: #0F1117;
+ --bg-base: #080B12;

- --bg-surface: #161B27;
+ --bg-surface: #0D1120;

/* 카드 */
- .card { background: var(--bg-surface); border: 1px solid var(--border-subtle); }
+ .card { background: var(--glass-bg); backdrop-filter: blur(16px); border: 1px solid var(--glass-border); }

/* 버튼 hover */
- .btn-primary:hover { background: #1D4ED8; }
+ .btn-primary:hover { background: #1D4ED8; box-shadow: 0 0 24px var(--brand-blue-glow); }

/* 아바타 glow */
- .avatar-developer { background: rgba(37,99,235,0.2); color: #93BBFC; }
+ .avatar-developer { background: rgba(59,130,246,0.2); color: #93BBFC; box-shadow: 0 0 8px rgba(59,130,246,0.3); }
```

---

## 15. 성능 주의사항

```css
/* backdrop-filter는 GPU 사용 — 카드가 많으면 성능 이슈 가능 */
/* 해결: will-change + 제한적 사용 */
.glass-card {
  will-change: transform;
  contain: layout style paint;
}

/* 저사양 기기 폴백 */
@media (prefers-reduced-motion: reduce) {
  .glass-card, .card {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--bg-elevated); /* solid 폴백 */
  }
}
```
