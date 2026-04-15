/**
 * Usage Tracker — Token counting + soul_usage + soul_budgets integration
 * Tracks per-Soul, per-org token usage for billing.
 *
 * Enhanced (Mingu, 2026-04-15):
 * - Fixed operator precedence bug in token accumulation
 * - Added soul_budgets integration (008 DDL)
 * - Budget warning (80%) + auto-pause (100%) logic
 * - budget_transactions recording per request
 * - Per-Soul budget check (checkSoulBudget)
 */

import { supabaseAdmin, SUPABASE_CONFIGURED } from "../lib/supabase.ts";
import type { LLMResponse } from "./providers.ts";

export interface BudgetStatus {
  allowed: boolean;
  usagePct: number;
  alertLevel: "normal" | "warning" | "critical" | "exceeded";
  budgetId?: string;
}

export class UsageTracker {
  /**
   * Record token usage after an LLM call.
   * Updates: soul_usage (monthly), org_token_budgets, soul_budgets, budget_transactions.
   */
  async recordUsage(
    soulId: string,
    orgId: string,
    response: LLMResponse,
    metadata?: { conversation_id?: string; ticketId?: string }
  ): Promise<void> {
    if (!SUPABASE_CONFIGURED) return;

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { prompt_tokens, completion_tokens, total_tokens } = response.usage;

    try {
      // 1. Upsert soul_usage (monthly aggregation)
      const { data: existing } = await supabaseAdmin
        .from("soul_usage")
        .select("id, total_tokens, prompt_tokens_sum, completion_tokens_sum, message_count")
        .eq("agent_id", soulId)
        .eq("org_id", orgId)
        .eq("period", period)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("soul_usage")
          .update({
            total_tokens: (existing.total_tokens || 0) + total_tokens,
            prompt_tokens_sum: (existing.prompt_tokens_sum || 0) + prompt_tokens,
            completion_tokens_sum: (existing.completion_tokens_sum || 0) + completion_tokens,
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
          total_tokens,
          prompt_tokens_sum: prompt_tokens,
          completion_tokens_sum: completion_tokens,
          message_count: 1,
          last_model_used: response.model,
        });
      }

      // 2. Update org_token_budgets (running total)
      const { data: orgBudget } = await supabaseAdmin
        .from("org_token_budgets")
        .select("id, tokens_used")
        .eq("org_id", orgId)
        .maybeSingle();

      if (orgBudget) {
        await supabaseAdmin
          .from("org_token_budgets")
          .update({
            tokens_used: (orgBudget.tokens_used || 0) + total_tokens,
            updated_at: now.toISOString(),
          })
          .eq("id", orgBudget.id);
      }

      // 3. Update soul_budgets + record budget_transaction (008 DDL)
      await this.updateSoulBudget(soulId, orgId, response, metadata?.ticketId);

      // 4. Update soul_conversations if conversation_id provided
      if (metadata?.conversation_id) {
        await supabaseAdmin
          .from("soul_conversations")
          .update({
            total_tokens,
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
   * Update soul_budgets and record budget_transaction.
   * Handles warning (80%) and auto-pause (100%) logic.
   */
  private async updateSoulBudget(
    soulId: string,
    orgId: string,
    response: LLMResponse,
    ticketId?: string,
  ): Promise<void> {
    try {
      const now = new Date();
      const today = now.toISOString().substring(0, 10); // YYYY-MM-DD

      // Find active budget for this soul covering today
      const { data: budget } = await supabaseAdmin
        .from("soul_budgets")
        .select("id, token_limit, tokens_used, status, warning_threshold, auto_pause_at_limit")
        .eq("org_id", orgId)
        .eq("agent_id", soulId)
        .lte("period_start", today)
        .gte("period_end", today)
        .in("status", ["active", "warning", "override"])
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!budget) return; // No budget configured for this soul

      const { prompt_tokens, completion_tokens, total_tokens } = response.usage;
      const newTokensUsed = (budget.tokens_used || 0) + total_tokens;

      // Calculate cost (rough estimate: $0.002/1K for input, $0.006/1K for output)
      const costCents = Math.ceil(
        (prompt_tokens * 0.002 + completion_tokens * 0.006) / 10
      );

      // Record budget_transaction
      await supabaseAdmin.from("budget_transactions").insert({
        budget_id: budget.id,
        org_id: orgId,
        agent_id: soulId,
        ticket_id: ticketId || null,
        input_tokens: prompt_tokens,
        output_tokens: completion_tokens,
        cost_cents: costCents,
        model: response.model,
        provider: this.detectProvider(response.model),
        description: `LLM call: ${response.model}`,
      }).then(null, (err: any) => {
        // budget_transactions table may not exist yet (008 DDL)
        console.warn("[UsageTracker] budget_transactions insert skipped:", err.message);
      });

      // Update soul_budgets tokens_used + status
      const usagePct = budget.token_limit > 0
        ? Math.round((newTokensUsed / budget.token_limit) * 100)
        : 0;

      const updates: Record<string, any> = {
        tokens_used: newTokensUsed,
        cost_used_cents: (budget as any).cost_used_cents || 0 + costCents,
        updated_at: now.toISOString(),
      };

      // Status transitions
      if (usagePct >= 100 && budget.auto_pause_at_limit && budget.status !== "limit_reached") {
        updates.status = "limit_reached";
        updates.paused_at = now.toISOString();
        console.warn(`[UsageTracker] Soul ${soulId} budget PAUSED (${usagePct}% used)`);
      } else if (usagePct >= (budget.warning_threshold || 80) && budget.status === "active") {
        updates.status = "warning";
        updates.warning_sent_at = now.toISOString();
        console.warn(`[UsageTracker] Soul ${soulId} budget WARNING (${usagePct}% used)`);
      }

      await supabaseAdmin
        .from("soul_budgets")
        .update(updates)
        .eq("id", budget.id);

    } catch (err: any) {
      // soul_budgets table may not exist yet (008 DDL not run)
      // Silently skip — org-level budget still works
      if (!err.message?.includes("relation") && !err.message?.includes("does not exist")) {
        console.warn("[UsageTracker] soul_budgets update skipped:", err.message);
      }
    }
  }

  /**
   * Check if org has exceeded token budget.
   */
  async checkBudget(orgId: string): Promise<{ allowed: boolean; usagePct: number }> {
    if (!SUPABASE_CONFIGURED) return { allowed: true, usagePct: 0 };

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

  /**
   * Check if a specific Soul has exceeded its budget (soul_budgets table).
   * Returns detailed status for pre-request gating.
   */
  async checkSoulBudget(soulId: string, orgId: string): Promise<BudgetStatus> {
    if (!SUPABASE_CONFIGURED) {
      return { allowed: true, usagePct: 0, alertLevel: "normal" };
    }

    try {
      const today = new Date().toISOString().substring(0, 10);

      const { data: budget } = await supabaseAdmin
        .from("soul_budgets")
        .select("id, token_limit, tokens_used, status, warning_threshold")
        .eq("org_id", orgId)
        .eq("agent_id", soulId)
        .lte("period_start", today)
        .gte("period_end", today)
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!budget) {
        return { allowed: true, usagePct: 0, alertLevel: "normal" };
      }

      // limit_reached = auto-paused
      if (budget.status === "limit_reached") {
        const pct = budget.token_limit > 0
          ? Math.round(((budget.tokens_used || 0) / budget.token_limit) * 100)
          : 100;
        return {
          allowed: false,
          usagePct: pct,
          alertLevel: "exceeded",
          budgetId: budget.id,
        };
      }

      const usagePct = budget.token_limit > 0
        ? Math.round(((budget.tokens_used || 0) / budget.token_limit) * 100)
        : 0;

      let alertLevel: BudgetStatus["alertLevel"] = "normal";
      if (usagePct >= 100) alertLevel = "exceeded";
      else if (usagePct >= 90) alertLevel = "critical";
      else if (usagePct >= (budget.warning_threshold || 80)) alertLevel = "warning";

      return {
        allowed: budget.status !== "limit_reached",
        usagePct,
        alertLevel,
        budgetId: budget.id,
      };
    } catch {
      // soul_budgets may not exist — fail-open
      return { allowed: true, usagePct: 0, alertLevel: "normal" };
    }
  }

  /** Detect provider from model name */
  private detectProvider(model: string): string {
    if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
    if (model.startsWith("claude")) return "anthropic";
    if (model.startsWith("gemini")) return "google";
    return "unknown";
  }
}

// Singleton
let _tracker: UsageTracker | null = null;
export function getUsageTracker(): UsageTracker {
  if (!_tracker) _tracker = new UsageTracker();
  return _tracker;
}
