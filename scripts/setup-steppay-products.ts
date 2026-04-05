#!/usr/bin/env npx tsx
/**
 * StepPay Product & Price Plan Setup Script
 * Run on Railway or locally with STEPPAY_SECRET_TOKEN env var
 *
 * Usage: npx tsx scripts/setup-steppay-products.ts
 *
 * Creates 5 products with monthly subscription price plans:
 *   1. Free    - 1 agent  - ₩25,000/월 (7일 무료체험)
 *   2. Starter - 3 agents - ₩50,000/월
 *   3. Pro     - 5 agents - ₩80,000/월
 *   4. Max     - 10 agents - ₩120,000/월
 *   5. Enterprise - unlimited - 별도 문의 (₩0, contact sales)
 */

const STEPPAY_API = "https://api.steppay.kr/api/v1";

const SECRET_TOKEN = process.env.STEPPAY_SECRET_TOKEN;
if (!SECRET_TOKEN) {
  console.error("❌ STEPPAY_SECRET_TOKEN environment variable is required");
  process.exit(1);
}

async function steppayFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${STEPPAY_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Secret-Token": SECRET_TOKEN!,
      "Content-Type": "application/json",
      Accept: "*/*",
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${options.method || "GET"} ${path} → ${res.status}`);
    console.error(text);
    throw new Error(`StepPay API error: ${res.status}`);
  }

  return JSON.parse(text);
}

interface PlanConfig {
  name: string;
  description: string;
  priceKrw: number;
  trialDays: number;
  agentLimit: number;
}

const PLANS: PlanConfig[] = [
  {
    name: "Next AI Crew - Free",
    description: "AI 에이전트 1명, 기본 오피스, 7일 무료 체험",
    priceKrw: 25000,
    trialDays: 7,
    agentLimit: 1,
  },
  {
    name: "Next AI Crew - Starter",
    description: "AI 에이전트 3명, 확장 오피스, 이메일 지원",
    priceKrw: 50000,
    trialDays: 0,
    agentLimit: 3,
  },
  {
    name: "Next AI Crew - Pro",
    description: "AI 에이전트 5명, 풀 오피스, 우선 지원, API 액세스",
    priceKrw: 80000,
    trialDays: 0,
    agentLimit: 5,
  },
  {
    name: "Next AI Crew - Max",
    description: "AI 에이전트 10명, 무제한 룸, 전담 지원, SSO, SLA 99.9%",
    priceKrw: 120000,
    trialDays: 0,
    agentLimit: 10,
  },
  {
    name: "Next AI Crew - Enterprise",
    description: "무제한 에이전트, 전용 인프라, 화이트 라벨링, 24/7 프리미엄 지원",
    priceKrw: 0,  // Contact sales
    trialDays: 0,
    agentLimit: -1,
  },
];

async function createProduct(plan: PlanConfig): Promise<number> {
  console.log(`\n📦 Creating product: ${plan.name}`);

  const product = await steppayFetch("/products", {
    method: "POST",
    body: JSON.stringify({
      type: "SOFTWARE",
      status: plan.priceKrw > 0 ? "SALE" : "UNSOLD", // Enterprise is contact-only
      name: plan.name,
      description: plan.description,
      enabledDemo: plan.trialDays > 0,
      demoPeriod: plan.trialDays || 7,
      demoPeriodUnit: "DAY",
      useCombination: false,
    }),
  });

  console.log(`  ✅ Product created: id=${product.id}, code=${product.code}`);
  return product.id;
}

async function createPricePlan(productId: number, plan: PlanConfig): Promise<any> {
  if (plan.priceKrw === 0) {
    console.log(`  ⏭️  Skipping price plan for Enterprise (contact sales)`);
    return null;
  }

  console.log(`  💰 Creating price plan: ₩${plan.priceKrw.toLocaleString()}/월`);

  const pricePlan = await steppayFetch(`/products/${productId}/prices`, {
    method: "POST",
    body: JSON.stringify({
      plan: {
        name: `${plan.name} - Monthly`,
        description: plan.description,
      },
      type: "FLAT",  // Subscription (구독 요금제)
      price: plan.priceKrw,
      unit: "month",
      recurring: {
        interval: 1,
        intervalUnit: "MONTH",
      },
      // Annual plan (20% discount)
      // Will be created separately if needed
    }),
  });

  console.log(`  ✅ Price plan created: id=${pricePlan.id}, code=${pricePlan.code}`);
  return pricePlan;
}

async function createAnnualPricePlan(productId: number, plan: PlanConfig): Promise<any> {
  if (plan.priceKrw === 0) return null;

  const annualPrice = Math.round(plan.priceKrw * 12 * 0.8); // 20% discount
  console.log(`  💰 Creating annual plan: ₩${annualPrice.toLocaleString()}/년 (20% off)`);

  const pricePlan = await steppayFetch(`/products/${productId}/prices`, {
    method: "POST",
    body: JSON.stringify({
      plan: {
        name: `${plan.name} - Annual`,
        description: `${plan.description} (연간 결제 20% 할인)`,
      },
      type: "FLAT",
      price: annualPrice,
      unit: "year",
      recurring: {
        interval: 1,
        intervalUnit: "YEAR",
      },
    }),
  });

  console.log(`  ✅ Annual plan created: id=${pricePlan.id}, code=${pricePlan.code}`);
  return pricePlan;
}

async function main() {
  console.log("🚀 Next AI Crew — StepPay Product Setup");
  console.log("========================================\n");

  const results: Array<{
    plan: string;
    productId: number;
    productCode: string;
    monthlyPriceId?: number;
    monthlyPriceCode?: string;
    annualPriceId?: number;
    annualPriceCode?: string;
  }> = [];

  for (const plan of PLANS) {
    try {
      const productId = await createProduct(plan);

      // Get product details for code
      const product = await steppayFetch(`/products/${productId}`);

      const monthlyPlan = await createPricePlan(productId, plan);
      const annualPlan = await createAnnualPricePlan(productId, plan);

      results.push({
        plan: plan.name,
        productId,
        productCode: product.code,
        monthlyPriceId: monthlyPlan?.id,
        monthlyPriceCode: monthlyPlan?.code,
        annualPriceId: annualPlan?.id,
        annualPriceCode: annualPlan?.code,
      });

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`❌ Failed to create ${plan.name}:`, err.message);
    }
  }

  console.log("\n========================================");
  console.log("📋 Setup Complete! Product Summary:\n");
  console.log(JSON.stringify(results, null, 2));

  // Output env vars for Railway
  console.log("\n\n📋 Add these environment variables to Railway:\n");
  for (const r of results) {
    const envName = r.plan.split(" - ")[1]?.toUpperCase() || "UNKNOWN";
    if (r.monthlyPriceCode) {
      console.log(`STEPPAY_PRICE_${envName}=${r.monthlyPriceId}`);
    }
    if (r.annualPriceCode) {
      console.log(`STEPPAY_PRICE_${envName}_ANNUAL=${r.annualPriceId}`);
    }
  }
}

main().catch(console.error);
