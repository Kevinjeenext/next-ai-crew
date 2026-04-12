# Next AI Crew — 아이콘 가이드라인

> 2026-04-12 | Designer: Ivy | Kevin 지시
> 스타일: Lucide Icons (outline, stroke-width 1.5, rounded)
> 레퍼런스: Claude/ChatGPT 사이드바 스타일

---

## 아이콘 라이브러리 결정

**Lucide React** — Kevin 레퍼런스와 95% 일치

| 속성 | 값 |
|------|-----|
| stroke-width | `1.5` |
| stroke-linecap | `round` |
| stroke-linejoin | `round` |
| fill | `none` (outline only) |
| size | `18px` (사이드바) / `20px` (대시보드) |
| 다크 모드 색상 | `var(--text-secondary)` → hover: `var(--text-primary)` |
| 라이트 모드 색상 | `#4B5563` → hover: `#111827` |

```bash
npm install lucide-react
```

---

## 1. 사이드바 네비게이션 아이콘

| 메뉴 | Lucide 컴포넌트 | 비고 |
|------|---------------|------|
| 대시보드 | `<LayoutDashboard />` | 홈/오버뷰 |
| Soul 채용 | `<Users />` | 팀원 추가 |
| Soul 채팅 | `<MessageSquare />` | 메시지 |
| 마켓플레이스 | `<Store />` | 스토어 |
| 빌링/요금제 | `<CreditCard />` | 결제 |
| 설정 | `<Settings />` | 환경설정 |
| 도움말 | `<HelpCircle />` | 지원 |
| 로그아웃 | `<LogOut />` | |

```tsx
import { LayoutDashboard, Users, MessageSquare, Store, CreditCard, Settings, HelpCircle, LogOut } from 'lucide-react';

// 사이드바 아이템
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users,           label: 'Hire Souls', href: '/hire' },
  { icon: MessageSquare,   label: 'Soul Chat',  href: '/chat' },
  { icon: Store,           label: 'Marketplace', href: '/market' },
  { icon: CreditCard,      label: 'Billing',    href: '/billing' },
  { icon: Settings,        label: 'Settings',   href: '/settings' },
];

// 렌더링
<Icon size={18} strokeWidth={1.5} className="nav-icon" />
```

---

## 2. 랜딩 Feature 섹션 아이콘

| Feature | Lucide 컴포넌트 | 색상 클래스 |
|---------|---------------|------------|
| Soul Identity | `<UserCheck />` | `.feature-icon.blue` |
| Always Available | `<Clock />` | `.feature-icon.cyan` |
| 10x Faster Execution | `<Zap />` | `.feature-icon.green` |

```tsx
import { UserCheck, Clock, Zap } from 'lucide-react';

// Feature 카드
const FEATURES = [
  {
    icon: UserCheck,
    title: 'Soul Identity',
    colorClass: 'blue',
    desc: 'Each AI has a name, personality, and expertise',
  },
  {
    icon: Clock,
    title: 'Always Available',
    colorClass: 'cyan',
    desc: 'Your crew works 24/7',
  },
  {
    icon: Zap,
    title: '10x Faster Execution',
    colorClass: 'green',
    desc: 'Parallel AI agents complete tasks in minutes',
  },
];

// 렌더링
<div className={`feature-icon ${feature.colorClass}`}>
  <feature.icon size={24} strokeWidth={1.5} />
</div>
```

---

## 3. 대시보드 KPI 아이콘

| KPI | Lucide 컴포넌트 |
|-----|---------------|
| 활성 Soul 수 | `<Bot />` |
| 완료 태스크 | `<CheckCircle />` |
| 총 토큰 사용량 | `<Activity />` |
| 응답 속도 | `<Timer />` |
| 비용 | `<DollarSign />` |
| 팀 멤버 | `<Users />` |

```tsx
import { Bot, CheckCircle, Activity, Timer, DollarSign, Users } from 'lucide-react';

const KPI_ICONS = {
  activeSouls:    Bot,
  tasksCompleted: CheckCircle,
  tokensUsed:     Activity,
  avgResponse:    Timer,
  monthlyCost:    DollarSign,
  teamMembers:    Users,
};

// KPI 카드
<kpi.icon size={20} strokeWidth={1.5} className="kpi-icon" />
```

---

## 4. 설정 페이지 아이콘

| 설정 섹션 | Lucide 컴포넌트 |
|----------|---------------|
| 계정 정보 | `<User />` |
| 보안/비밀번호 | `<Lock />` |
| 알림 | `<Bell />` |
| API 키 | `<Key />` |
| 요금제 | `<CreditCard />` |
| 테마 | `<Palette />` |
| 언어 | `<Globe />` |
| 데이터 삭제 | `<Trash2 />` |

---

## 5. Soul 채용 페이지 아이콘

| 요소 | Lucide 컴포넌트 |
|------|---------------|
| 스킬 태그 | `<Tag />` |
| 전문 분야 | `<Briefcase />` |
| 온라인 상태 | `<Circle />` (filled, 8px) |
| 채용 완료 | `<UserCheck />` |
| 정원 초과 | `<UserX />` |
| 레이더 차트 | `<Radar />` |
| 채팅 시작 | `<MessageCircle />` |

---

## 6. 채팅 UI 아이콘

| 요소 | Lucide 컴포넌트 |
|------|---------------|
| 메시지 전송 | `<Send />` |
| 파일 첨부 | `<Paperclip />` |
| 코드 복사 | `<Copy />` |
| 코드 복사 완료 | `<Check />` |
| 채팅 지우기 | `<Trash2 />` |
| Soul 정보 | `<Info />` |
| 음소거 | `<VolumeX />` |
| 채팅 닫기 | `<X />` |

---

## CSS — 아이콘 색상 시스템

```css
/* 사이드바 네비게이션 */
.nav-icon {
  color: var(--text-tertiary);
  transition: color 0.15s;
  flex-shrink: 0;
}
.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  color: var(--text-primary);
}
.nav-item.active .nav-icon {
  color: var(--brand-blue);
}

/* Feature 아이콘 컬러 박스 */
.feature-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.feature-icon.blue  { background: rgba(59,130,246,0.12); color: #60A5FA; }
.feature-icon.cyan  { background: rgba(0,212,255,0.1);   color: #00D4FF; }
.feature-icon.green { background: rgba(16,185,129,0.1);  color: #34D399; }

/* KPI 아이콘 */
.kpi-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

/* 다크 모드 기본 */
[data-theme=dark] svg.lucide {
  stroke: currentColor;
}
/* 라이트 모드 */
[data-theme=light] .nav-icon {
  color: #6B7280;
}
[data-theme=light] .nav-item.active .nav-icon {
  color: #2563EB;
}
```

---

## React 공통 컴포넌트

```tsx
// components/Icon.tsx
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ icon: LucideIconComponent, size = 18, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <LucideIconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
```

---

## 제거 항목

- ❌ 부서별 컬러 이모지 (🧑‍💻 👩‍🎨 등)
- ❌ 픽셀 아트 아이콘
- ❌ 그라디언트/그림자 아이콘
- ❌ filled/solid 스타일 아이콘
- ❌ 3D 효과 아이콘

모든 아이콘 → Lucide outline `strokeWidth={1.5}` 통일
