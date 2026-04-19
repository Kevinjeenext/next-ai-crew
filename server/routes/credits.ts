/**
 * Credits API — 크레딧 잔고 조회 + 사용 내역 + 통계
 *
 * GET  /api/credits         — 현재 잔고 + 사용률
 * GET  /api/credits/history — 거래 내역 (페이지네이션)
 * GET  /api/credits/stats   — 기간별 사용 통계 (로컬 vs 클라우드)
 * POST /api/credits/topup   — 추가 크레딧 구매 (TODO: 결제 연동)
 */
import { Router, type Request, type Response } from "express";
import { checkCredits, getCreditStats, addCredits } from "../services/credit-service.ts";
import { supabaseAdmin } from "../lib/supabase.ts";

export const creditRoutes = Router();

// ─── Current balance ───
creditRoutes.get("/", async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) { res.status(400).json({ error: "Organization required" }); return; }

  try {
    const result = await checkCredits(orgId);
    res.json(result);
  } catch (err: any) {
    console.error("[Credits] Balance error:", err.message);
    res.status(500).json({ error: "Failed to check credits" });
  }
});

// ─── Usage statistics ───
creditRoutes.get("/stats", async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) { res.status(400).json({ error: "Organization required" }); return; }

  try {
    const stats = await getCreditStats(orgId);
    res.json(stats);
  } catch (err: any) {
    console.error("[Credits] Stats error:", err.message);
    res.status(500).json({ error: "Failed to get credit stats" });
  }
});

// ─── Transaction history ───
creditRoutes.get("/history", async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) { res.status(400).json({ error: "Organization required" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const { data, error, count } = await supabaseAdmin
      .from("credit_transactions")
      .select("*", { count: "exact" })
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      transactions: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("[Credits] History error:", err.message);
    res.status(500).json({ error: "Failed to get credit history" });
  }
});

// ─── Top-up (placeholder for payment integration) ───
creditRoutes.post("/topup", async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) { res.status(400).json({ error: "Organization required" }); return; }

  const { amount } = req.body;
  if (!amount || amount < 1000 || amount > 1000000) {
    res.status(400).json({ error: "Amount must be between 1,000 and 1,000,000 credits" });
    return;
  }

  try {
    // TODO: 결제 연동 (StepPay) — 현재는 직접 추가
    const newBalance = await addCredits(orgId, amount, "earn", "크레딧 충전");
    res.json({
      message: `${amount.toLocaleString()} 크레딧 충전 완료`,
      newBalance,
      amount,
    });
  } catch (err: any) {
    console.error("[Credits] Topup error:", err.message);
    res.status(500).json({ error: "Failed to top up credits" });
  }
});

export default creditRoutes;
