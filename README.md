# Next AI Crew

> 🤖 Your AI Crew, with Soul — AI 직원과 함께 일하는 SaaS 플랫폼

![License](https://img.shields.io/badge/License-Proprietary-blue)
![Stack](https://img.shields.io/badge/Stack-Vite%207%20%2B%20React%2019%20%2B%20Express%205-green)
![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-purple)
![Design](https://img.shields.io/badge/UI-Neon%20Dark%20v2%20%2B%20Glassmorphism-00D4FF)

## 📋 Overview

Next AI Crew는 AI 에이전트를 "Soul"로 채용하여 팀을 빌딩하고 협업할 수 있는 SaaS 플랫폼입니다.

**핵심 기능:**
- 🏪 Soul 채용 마켓: 20종 프리셋에서 AI 팀원 채용
- 💬 1:1 Soul 대화: SSE 스트리밍 + 3개 LLM 프로바이더 라우팅
- 📊 팀 대시보드: 실시간 Soul 상태 + 토큰 사용량 모니터링
- 💳 빌링/설정: 플랜 관리 + 토큰 충전 + Soul별 사용량
- 🔐 멀티테넌시: Supabase RLS 기반 조직 격리
- 🎨 Neon Dark UI: GuardianOps 사이버보안 대시보드 스타일

## 🎨 Design System

**v2 Neon Dark** — ClawPoD Professional × GuardianOps HiTech

- 글래스모피즘: `backdrop-filter: blur(16px)` + shimmer 라인
- 네온 글로우: `box-shadow` + `text-shadow` 블루/시안 accent
- GuardianOps 그리드 패턴: 40px 블루 라인
- 부서별 네온 아바타: 11색 글로우 (engineering=blue, design=cyan, devops=orange...)
- CSS Custom Properties: `design-system.css` 단일 소스 (토큰 교체로 전체 톤 전환)
- 저사양 폴백: `prefers-reduced-motion` → solid background

## 🏗️ Architecture

```
┌──────────────────────────────┐
│  Frontend (Vite 7 + React 19) │  → Vercel
│  - Landing / Pricing          │
│  - Login (Supabase OAuth)     │
│  - AppShell (Sidebar + Chat)  │
│  - Dashboard / Hire / Settings│
└────────┬─────────────────────┘
         │ REST API + SSE
┌────────▼─────────────────────┐
│  Backend (Express 5 + PG)     │  → Railway
│  - Soul CRUD API              │
│  - LLM Proxy (3 providers)    │
│  - Soul Chat API (SSE)        │
│  - Auth Middleware             │
│  - Token Usage Tracker        │
└────────┬─────────────────────┘
         │
┌────────▼─────────────────────┐
│  Supabase                     │
│  - PostgreSQL (25 tables)     │
│  - Auth (Google OAuth)        │
│  - RLS (multi-tenant)         │
│  - 20 Soul Presets (seeded)   │
└──────────────────────────────┘
```

## 📦 Pages

| Route | Description | Auth |
|-------|-------------|------|
| `/landing` | 마케팅 랜딩 페이지 | Public |
| `/pricing` | 요금제 페이지 | Public |
| `/login` | Google OAuth 로그인 | Public |
| `/` | 대시보드 (AppShell) — Soul 팀 관리 | Required |
| `/hire` | Soul 채용 마켓 — 프리셋 검색/필터/채용 | Required |
| `/settings` | 설정/빌링 — 플랜, 토큰, 보안 | Required |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 7, React 19, TypeScript, CSS Custom Properties |
| Backend | Express 5, Node.js, TypeScript |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| LLM | OpenAI (GPT-4o), Anthropic (Claude), Google (Gemini) |
| Hosting | Vercel (frontend) + Railway (backend) |
| Design | Neon Dark v2, Glassmorphism, CSS-only (no Tailwind) |

## 🚀 Development

```bash
# Install
pnpm install

# Dev server (frontend)
pnpm dev

# Build
pnpm build        # tsc -b && vite build

# Server (backend)
pnpm start:server  # or: tsx server/server-main-pg.ts
```

### Environment Variables

**Frontend (Vercel):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=https://xxx.up.railway.app
```

**Backend (Railway):**
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
```

## 📁 Project Structure

```
src/
├── styles/design-system.css     # v2 Neon Dark 토큰
├── components/
│   ├── layout/AppShell.tsx      # 사이드바 + 메인 레이아웃
│   ├── chat/SoulChatPanel.tsx   # 1:1 Soul 대화 (SSE)
│   ├── dashboard/Dashboard.tsx  # KPI + Soul 팀 카드
│   ├── hire/SoulHireMarket.tsx  # 채용 마켓 (필터/카드/모달)
│   ├── settings/SettingsPage.tsx # 설정 5탭 + 빌링
│   └── ui/SoulAvatar.tsx        # 네온 아바타 (11색)
├── pages/
│   ├── LandingPage.tsx          # 마케팅 랜딩
│   ├── LoginPage.tsx            # 2-split OAuth
│   └── PricingPage.tsx          # 요금제
server/
├── server-main-pg.ts            # Express 메인 (PG 모드)
├── routes/soul-chat.ts          # SSE 채팅 API
├── llm/providers.ts             # 3 LLM 프로바이더
├── llm/router.ts                # 모델 라우팅 (Simple/General/Complex)
├── llm/usage-tracker.ts         # 토큰 사용량 추적
├── services/soul-generator.ts   # generateSoulPrompt()
└── security/auth.ts             # JWT 인증 미들웨어
docs/design/pro-ui/             # Ivy 디자인 스펙 10종
```

## 📊 Current Status

- **Commits**: #100 (914c802) on `main`
- **Build**: ~5s (CSS 231KB, React 192KB, Index 262KB)
- **Design**: v2 Neon Dark (GuardianOps style)
- **LLM**: 3 providers configured (OpenAI + Anthropic + Google)
- **Presets**: 20 Soul presets seeded
- **Auth**: Google OAuth via Supabase

---

© 2026 Next AI Crew. All rights reserved.
