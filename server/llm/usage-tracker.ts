/**
 * Usage Tracker — Token counting + soul_usage update
 * Tracks per-Soul, per-org token usage for billing
 */

import { supabaseAdmin } from "../lib/supabase.ts";
import type { LLMResponse } from "./providers.ts";

export class UsageTracker {
  /**
   * Record token usage after an LLM call
   */
  async recordUsage(
    soulId: string,
    orgId: string,
    response: LLMResponse,
    metadata?: { conversation_id?: string }
  ): Promise<void> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    try {
      // Upsert soul_usage (monthly aggregation)
      const { data: existing } = await supabaseAdmin
        .from("soul_usage")
        .select("id, total_tokens, message_count")
        .eq("agent_id", soulId)
        .eq("period", period)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("soul_usage")
          .update({
            total_tokens: (existing.total_tokens || 0) + response.usage.total_tokens,
            prompt_tokens_sum: (existing as any).prompt_tokens_sum || 0 + response.usage.prompt_tokens,
            completion_tokens_sum: (existing as any).completion_tokens_sum || 0 + response.usage.completion_tokens,
            message_count: (existing.message_count || 0) + 1,
            last_model_used: response.model,
            updated_at: now.toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("soul_usage").insert({
          agent_id: soulId,
          org_id: orgId,
          period,
          total_tokens: response.usage.total_tokens,
          prompt_tokens_sum: response.usage.prompt_tokens,
          completion_tokens_sum: response.usage.completion_tokens,
          message_count: 1,
          last_model_used: response.model,
        });
      }

      // Update org_token_budgets (running total)
      const { data: budget } = await supabaseAdmin
        .from("org_token_budgets")
        .select("id, tokens_used")
        .eq("org_id", orgId)
        .maybeSingle();

      if (budget) {
        await supabaseAdmin
          .from("org_token_budgets")
          .update({
            tokens_used: (budget.tokens_used || 0) + response.usage.total_tokens,
            updated_at: now.toISOString(),
          })
          .eq("id", budget.id);
      }

      // Also record in soul_conversations if conversation_id provided
      if (metadata?.conversation_id) {
        await supabaseAdmin
          .from("soul_conversations")
          .update({
            total_tokens: response.usage.total_tokens,
            model_used: response.model,
            ended_at: now.toISOString(),
          })
          .eq("id", metadata.conversation_id);
      }
    } catch (err: any) {
      // Non-fatal: log but don't break the conversation
      console.error("[UsageTracker] Failed to record usage:", err.message);
    }
  }

  /**
   * Check if org has exceeded token budget
   */
  async checkBudget(orgId: string): Promise<{ allowed: boolean; usagePct: number }> {
    try {
      const { data: budget } = await supabaseAdmin
        .from("org_token_budgets")
        .select("tokens_used, monthly_budget")
        .eq("org_id", orgId)
        .maybeSingle();

      if (!budget || !budget.monthly_budget) {
        return { allowed: true, usagePct: 0 }; // No budget set = unlimited
      }

      const pct = Math.round((budget.tokens_used / budget.monthly_budget) * 100);
      return {
        allowed: budget.tokens_used < budget.monthly_budget,
        usagePct: pct,
      };
    } catch {
      return { allowed: true, usagePct: 0 }; // fail-open
    }
  }
}

// Singleton
let _tracker: UsageTracker | null = null;
export function getUsageTracker(): UsageTracker {
  if (!_tracker) _tracker = new UsageTracker();
  return _tracker;
}
