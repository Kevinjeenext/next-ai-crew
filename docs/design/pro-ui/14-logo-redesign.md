# Next AI Crew — 로고 리디자인 가이드라인

> 2026-04-12 | Designer: Ivy | Kevin 지시
> 방향: 미니멀 심볼 + Neon Dark 글로우 + Soul = 사람 컨셉
> 배경: #080B12 (Neon Dark), white (Light)

---

## 디자인 컨셉

### Soul = 사람 은유
- 심볼: **세 개의 원** — 사람 아바타 그룹 (팀 컨셉)
- 가장 큰 원 = 리더/사용자, 두 개 작은 원 = AI Soul 동료
- 원들이 살짝 겹쳐지며 "연결된 팀" 표현
- blue→cyan 그라디언트 글로우로 AI/디지털 감성

### 색상
- Primary: `#3B82F6` (Brand Blue)
- Accent: `#00D4FF` (Brand Cyan)
- Gradient: `linear-gradient(135deg, #3B82F6, #00D4FF)`
- Dark BG: `#080B12`
- Light BG: `#FFFFFF`

---

## 버전 1: 심볼 마크 (Symbol Only)

```svg
<!-- logo-symbol.svg -->
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 메인 그라디언트 -->
    <linearGradient id="grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
    <!-- 글로우 필터 -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- 외부 글로우 (배경용) -->
    <filter id="glow-outer" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 글로우 배경 블롭 -->
  <ellipse cx="24" cy="26" rx="18" ry="14" fill="url(#grad-main)" opacity="0.12"/>

  <!-- 중앙 메인 Soul (가장 큰) -->
  <circle cx="24" cy="20" r="9" fill="url(#grad-main)" filter="url(#glow)"/>
  <!-- 하이라이트 -->
  <circle cx="21" cy="17" r="2.5" fill="white" opacity="0.35"/>

  <!-- 좌측 Soul (작은) -->
  <circle cx="11" cy="30" r="6" fill="url(#grad-main)" opacity="0.85" filter="url(#glow)"/>
  <circle cx="9.2" cy="28.2" r="1.6" fill="white" opacity="0.3"/>

  <!-- 우측 Soul (작은) -->
  <circle cx="37" cy="30" r="6" fill="url(#grad-main)" opacity="0.85" filter="url(#glow)"/>
  <circle cx="35.2" cy="28.2" r="1.6" fill="white" opacity="0.3"/>

  <!-- 연결선 (팀 연결 표현) -->
  <path d="M 18.5 27 Q 24 32 29.5 27" stroke="url(#grad-main)" stroke-width="1.5" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>
```

---

## 버전 2: 워드마크 (Wordmark Only)

```svg
<!-- logo-wordmark.svg -->
<svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-text" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
    <filter id="text-glow">
      <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- "Next" — 그라디언트 강조 -->
  <text x="0" y="30" font-family="'Space Grotesk', 'Inter', sans-serif"
        font-weight="800" font-size="28" fill="url(#grad-text)"
        filter="url(#text-glow)">Next</text>

  <!-- "AI" — 밝은 white/cyan -->
  <text x="76" y="30" font-family="'Space Grotesk', 'Inter', sans-serif"
        font-weight="800" font-size="28" fill="#00D4FF"
        filter="url(#text-glow)"> AI</text>

  <!-- "Crew" — 화이트 (다크), 다크(라이트) -->
  <text x="116" y="30" font-family="'Space Grotesk', 'Inter', sans-serif"
        font-weight="800" font-size="28" fill="white"
        class="wordmark-crew"> Crew</text>

  <!-- 하단 미세 언더라인 (accent) -->
  <rect x="0" y="36" width="200" height="2" rx="1" fill="url(#grad-text)" opacity="0.6"/>
</svg>
```

---

## 버전 3: 조합형 로고 (Symbol + Wordmark) ← 메인 로고

```svg
<!-- logo-full.svg -->
<svg width="220" height="48" viewBox="0 0 220 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-s" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
    <linearGradient id="grad-t" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
    <filter id="glow-s" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-t">
      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- ── 심볼 (좌측 48x48 영역) ── -->

  <!-- 글로우 배경 -->
  <ellipse cx="24" cy="28" rx="17" ry="13" fill="url(#grad-s)" opacity="0.1"/>

  <!-- 중앙 메인 Soul -->
  <circle cx="24" cy="21" r="9" fill="url(#grad-s)" filter="url(#glow-s)"/>
  <circle cx="21.2" cy="18.2" r="2.5" fill="white" opacity="0.35"/>

  <!-- 좌측 Soul -->
  <circle cx="11" cy="32" r="6" fill="url(#grad-s)" opacity="0.8" filter="url(#glow-s)"/>
  <circle cx="9.2" cy="30.2" r="1.5" fill="white" opacity="0.28"/>

  <!-- 우측 Soul -->
  <circle cx="37" cy="32" r="6" fill="url(#grad-s)" opacity="0.8" filter="url(#glow-s)"/>
  <circle cx="35.2" cy="30.2" r="1.5" fill="white" opacity="0.28"/>

  <!-- 연결 아크 -->
  <path d="M 18.5 29 Q 24 34 29.5 29" stroke="url(#grad-s)"
        stroke-width="1.5" fill="none" opacity="0.45" stroke-linecap="round"/>

  <!-- ── 구분선 ── -->
  <rect x="54" y="10" width="1" height="28" rx="0.5" fill="white" opacity="0.12"/>

  <!-- ── 워드마크 (우측) ── -->

  <!-- "Next" -->
  <text x="62" y="34" font-family="'Space Grotesk','Inter',sans-serif"
        font-weight="800" font-size="22" fill="url(#grad-t)"
        filter="url(#glow-t)">Next</text>

  <!-- "AI" cyan -->
  <text x="121" y="34" font-family="'Space Grotesk','Inter',sans-serif"
        font-weight="800" font-size="22" fill="#00D4FF"
        filter="url(#glow-t)"> AI</text>

  <!-- "Crew" white -->
  <text x="155" y="34" font-family="'Space Grotesk','Inter',sans-serif"
        font-weight="800" font-size="22" fill="white"> Crew</text>

  <!-- 워드마크 하단 바 -->
  <rect x="62" y="40" width="155" height="2" rx="1" fill="url(#grad-t)" opacity="0.5"/>
</svg>
```

---

## 라이트 모드 대응

라이트 모드에서는 CSS로 `fill` 오버라이드:

```css
/* Light 모드 로고 */
[data-theme="light"] .logo-wordmark-crew {
  fill: #0D1120;  /* 다크 텍스트 */
}
[data-theme="light"] .logo-divider {
  fill: rgba(13,17,32,0.15);
}
/* glow 필터 강도 축소 */
[data-theme="light"] .logo-symbol circle {
  filter: none;
}
```

또는 라이트 모드 전용 SVG 사용:

```svg
<!-- logo-full-light.svg — "Crew" 텍스트만 다크 -->
<!-- 동일 구조, 마지막 text fill="#0D1120" -->
```

---

## 파비콘 / 앱 아이콘 버전

```svg
<!-- favicon.svg (32x32) -->
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
    <filter id="gf">
      <feGaussianBlur stdDeviation="1.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="32" height="32" rx="8" fill="#080B12"/>
  <circle cx="16" cy="13" r="6" fill="url(#g)" filter="url(#gf)"/>
  <circle cx="7" cy="22" r="4" fill="url(#g)" opacity="0.8" filter="url(#gf)"/>
  <circle cx="25" cy="22" r="4" fill="url(#g)" opacity="0.8" filter="url(#gf)"/>
  <path d="M 11.5 20 Q 16 24 20.5 20" stroke="url(#g)" stroke-width="1.2"
        fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>
```

---

## 사용 가이드라인

### 최소 크기
| 버전 | 최소 크기 | 용도 |
|------|----------|------|
| 심볼 | 24px | 파비콘, 모바일 앱 |
| 조합형 | 120px width | 헤더, 랜딩 |
| 워드마크 | 100px width | 수평 공간 협소 시 |

### 여백 (클리어스페이스)
- 심볼 기준: 심볼 높이의 0.25x 이상

### 금지 사항
- ❌ 로고 회전/변형
- ❌ 색상 임의 변경 (그라디언트 유지)
- ❌ 배경 없이 라이트 환경에 다크 전용 버전 사용

---

## 구현 컴포넌트 (React)

```tsx
// components/Logo.tsx
interface LogoProps {
  variant?: 'symbol' | 'wordmark' | 'full';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light' | 'auto';
}

const sizeMap = {
  sm: { symbol: 24, full: 120 },
  md: { symbol: 32, full: 160 },
  lg: { symbol: 48, full: 220 },
};

export function Logo({ variant = 'full', size = 'md', theme = 'auto' }: LogoProps) {
  // symbol SVG 인라인 — 다크/라이트 자동 대응
  if (variant === 'symbol') return <LogoSymbol size={sizeMap[size].symbol} />;
  if (variant === 'wordmark') return <LogoWordmark width={sizeMap[size].full} />;
  return <LogoFull width={sizeMap[size].full} theme={theme} />;
}

// Nav에서 사용
<Logo variant="full" size="md" />

// 파비콘 — public/favicon.svg 교체
// 모바일 앱 아이콘 — public/icon-192.png (32px SVG → PNG 변환)
```

---

## 파일 구조

```
public/
├── logo-symbol.svg       ← 심볼 전용
├── logo-wordmark.svg     ← 워드마크 전용
├── logo-full.svg         ← 조합형 (메인) ← 헤더에 사용
├── logo-full-light.svg   ← 라이트 모드 전용
└── favicon.svg           ← 파비콘 (기존 교체)
```
