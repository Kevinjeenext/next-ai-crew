/**
 * Industry Presets API — 업종별 AI 직원 패키지
 *
 * GET  /api/presets          — List all industry packages
 * GET  /api/presets/:id      — Get specific package details
 * POST /api/presets/:id/apply — Apply package (create souls for org)
 * GET  /api/presets/search?q= — Search packages by keyword
 */
import { Router, type Request, type Response } from "express";
import {
  listPresets,
  getPresetById,
  searchPresets,
  getPresetStats,
  type IndustryPackage,
} from "../services/industry-presets.ts";
import { supabaseAdmin } from "../lib/supabase.ts";

export const presetRoutes = Router();

// ─── List all presets ───
presetRoutes.get("/", (_req: Request, res: Response) => {
  const presets = listPresets();
  const stats = getPresetStats();
  res.json({ presets, stats });
});

// ─── Search presets ───
presetRoutes.get("/search", (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  if (!q) {
    res.json({ results: listPresets() });
    return;
  }
  const results = searchPresets(q);
  res.json({ results });
});

// ─── Get specific preset ───
presetRoutes.get("/:id", (req: Request, res: Response) => {
  const preset = getPresetById(req.params.id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  res.json(preset);
});

// ─── Apply preset (create souls) ───
presetRoutes.post("/:id/apply", async (req: Request, res: Response) => {
  const preset = getPresetById(req.params.id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }

  const orgId = (req as any).orgId;
  if (!orgId) {
    res.status(400).json({ error: "Organization ID required" });
    return;
  }

  try {
    // Check existing soul count for plan limit
    const { count: existingCount } = await supabaseAdmin
      .from("souls")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    const createdSouls: any[] = [];

    for (const soulPreset of preset.souls) {
      const soulData = {
        org_id: orgId,
        name: soulPreset.name,
        role: soulPreset.role,
        department: soulPreset.department,
        personality: soulPreset.personality,
        system_prompt: soulPreset.systemPrompt,
        skills: soulPreset.skills,
        model: soulPreset.model,
        avatar_url: soulPreset.avatar || null,
        status: "active",
        source: "industry-preset",
        preset_id: preset.id,
      };

      const { data, error } = await supabaseAdmin
        .from("souls")
        .insert(soulData)
        .select()
        .single();

      if (error) {
        console.error(`[Presets] Failed to create soul "${soulPreset.name}":`, error);
        continue;
      }

      createdSouls.push(data);
    }

    res.json({
      message: `${preset.emoji} ${preset.name} 적용 완료!`,
      package: preset.name,
      created: createdSouls.length,
      total: preset.souls.length,
      souls: createdSouls.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        department: s.department,
      })),
    });
  } catch (err: any) {
    console.error("[Presets] Apply error:", err);
    res.status(500).json({ error: "Failed to apply preset", details: err.message });
  }
});

export default presetRoutes;
