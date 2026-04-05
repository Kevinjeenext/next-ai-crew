# Next AI Crew — Stripe 구독 아키텍처

> CTO Soojin | 2026-04-05

## 1. 요금제 구조

| Plan | AI 직원 | 월 요금 | 트라이얼 |
|------|---------|---------|----------|
| Free | 1명 | $20/mo | 7일 무료 |
| Starter | 3명 | $40/mo | - |
| Pro | 5명 | $60/mo | - |
| Max | 10명 | $100/mo | - |
| Enterprise | 무제한 | Custom | - |

## 2. Stripe 연동 흐름

### 2.1 회원가입 → 트라이얼
```
User signup
  → Supabase Auth creates user
  → DB Trigger: handle_new_user()
    → organizations 생성 (plan='free', is_trial=true, trial_ends_at=now()+7d)
    → org_members 생성 (role='owner')
    → 기본 부서 5개 시딩
  → 프론트엔드: 7일 무료 배너 표시
```

### 2.2 결제 (Stripe Checkout)
```
User clicks "Upgrade" on pricing page
  → Frontend: POST /api/billing/checkout
    → Server: stripe.checkout.sessions.create({
        customer: org.stripe_customer_id || create new,
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        mode: 'subscription',
        success_url: '{origin}/office?upgraded=true',
        cancel_url: '{origin}/pricing',
        metadata: { org_id }
      })
    → Return checkout URL
  → Frontend: redirect to Stripe Checkout
  → User pays
  → Stripe fires webhook: checkout.session.completed
```

### 2.3 Webhook 처리
```
POST /api/webhooks/stripe (서명 검증)
  │
  ├─ checkout.session.completed
  │   → stripe_customer_id 저장 → subscriptions 레코드 생성
  │   → organizations.plan 업데이트 → agent_limit 자동 동기화 (트리거)
  │
  ├─ customer.subscription.updated
  │   → plan 변경 감지 → organizations.plan + agent_limit 업데이트
  │   → 다운그레이드 시: agent_limit 초과 에이전트 → 'offline' 상태로 전환
  │
  ├─ customer.subscription.deleted
  │   → plan → 'free', agent_limit → 1
  │   → 초과 에이전트 → 'offline'
  │
  ├─ invoice.payment_failed
  │   → subscriptions.status → 'past_due'
  │   → 유예 기간 3일 (기능 유지, 배너 표시)
  │   → 3일 후 미결제 → plan → 'free'로 다운그레이드
  │
  └─ invoice.paid
      → subscriptions.status → 'active'
      → billing_events 기록
```

## 3. 서버 API 엔드포인트

### 3.1 Billing API

```typescript
// POST /api/billing/checkout — Stripe Checkout 세션 생성
// POST /api/billing/portal — Stripe Customer Portal (구독 관리)
// GET  /api/billing/subscription — 현재 구독 상태 조회
// GET  /api/billing/invoices — 결제 내역 조회
// GET  /api/billing/plans — 요금제 목록 (plan_limits 테이블)
// POST /api/webhooks/stripe — Stripe Webhook 수신
```

### 3.2 에이전트 수 제한 미들웨어

```typescript
// server/middleware/plan-limit.ts

import { supabaseAdmin } from '../lib/supabase.ts';

interface PlanLimitConfig {
  free: number;       // 1
  starter: number;    // 3
  pro: number;        // 5
  max: number;        // 10
  enterprise: number; // -1 (unlimited)
}

const PLAN_LIMITS: PlanLimitConfig = {
  free: 1,
  starter: 3,
  pro: 5,
  max: 10,
  enterprise: -1,
};

/**
 * 에이전트 생성 전 플랜 제한 체크
 * POST /api/agents에 적용
 */
export async function checkAgentLimit(orgId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}> {
  // 1. 현재 org의 plan + agent_limit 조회
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('plan, agent_limit')
    .eq('id', orgId)
    .single();

  if (!org) throw new Error('Organization not found');

  const limit = org.agent_limit;

  // unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan: org.plan };
  }

  // 2. 현재 에이전트 수 카운트
  const { count } = await supabaseAdmin
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const current = count ?? 0;

  return {
    allowed: current < limit,
    current,
    limit,
    plan: org.plan,
  };
}

/**
 * Express 미들웨어로 사용
 */
export function requireAgentSlot() {
  return async (req: any, res: any, next: any) => {
    try {
      const orgId = req.orgId; // requireOrg()에서 세팅됨
      const result = await checkAgentLimit(orgId);

      if (!result.allowed) {
        return res.status(402).json({
          error: 'Agent limit reached',
          current: result.current,
          limit: result.limit,
          plan: result.plan,
          upgrade_url: '/pricing',
          message: `Your ${result.plan} plan allows ${result.limit} agent(s). Upgrade to add more.`,
        });
      }

      // 프론트엔드용 헤더
      res.set('X-Agent-Current', String(result.current));
      res.set('X-Agent-Limit', String(result.limit));
      next();
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to check plan limit' });
    }
  };
}
```

### 3.3 라우트 적용

```typescript
// server-main-pg.ts

import { requireAgentSlot } from './middleware/plan-limit.ts';

// POST /api/agents — 에이전트 생성 시 플랜 체크
app.post('/api/agents', requireAgentSlot(), async (req, res) => {
  // ... 기존 생성 로직
});

// GET /api/agents — 응답 헤더에 limit 정보 포함
app.get('/api/agents', async (req, res) => {
  // ... 조회 후 X-Agent-Current/X-Agent-Limit 헤더 추가
});
```

## 4. 프론트엔드 연동

### 4.1 Pricing 페이지
```
/pricing — 요금제 비교표
  → GET /api/billing/plans (plan_limits 테이블)
  → 현재 플랜 하이라이트
  → "Upgrade" 버튼 → POST /api/billing/checkout → Stripe Checkout
```

### 4.2 에이전트 제한 UI
```
에이전트 목록 상단: "2/3 agents used" 프로그레스 바
  → limit 도달 시: "Upgrade to add more agents" CTA
  → "+" 버튼 비활성화 + 업그레이드 모달
```

### 4.3 트라이얼 배너
```
is_trial && trial_ends_at > now()
  → "Free trial: X days remaining. Upgrade now!"
  → trial_ends_at < now() → "Trial ended. Subscribe to continue."
```

## 5. 트라이얼 만료 처리

```sql
-- Supabase Edge Function 또는 Cron Job (매시간)
-- trial_ends_at이 지난 org 중 subscription이 없는 경우 기능 제한

UPDATE organizations
SET is_trial = false
WHERE is_trial = true
  AND trial_ends_at < now()
  AND id NOT IN (
    SELECT org_id FROM subscriptions WHERE status IN ('active', 'trialing')
  );
```

트라이얼 만료 후:
- 에이전트 실행 차단 (status → 'offline')
- 대시보드 읽기 전용
- "Subscribe to reactivate" 프롬프트

## 6. 보안 체크리스트

- [ ] Stripe Webhook 서명 검증 (stripe.webhooks.constructEvent)
- [ ] stripe_customer_id는 organizations 테이블에만 저장 (프론트 노출 금지)
- [ ] STRIPE_SECRET_KEY는 서버 환경변수만 (Railway)
- [ ] STRIPE_WEBHOOK_SECRET은 서버 환경변수만
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY만 프론트에 노출 가능
- [ ] billing_events에 모든 webhook 페이로드 기록 (감사 추적)
- [ ] RLS: subscriptions/invoices는 해당 org 멤버만 조회 가능

## 7. Stripe Dashboard 설정 (Kevin 필요)

1. Stripe 계정 생성 → Dashboard
2. Products 생성 (5개 플랜)
3. 각 Product에 Price 생성 (monthly recurring)
4. Webhook 엔드포인트 등록: `https://api.nextaicrew.com/api/webhooks/stripe`
5. Webhook 이벤트 선택:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
6. API Keys → STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY → Railway/Vercel 환경변수
