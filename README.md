# Next AI Crew

> 🤖 AI 직원과 함께 일하는 가상 오피스 SaaS 플랫폼

![License](https://img.shields.io/badge/License-Proprietary-blue)
![Stack](https://img.shields.io/badge/Stack-Vite%207%20%2B%20React%2019%20%2B%20Express%205-green)
![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-purple)

## 📋 Overview

Next AI Crew는 AI 에이전트를 "직원"으로 고용하여 팀을 빌딩하고 협업할 수 있는 SaaS 플랫폼입니다.

**핵심 기능:**
- 🏢 가상 오피스: 부서별 AI 직원 관리
- 🤖 Soul 커스터마이징: AI 캐릭터 성격/스킬 설정
- 💳 구독 결제: StepPay (한국) / Stripe (글로벌) 지원
- 🔐 멀티테넌시: RLS 기반 조직 격리
- 🎨 픽셀 아트 UI: 다크 테마 기반 감성 인터페이스

## 🏗️ Architecture

```
┌─────────────────────────┐
│  Frontend (Vite + React) │  → Vercel
│  - Landing / Pricing     │
│  - Login (Supabase Auth) │
│  - Office (Agent CRUD)   │
└────────┬────────────────┘
         │ REST API
┌────────▼────────────────┐
│  Backend (Express 5)     │  → Railway
│  - Auth middleware        │
│  - Agent/Dept CRUD       │
│  - Billing routes        │
│  - WebSocket (WS)        │
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│  Supabase                │
│  - PostgreSQL (RLS)      │
│  - Auth (OAuth/Email)    │
│  - Storage               │
│  - Realtime              │
└─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Supabase project (or local Supabase)

### 1. Clone & Install

```bash
git clone https://github.com/Kevinjeenext/next-ai-crew.git
cd next-ai-crew
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

#### Required Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Backend |
| `DATABASE_URL` | PostgreSQL connection string | Backend |
| `STEPPAY_SECRET_TOKEN` | StepPay API Secret-Token | Backend |
| `STEPPAY_PAYMENT_KEY` | StepPay Payment-Key | Backend |
| `PAYMENT_GATEWAY` | `steppay` or `stripe` | Backend |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5001` |
| `STEPPAY_PRICE_FREE` | StepPay Free plan price ID | — |
| `STEPPAY_PRICE_STARTER` | StepPay Starter plan price ID | — |
| `STEPPAY_PRICE_PRO` | StepPay Pro plan price ID | — |
| `STEPPAY_PRICE_MAX` | StepPay Max plan price ID | — |

### 3. Database Setup

Run migrations in order on your Supabase SQL editor:

```bash
# 1. Core tables (organizations, users, etc.)
supabase/migrations/001_schema.sql

# 2. Agent tables
supabase/migrations/002_agents.sql

# 3. Department seeding (10 departments with icons)
supabase/migrations/003_departments.sql

# 4. Subscription & billing tables
supabase/migrations/004_subscriptions.sql
```

### 4. StepPay Product Setup

After setting up your StepPay portal account:

```bash
STEPPAY_SECRET_TOKEN=your_token npx tsx scripts/setup-steppay-products.ts
```

This creates 5 products with monthly/annual subscription plans and outputs the price IDs for environment variables.

### 5. Run Development

```bash
# Frontend + Backend (concurrent)
pnpm dev

# Frontend only
pnpm dev:client

# Backend only
pnpm dev:server
```

### 6. Build & Deploy

```bash
pnpm build
```

**Deploy targets:**
- **Frontend** → Vercel (`dist/` directory)
- **Backend** → Railway (Dockerfile provided)

## 📁 Project Structure

```
next-ai-crew/
├── src/                      # Frontend (React)
│   ├── pages/                # Route pages
│   │   ├── LandingPage.tsx   # Marketing landing
│   │   ├── PricingPage.tsx   # 5-tier pricing (KRW)
│   │   └── LoginPage.tsx     # Auth (OAuth + Email)
│   ├── components/
│   │   ├── agent-manager/    # Agent CRUD UI
│   │   ├── billing/          # Trial banner, limit bar
│   │   └── OfficeView.tsx    # Main office view
│   └── lib/
│       └── supabase.ts       # Supabase client
├── server/                   # Backend (Express)
│   ├── payment/
│   │   ├── gateway.ts        # PaymentGateway interface
│   │   ├── steppay.ts        # StepPay implementation
│   │   └── webhook-handler.ts
│   ├── modules/routes/
│   │   ├── billing.ts        # Billing API
│   │   └── auth/signup.ts    # Auth routes
│   ├── middleware/
│   │   └── plan-limit.ts     # Agent limit enforcement
│   └── lib/
│       └── supabase.ts       # Server Supabase client
├── supabase/migrations/      # DDL files (001-004)
├── public/icons/departments/  # Department pixel art icons
├── scripts/
│   └── setup-steppay-products.ts
├── Dockerfile                # Railway deployment
├── railway.toml              # Railway config
└── vite.config.ts
```

## 💳 Pricing Plans

| Plan | AI Agents | Price (KRW) | Features |
|------|-----------|-------------|----------|
| Free | 1 | 7일 무료 → ₩25,000/월 | Basic office, 50 msgs/day |
| Starter | 3 | ₩50,000/월 | Custom Soul, workflows |
| **Pro** ⭐ | 5 | ₩80,000/월 | Unlimited msgs, API access |
| Max | 10 | ₩120,000/월 | SSO, analytics, SLA 99.9% |
| Enterprise | Unlimited | 별도 문의 | On-premise, white label |

Annual billing: 20% discount.

## 🔧 Payment Integration

### StepPay (Phase 1 — Korea)

1. Sign up at [StepPay Portal](https://portal.steppay.kr)
2. Configure PG settings
3. Run product setup script
4. Register webhook URL: `POST /api/webhooks/payment`
5. Set environment variables on Railway

### Stripe (Phase 2 — Global)

Coming soon. The `PaymentGateway` interface is provider-neutral — set `PAYMENT_GATEWAY=stripe` when ready.

## 🧪 Development Notes

### Dual Database Mode

The server supports both SQLite (dev) and PostgreSQL (production):
- Set `DATABASE_URL` → uses Supabase/PostgreSQL
- No `DATABASE_URL` → falls back to SQLite

### Graceful Degradation

When Supabase DDL hasn't been run:
- Auth routes return mock data
- Billing routes return hardcoded plan list
- Agent CRUD operates in SQLite mode

### CSS Note

This project uses Tailwind with a custom dark theme. Due to specificity conflicts, all text colors on dark backgrounds use **inline styles** rather than Tailwind color classes. This ensures visibility regardless of theme overrides.

## 📝 License

Proprietary — © 2026 NEXT Inc. All rights reserved.
