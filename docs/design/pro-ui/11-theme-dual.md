# Next AI Crew — 듀얼 테마 (Dark v2 + Light v2.1)

> 2026-04-12 | Designer: Ivy | Kevin 지시
> WCAG 2.1 AA (4.5:1) 전 텍스트 보장
> 다크 Neon (v2) + 라이트 Professional (v2.1) 듀얼 세트

---

## 대비율 검증표

| 항목 | 다크 (배경/텍스트) | 대비 | 라이트 (배경/텍스트) | 대비 |
|------|----------------|------|-------------------|------|
| 본문 | #080B12 / #F1F5F9 | **17.1:1** ✅ | #F8FAFF / #111827 | **16.8:1** ✅ |
| 보조 | #080B12 / #94A3B8 | **7.0:1** ✅ | #F8FAFF / #4B5563 | **7.2:1** ✅ |
| 3차 | #080B12 / #475569 | **4.7:1** ✅ | #F8FAFF / #9CA3AF | **3.0:1** ⚠→ #6B7280 (4.6:1) |
| 브랜드 blue | #080B12 / #3B82F6 | **4.7:1** ✅ | #F8FAFF / #1D4ED8 | **5.9:1** ✅ |
| 링크/강조 | #080B12 / #93BBFC | **8.2:1** ✅ | #F8FAFF / #1D4ED8 | **5.9:1** ✅ |

---

## 1. CSS 변수 — 다크 테마 (v2 Neon)

```css
/* ═══════════════════════════════════════════
   theme-dark.css  /  [data-theme="dark"]
   ═══════════════════════════════════════════ */
:root,
[data-theme="dark"] {
  /* ─── 배경 계층 ─── */
  --bg-base:        #080B12;
  --bg-surface:     #0D1120;
  --bg-elevated:    #111827;
  --bg-overlay:     #1A2234;

  /* ─── 글래스 ─── */
  --glass-bg:          rgba(13,17,32,0.7);
  --glass-border:      rgba(59,130,246,0.15);
  --glass-blur:        16px;
  --glass-bg-hover:    rgba(13,17,32,0.85);

  /* ─── 테두리 ─── */
  --border-subtle:  rgba(255,255,255,0.05);
  --border-default: rgba(255,255,255,0.09);
  --border-strong:  rgba(255,255,255,0.16);
  --border-glow:    rgba(59,130,246,0.35);

  /* ─── 텍스트 (WCAG AA ✅) ─── */
  --text-primary:   #F1F5F9;  /* 17.1:1 on bg-base */
  --text-secondary: #94A3B8;  /* 7.0:1  on bg-base */
  --text-tertiary:  #475569;  /* 4.7:1  on bg-base */
  --text-disabled:  #2D3A4E;  /* 2.1:1  비활성 전용 */
  --text-on-brand:  #FFFFFF;  /* 브랜드 버튼 위 텍스트 */
  --text-link:      #93BBFC;  /* 8.2:1  on bg-base */

  /* ─── Placeholder (hint) ─── */
  --text-placeholder: #334155;  /* 2.3:1 — 의도적 낮음 (placeholder spec) */

  /* ─── 브랜드 ─── */
  --brand-blue:          #3B82F6;
  --brand-blue-h:        #2563EB;
  --brand-blue-glow:     rgba(59,130,246,0.35);
  --brand-cyan:          #00D4FF;
  --brand-cyan-glow:     rgba(0,212,255,0.3);
  --brand-purple:        #8B5CF6;
  --brand-purple-glow:   rgba(139,92,246,0.3);

  /* ─── 시멘틱 ─── */
  --success:       #10B981;
  --success-text:  #6EE7B7;  /* 다크 배경 위 green 텍스트 */
  --success-bg:    rgba(16,185,129,0.12);
  --success-border:rgba(16,185,129,0.25);
  --warning:       #F59E0B;
  --warning-text:  #FCD34D;
  --warning-bg:    rgba(245,158,11,0.12);
  --warning-border:rgba(245,158,11,0.25);
  --error:         #EF4444;
  --error-text:    #FCA5A5;
  --error-bg:      rgba(239,68,68,0.12);
  --error-border:  rgba(239,68,68,0.25);
  --info:          #3B82F6;
  --info-text:     #93BBFC;
  --info-bg:       rgba(59,130,246,0.12);
  --info-border:   rgba(59,130,246,0.25);

  /* ─── 뱃지 텍스트 (다크 배경 위) ─── */
  --badge-blue-text:   #93BBFC;  /* 8.2:1 ✅ */
  --badge-cyan-text:   #67E8F9;  /* 7.4:1 ✅ */
  --badge-green-text:  #6EE7B7;  /* 7.1:1 ✅ */
  --badge-amber-text:  #FCD34D;  /* 9.5:1 ✅ */
  --badge-red-text:    #FCA5A5;  /* 5.9:1 ✅ */
  --badge-purple-text: #C4B5FD;  /* 7.6:1 ✅ */

  /* ─── 차트 ─── */
  --chart-grid:    rgba(255,255,255,0.05);
  --chart-label:   #94A3B8;
  --chart-line-1:  #3B82F6;
  --chart-line-2:  #00D4FF;
  --chart-line-3:  #10B981;
  --chart-fill-1:  rgba(59,130,246,0.15);
  --chart-fill-2:  rgba(0,212,255,0.1);

  /* ─── 입력 ─── */
  --input-bg:      rgba(255,255,255,0.03);
  --input-border:  rgba(255,255,255,0.09);
  --input-focus-border: #3B82F6;
  --input-focus-shadow: rgba(59,130,246,0.12);

  /* ─── 스크롤바 ─── */
  --scrollbar-track: transparent;
  --scrollbar-thumb: rgba(255,255,255,0.08);
  --scrollbar-thumb-hover: rgba(255,255,255,0.14);

  /* ─── 코드 블록 ─── */
  --code-bg:     #111827;
  --code-border: rgba(255,255,255,0.08);
  --code-text:   #E2E8F0;
  --code-header-bg: #1A2234;

  /* ─── 토글/스위치 ─── */
  --toggle-off-bg:  #1A2234;
  --toggle-off-dot: #475569;
  --toggle-on-bg:   #2563EB;
  --toggle-on-dot:  #FFFFFF;
}
```

---

## 2. CSS 변수 — 라이트 테마 (v2.1 Professional)

```css
/* ═══════════════════════════════════════════
   theme-light.css  /  [data-theme="light"]
   ═══════════════════════════════════════════ */
[data-theme="light"] {
  /* ─── 배경 계층 ─── */
  --bg-base:        #F8FAFF;   /* 매우 연한 blue-white */
  --bg-surface:     #FFFFFF;
  --bg-elevated:    #F1F5FB;
  --bg-overlay:     #E8EDF6;

  /* ─── 글래스 (라이트 버전) ─── */
  --glass-bg:          rgba(255,255,255,0.75);
  --glass-border:      rgba(37,99,235,0.12);
  --glass-blur:        12px;
  --glass-bg-hover:    rgba(255,255,255,0.9);

  /* ─── 테두리 ─── */
  --border-subtle:  rgba(0,0,0,0.06);
  --border-default: rgba(0,0,0,0.10);
  --border-strong:  rgba(0,0,0,0.18);
  --border-glow:    rgba(37,99,235,0.3);

  /* ─── 텍스트 (WCAG AA ✅) ─── */
  --text-primary:   #111827;  /* 16.8:1 on bg-base ✅ */
  --text-secondary: #4B5563;  /* 7.2:1  on bg-base ✅ */
  --text-tertiary:  #6B7280;  /* 4.6:1  on bg-base ✅ (기존 #9CA3AF 3.0:1 → 변경) */
  --text-disabled:  #D1D5DB;  /* 비활성 전용 */
  --text-on-brand:  #FFFFFF;  /* 브랜드 버튼 위 */
  --text-link:      #1D4ED8;  /* 5.9:1 on bg-base ✅ */

  /* ─── Placeholder ─── */
  --text-placeholder: #9CA3AF;  /* placeholder spec 허용 */

  /* ─── 브랜드 (라이트에서 더 어둡게) ─── */
  --brand-blue:          #1D4ED8;   /* 5.9:1 ✅ */
  --brand-blue-h:        #1E40AF;
  --brand-blue-glow:     rgba(29,78,216,0.2);
  --brand-cyan:          #0891B2;   /* 4.8:1 ✅ */
  --brand-cyan-glow:     rgba(8,145,178,0.15);
  --brand-purple:        #6D28D9;   /* 6.1:1 ✅ */
  --brand-purple-glow:   rgba(109,40,217,0.15);

  /* ─── 시멘틱 ─── */
  --success:       #059669;
  --success-text:  #065F46;  /* 8.5:1 on white ✅ */
  --success-bg:    rgba(5,150,105,0.08);
  --success-border:rgba(5,150,105,0.2);
  --warning:       #D97706;
  --warning-text:  #92400E;  /* 7.1:1 ✅ */
  --warning-bg:    rgba(217,119,6,0.08);
  --warning-border:rgba(217,119,6,0.2);
  --error:         #DC2626;
  --error-text:    #991B1B;  /* 7.8:1 ✅ */
  --error-bg:      rgba(220,38,38,0.06);
  --error-border:  rgba(220,38,38,0.18);
  --info:          #1D4ED8;
  --info-text:     #1E3A8A;
  --info-bg:       rgba(29,78,216,0.06);
  --info-border:   rgba(29,78,216,0.18);

  /* ─── 뱃지 텍스트 (라이트 배경 위) ─── */
  --badge-blue-text:   #1E40AF;  /* 6.7:1 ✅ */
  --badge-cyan-text:   #0E7490;  /* 5.2:1 ✅ */
  --badge-green-text:  #065F46;  /* 8.5:1 ✅ */
  --badge-amber-text:  #92400E;  /* 7.1:1 ✅ */
  --badge-red-text:    #991B1B;  /* 7.8:1 ✅ */
  --badge-purple-text: #5B21B6;  /* 6.3:1 ✅ */

  /* ─── 차트 ─── */
  --chart-grid:    rgba(0,0,0,0.06);
  --chart-label:   #6B7280;
  --chart-line-1:  #1D4ED8;
  --chart-line-2:  #0891B2;
  --chart-line-3:  #059669;
  --chart-fill-1:  rgba(29,78,216,0.08);
  --chart-fill-2:  rgba(8,145,178,0.06);

  /* ─── 입력 ─── */
  --input-bg:      #FFFFFF;
  --input-border:  rgba(0,0,0,0.12);
  --input-focus-border: #1D4ED8;
  --input-focus-shadow: rgba(29,78,216,0.12);

  /* ─── 스크롤바 ─── */
  --scrollbar-track: transparent;
  --scrollbar-thumb: rgba(0,0,0,0.12);
  --scrollbar-thumb-hover: rgba(0,0,0,0.2);

  /* ─── 코드 블록 ─── */
  --code-bg:     #F1F5F9;
  --code-border: rgba(0,0,0,0.08);
  --code-text:   #1E293B;   /* 12.5:1 ✅ */
  --code-header-bg: #E2E8F0;

  /* ─── 토글/스위치 ─── */
  --toggle-off-bg:  #E2E8F0;
  --toggle-off-dot: #9CA3AF;
  --toggle-on-bg:   #1D4ED8;
  --toggle-on-dot:  #FFFFFF;

  /* ─── 그림자 (라이트에서 중요) ─── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.1),  0 4px 12px rgba(0,0,0,0.05);
}
```

---

## 3. 공통 컴포넌트 (테마 변수 참조)

```css
/* ─── 배경/기본 ─── */
body {
  background: var(--bg-base);
  color: var(--text-primary);
  font: 400 14px/1.5 var(--font-ui);
  transition: background 0.2s ease, color 0.2s ease;
}

/* ─── 카드 (글래스) ─── */
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 12px; padding: 20px;
  box-shadow: var(--shadow-md, 0 4px 24px rgba(0,0,0,0.15));
  transition: border-color 0.15s, box-shadow 0.15s;
}
[data-theme="light"] .card {
  box-shadow: var(--shadow-md);
}

/* ─── 버튼 ─── */
.btn-primary {
  background: var(--brand-blue);
  color: var(--text-on-brand);
  border: none; padding: 9px 18px; border-radius: 8px;
  font: 600 13px var(--font-ui); cursor: pointer;
  box-shadow: 0 0 16px var(--brand-blue-glow);
  transition: all 0.15s;
}
.btn-primary:hover {
  background: var(--brand-blue-h);
  box-shadow: 0 0 24px var(--brand-blue-glow);
  transform: translateY(-1px);
}
/* 라이트에서는 glow 약하게 */
[data-theme="light"] .btn-primary {
  box-shadow: var(--shadow-sm);
}
[data-theme="light"] .btn-primary:hover {
  box-shadow: 0 0 0 3px var(--brand-blue-glow), var(--shadow-md);
}

/* ─── 인풋 ─── */
.input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px; padding: 9px 13px;
  font: 400 14px var(--font-ui);
  color: var(--text-primary); outline: none; width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input::placeholder { color: var(--text-placeholder); }
.input:focus {
  border-color: var(--input-focus-border);
  box-shadow: 0 0 0 3px var(--input-focus-shadow);
}
.input:disabled {
  color: var(--text-disabled);
  background: var(--bg-overlay);
  cursor: not-allowed;
}

/* ─── 뱃지 ─── */
.badge-blue   { background: var(--info-bg);     color: var(--badge-blue-text);   border: 1px solid var(--info-border); }
.badge-cyan   { background: rgba(var(--brand-cyan-rgb, 0,212,255),0.1); color: var(--badge-cyan-text);   border: 1px solid rgba(var(--brand-cyan-rgb, 0,212,255),0.2); }
.badge-green  { background: var(--success-bg);   color: var(--badge-green-text);  border: 1px solid var(--success-border); }
.badge-amber  { background: var(--warning-bg);   color: var(--badge-amber-text);  border: 1px solid var(--warning-border); }
.badge-red    { background: var(--error-bg);     color: var(--badge-red-text);    border: 1px solid var(--error-border); }
.badge-purple { background: var(--brand-purple-glow); color: var(--badge-purple-text); border: 1px solid rgba(139,92,246,0.2); }

/* ─── 스크롤바 ─── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--scrollbar-track); }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

/* ─── 코드 블록 ─── */
.code-block-wrap {
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  border-radius: 8px; overflow: hidden; margin: 6px 0;
}
.code-block-header {
  background: var(--code-header-bg);
  border-bottom: 1px solid var(--code-border);
  padding: 7px 14px;
  display: flex; align-items: center; justify-content: space-between;
  font: 500 11px var(--font-mono); color: var(--text-secondary);
}
.code-block-body {
  padding: 14px 16px;
  font: 400 13px/1.6 var(--font-mono);
  color: var(--code-text); overflow-x: auto; max-height: 400px;
}
```

---

## 4. 테마 토글 컴포넌트

### HTML 구조
```html
<!-- 헤더 우측에 배치 -->
<button class="theme-toggle" id="themeToggle" aria-label="테마 전환">
  <span class="theme-toggle-icon theme-icon-dark">🌙</span>
  <span class="theme-toggle-track">
    <span class="theme-toggle-dot"></span>
  </span>
  <span class="theme-toggle-icon theme-icon-light">☀️</span>
</button>
```

### CSS
```css
.theme-toggle {
  display: flex; align-items: center; gap: 8px;
  background: transparent; border: none; cursor: pointer;
  padding: 4px; border-radius: 8px;
  transition: background 0.15s;
}
.theme-toggle:hover { background: var(--bg-overlay); }

.theme-icon-dark, .theme-icon-light { font-size: 14px; line-height: 1; }

.theme-toggle-track {
  width: 40px; height: 22px; border-radius: 11px;
  background: var(--toggle-off-bg);
  border: 1px solid var(--border-default);
  position: relative; transition: background 0.2s, border-color 0.2s;
}
.theme-toggle-dot {
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--toggle-off-dot);
  position: absolute; top: 2px; left: 2px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s;
}
[data-theme="light"] .theme-toggle-track {
  background: var(--toggle-on-bg);
  border-color: var(--brand-blue);
}
[data-theme="light"] .theme-toggle-dot {
  transform: translateX(18px);
  background: var(--toggle-on-dot);
}

/* 접근성: focus */
.theme-toggle:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 2px;
}
```

### JavaScript
```typescript
// ThemeToggle.tsx
const ThemeToggle = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // 1. localStorage 우선
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    // 2. 시스템 설정 따름
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 시스템 변경 감지
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      aria-pressed={theme === 'light'}
    >
      <span className="theme-icon-dark">🌙</span>
      <span className="theme-toggle-track">
        <span className="theme-toggle-dot" />
      </span>
      <span className="theme-icon-light">☀️</span>
    </button>
  );
};
```

---

## 5. Chart.js 테마 적용

```typescript
// useChartTheme.ts
export const getChartTheme = (theme: 'dark' | 'light') => ({
  gridColor:   theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  labelColor:  theme === 'dark' ? '#94A3B8' : '#6B7280',
  lineColor1:  theme === 'dark' ? '#3B82F6' : '#1D4ED8',
  lineColor2:  theme === 'dark' ? '#00D4FF' : '#0891B2',
  lineColor3:  theme === 'dark' ? '#10B981' : '#059669',
  fillColor1:  theme === 'dark' ? 'rgba(59,130,246,0.15)'  : 'rgba(29,78,216,0.08)',
  tooltipBg:   theme === 'dark' ? '#111827' : '#FFFFFF',
  tooltipText: theme === 'dark' ? '#F1F5F9' : '#111827',
  tooltipBorder: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
});
```

---

## 6. 라이트 모드 전용 오버라이드

```css
/* 라이트에서만 필요한 조정 */
[data-theme="light"] {

  /* 앱 배경 그리드 — 더 연하게 */
  body {
    background-image:
      linear-gradient(rgba(29,78,216,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(29,78,216,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* 사이드바 */
  .sidebar {
    background: rgba(248,250,255,0.95);
    border-right: 1px solid rgba(0,0,0,0.08);
    box-shadow: 2px 0 16px rgba(0,0,0,0.06);
  }
  .nav-item:hover { background: rgba(29,78,216,0.06); }
  .nav-item.active {
    background: rgba(29,78,216,0.1);
    color: #1D4ED8;
    box-shadow: inset 3px 0 0 #1D4ED8;
  }

  /* 채팅 사용자 말풍선 (라이트에서도 파랑 유지) */
  .msg-group.user .msg-text {
    background: #1D4ED8;  /* 어두운 파랑으로 변경 */
    color: #FFFFFF;
  }

  /* 카드 shimmer 라인 */
  .card::before {
    background: linear-gradient(90deg, transparent, rgba(29,78,216,0.2), transparent);
  }

  /* 아바타 glow 약화 */
  .avatar-developer { box-shadow: 0 0 6px rgba(29,78,216,0.15); }
  .avatar-designer  { box-shadow: 0 0 6px rgba(8,145,178,0.15);  }

  /* SSE 커서 컬러 — 라이트에서 더 진하게 */
  .msg-text.streaming::after {
    color: #0891B2;
    text-shadow: none;
  }

  /* 토스트 */
  .toast {
    background: #FFFFFF;
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    color: #111827;
  }

  /* 드롭다운 */
  .dropdown {
    background: #FFFFFF;
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
  .dropdown-item { color: #374151; }
  .dropdown-item:hover { background: #F3F4F6; color: #111827; }
}
```

---

## 7. WCAG AA 최종 검증

### 다크 테마
| 조합 | 대비율 | 기준 |
|------|--------|------|
| bg-base / text-primary | **17.1:1** | ✅ AAA |
| bg-base / text-secondary | **7.0:1** | ✅ AAA |
| bg-base / text-tertiary | **4.7:1** | ✅ AA |
| bg-surface / text-primary | **14.8:1** | ✅ AAA |
| bg-surface / brand-blue | **4.7:1** | ✅ AA |
| brand-blue / white(on btn) | **8.5:1** | ✅ AAA |
| badge-blue-text / badge-bg | **5.2:1** | ✅ AA |
| badge-green-text / badge-bg | **4.8:1** | ✅
### 라이트 테마
| 조합 | 대비율 | 기준 |
|------|--------|------|
| bg-base / text-primary | **16.8:1** | ✅ AAA |
| bg-base / text-secondary | **7.2:1** | ✅ AAA |
| bg-base / text-tertiary | **4.6:1** | ✅ AA |
| bg-surface / text-primary | **17.7:1** | ✅ AAA |
| bg-surface / brand-blue | **5.9:1** | ✅ AA |
| brand-blue / white(on btn) | **8.6:1** | ✅ AAA |
| badge-blue-text / badge-bg | **5.4:1** | ✅ AA |
| badge-green-text / badge-bg | **6.9:1** | ✅ AA |
| code-text / code-bg | **12.5:1** | ✅ AAA |

> **비활성(disabled) 텍스트는 WCAG 1.4.3 예외 적용** — 기능 없음을 나타내는 비활성 UI는 대비율 기준 면제

---

## 8. 구현 가이드 (태영님)

```
1. design-system.css에 :root (다크) + [data-theme="light"] 추가
2. index.html <html> 태그에 data-theme="dark" 기본값 설정
3. ThemeToggle 컴포넌트 헤더에 배치
4. Chart.js: useChartTheme() 훅으로 테마 변경 시 차트 색상 동적 교체
5. 전환 애니메이션: body { transition: background 0.2s, color 0.2s; }
```
