/**
 * Credit Service — 크레딧 잔고 관리 + 소비 추적
 *
 * 핵심 로직:
 * 1. 메시지 전송 전 잔고 확인 (checkCredits)
 * 2. LLM 응답 후 크레딧 차감 (deductCredits)
 * 3. 로컬 모델 사용 시 50% 할인 자동 적용
 */
import { supabaseAdmin } from "../lib/supabase.ts";

// ─── Model weight mapping ───
const MODEL_WEIGHTS: Record<string, number> = {
  // Local (Ollama) — 50% discount
  "llama3.2:3b": 0.5,
  "qwen2.5:14b": 0.5,
  "qwen2.5-coder:7b": 0.5,
  "qwen2.5-coder:32b": 0.5,
  "gemma4:26b": 0.5,
  "glm4": 0.5,
  // Cloud Light — base rate
  "gpt-4o-mini": 1.0,
  "gemini-2.0-flash": 1.0,
  // Cloud Standard — 2x rate
  "gpt-4o": 2.0,
  "claude-sonnet-4-20250514": 2.0,
  "claude-opus-4-20250514": 3.0,
};

function getModelWeight(model: string): number {
  return MODEL_WEIGHTS[model] ?? 1.0;
}

function isLocalModel(model: string): boolean {
  return getModelWeight(model) <= 0.5;
}

// ─── Types ───
export interface CreditCheckResult {
  allowed: boolean;
  balance: number;
  localOnly: boolean;   // true = credits exhausted, only local allowed
  planCredits: number;
  usagePercent: number;
}

export interface CreditDeductResult {
  creditsUsed: number;
  balanceAfter: number;
  modelWeight: number;
  isLocal: boolean;
}

export interface CreditStats {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  planCredits: number;
  usagePercent: number;
  resetAt: string | null;
  breakdown: {
    localCredits: number;
    cloudCredits: number;
    localPercent: number;
  };
}

// ─── Service Functions ───

/**
 * Check if org has enough credits for a request
 * When balance is 0, localOnly=true (can still use local models for free-tier experience)
 */
export async function checkCredits(orgId: string): Promise<CreditCheckResult> {
  const { data, error } = await supabaseAdmin
    .from("org_credits")
    .select("balance, plan_credits, total_earned, total_spent")
    .eq("org_id", orgId)
    .single();

  if (error || !data) {
    // No credit record = new org, allow with default
    return {
      allowed: true,
      balance: 5000, // default starter credits
      localOnly: false,
      planCredits: 5000,
      usagePercent: 0,
    };
  }

  const usagePercent = data.plan_credits > 0
    ? Math.round((data.total_spent / data.plan_credits) * 100)
    : 0;

  return {
    allowed: data.balance > 0,
    balance: data.balance,
    localOnly: data.balance <= 0,
    planCredits: data.plan_credits,
    usagePercent,
  };
}

/**
 * Deduct credits after LLM response
 * Returns credits used and new balance
 */
export async function deductCredits(
  orgId: string,
  soulId: string | null,
  model: string,
  totalTokens: number,
  description?: string
): Promise<CreditDeductResult> {
  const weight = getModelWeight(model);
  const rawCredits = Math.ceil(totalTokens / 1000);
  const creditsUsed = Math.max(1, Math.round(rawCredits * weight));
  const local = isLocalModel(model);

  // Atomic deduct using RPC or direct update
  const { data, error } = await supabaseAdmin.rpc("deduct_credits", {
    p_org_id: orgId,
    p_amount: creditsUsed,
  });

  let balanceAfter = 0;

  if (error) {
    // RPC not available — fallback to direct update
    console.warn("[CreditService] RPC fallback:", error.message);

    const { data: current } = await supabaseAdmin
      .from("org_credits")
      .select("balance")
      .eq("org_id", orgId)
      .single();

    if (current) {
      balanceAfter = Math.max(0, current.balance - creditsUsed);
      await supabaseAdmin
        .from("org_credits")
        .update({
          balance: balanceAfter,
          total_spent: current.balance - balanceAfter + creditsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId);
    }
  } else {
    balanceAfter = data ?? 0;
  }

  // Record transaction
  await supabaseAdmin.from("credit_transactions").insert({
    org_id: orgId,
    soul_id: soulId,
    type: "spend",
    amount: -creditsUsed,
    balance_after: balanceAfter,
    description: description || `Chat response (${model})`,
    model,
    model_weight: weight,
    tokens_used: totalTokens,
    metadata: { is_local: local },
  });

  return {
    creditsUsed,
    balanceAfter,
    modelWeight: weight,
    isLocal: local,
  };
}

/**
 * Add credits (monthly reset, top-up, etc.)
 */
export async function addCredits(
  orgId: string,
  amount: number,
  type: "earn" | "reset" | "refund",
  description?: string
): Promise<number> {
  // Get current balance
  const { data: current } = await supabaseAdmin
    .from("org_credits")
    .select("balance, total_earned")
    .eq("org_id", orgId)
    .single();

  const newBalance = (current?.balance || 0) + amount;
  const newTotalEarned = (current?.total_earned || 0) + amount;

  if (current) {
    await supabaseAdmin
      .from("org_credits")
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId);
  } else {
    // Create new record
    await supabaseAdmin.from("org_credits").insert({
      org_id: orgId,
      balance: amount,
      total_earned: amount,
      total_spent: 0,
      plan_credits: amount,
    });
  }

  // Record transaction
  await supabaseAdmin.from("credit_transactions").insert({
    org_id: orgId,
    type,
    amount,
    balance_after: newBalance,
    description: description || `Credits ${type}`,
  });

  return newBalance;
}

/**
 * Get credit usage statistics
 */
export async function getCreditStats(orgId: string): Promise<CreditStats> {
  const { data: credits } = await supabaseAdmin
    .from("org_credits")
    .select("*")
    .eq("org_id", orgId)
    .single();

  // Get local vs cloud breakdown
  const { data: localTxns } = await supabaseAdmin
    .from("credit_transactions")
    .select("amount")
    .eq("org_id", orgId)
    .eq("type", "spend")
    .lt("model_weight", 1.0);

  const { data: cloudTxns } = await supabaseAdmin
    .from("credit_transactions")
    .select("amount")
    .eq("org_id", orgId)
    .eq("type", "spend")
    .gte("model_weight", 1.0);

  const localCredits = Math.abs(
    (localTxns || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  );
  const cloudCredits = Math.abs(
    (cloudTxns || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  );
  const totalUsed = localCredits + cloudCredits;

  return {
    balance: credits?.balance ?? 5000,
    totalEarned: credits?.total_earned ?? 5000,
    totalSpent: credits?.total_spent ?? 0,
    planCredits: credits?.plan_credits ?? 5000,
    usagePercent: credits?.plan_credits
      ? Math.round(((credits?.total_spent ?? 0) / credits.plan_credits) * 100)
      : 0,
    resetAt: credits?.reset_at ?? null,
    breakdown: {
      localCredits,
      cloudCredits,
      localPercent: totalUsed > 0 ? Math.round((localCredits / totalUsed) * 100) : 0,
    },
  };
}

/**
 * Initialize credits for a new organization
 */
export async function initOrgCredits(orgId: string, planCredits: number = 5000): Promise<void> {
  const { error } = await supabaseAdmin.from("org_credits").upsert({
    org_id: orgId,
    balance: planCredits,
    total_earned: planCredits,
    total_spent: 0,
    plan_credits: planCredits,
    reset_at: getNextResetDate(),
  });

  if (error) {
    console.error("[CreditService] Init error:", error);
  }
}

function getNextResetDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return next.toISOString();
}
