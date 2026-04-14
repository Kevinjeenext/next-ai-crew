/**
 * Welcome Onboarding — shown when user has 0 agents after first login.
 * 5-step flow: Welcome → Team Name → Pick Agents → Creating → Done
 *
 * Design: Ivy QA pass — pixel avatars, 3-col grid, soul-glow borders, team name step.
 */
import { useState, useRef } from "react";
import * as api from "../../api";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api-fetch";
import type { Agent } from "../../types";

interface Props {
  departments: { id: string; name: string; name_ko: string; icon: string; color: string }[];
  onComplete: (agent: Agent) => void;
  language?: string;
}

const PRESET_AGENTS = [
  {
    name: "Alex",
    name_ko: "알렉스",
    role: "senior",
    role_ko: "풀스택 개발자",
    department_id: "engineering",
    avatar: "/icons/departments/icon-developer.svg",
    personality: "Pragmatic and detail-oriented. Writes clean, tested code.",
    cli_provider: "claude",
  },
  {
    name: "Maya",
    name_ko: "마야",
    role: "senior",
    role_ko: "UI/UX 디자이너",
    department_id: "design",
    avatar: "/icons/departments/icon-designer.svg",
    personality: "Creative and user-focused. Obsessed with pixel-perfect designs.",
    cli_provider: "claude",
  },
  {
    name: "Sam",
    name_ko: "샘",
    role: "team_leader",
    role_ko: "프로젝트 매니저",
    department_id: "planning",
    avatar: "/icons/departments/icon-pm.svg",
    personality: "Organized and communicative. Keeps the team aligned.",
    cli_provider: "claude",
  },
  {
    name: "Kai",
    name_ko: "카이",
    role: "senior",
    role_ko: "마케팅 전략가",
    department_id: "marketing",
    avatar: "/icons/departments/icon-marketer.svg",
    personality: "Data-driven and creative. Finds the right audience.",
    cli_provider: "claude",
  },
  {
    name: "Jordan",
    name_ko: "조던",
    role: "senior",
    role_ko: "DevOps 엔지니어",
    department_id: "engineering",
    avatar: "/icons/departments/icon-devops.svg",
    personality: "Calm under pressure. Automates everything.",
    cli_provider: "claude",
  },
  {
    name: "Rina",
    name_ko: "리나",
    role: "junior",
    role_ko: "데이터 분석가",
    department_id: "operations",
    avatar: "/icons/departments/icon-ea.svg",
    personality: "Curious and thorough. Turns data into insights.",
    cli_provider: "claude",
  },
];

type Step = "welcome" | "team-name" | "pick" | "creating" | "done";

// Inline keyframes
const KEYFRAMES = `
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes soulGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(6, 182, 212, 0.3), 0 0 16px rgba(6, 182, 212, 0.1); }
  50% { box-shadow: 0 0 16px rgba(6, 182, 212, 0.5), 0 0 32px rgba(6, 182, 212, 0.2); }
}
@keyframes soulSpark {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(2); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pixelWalk {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-4px); }
  75% { transform: translateY(2px); }
}
.pixel-icon { image-rendering: pixelated; image-rendering: crisp-edges; }
.fadeUp { will-change: transform, opacity; }
`;

export function WelcomeOnboarding({ departments, onComplete, language }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [teamName, setTeamName] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdCount, setCreatedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const ko = language === "ko";

  const getDeptName = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    return ko ? dept?.name_ko || dept?.name || id : dept?.name || id;
  };

  const toggleAgent = (idx: number) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  // Wrap a promise with a timeout
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
      ),
    ]);
  }

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setCreating(true);
    setStep("creating");
    setError("");
    setCreatedCount(0);

    // Ensure org exists before creating agents (guards against setup race condition)
    try {
      const sessionResult = await withTimeout(supabase.auth.getSession(), 5000, "getSession");
      const token = sessionResult.data.session?.access_token;
      if (token) {
        await withTimeout(
          apiFetch("/api/auth/setup", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }),
          8000,
          "auth/setup"
        );
      } else {
        console.warn("[Onboarding] No session token — skipping setup call");
      }
    } catch (setupErr: any) {
      console.warn("[Onboarding] Setup call failed (non-fatal):", setupErr.message);
    }

    let lastAgent: Agent | null = null;
    let successCount = 0;
    const errors: string[] = [];

    for (const idx of selected) {
      const preset = PRESET_AGENTS[idx];
      try {
        const created = await withTimeout(
          api.createAgent({
            name: preset.name,
            name_ko: preset.name_ko,
            department_id: null, // Always null in onboarding — FK constraint safety
            role: preset.role,
            cli_provider: preset.cli_provider,
            avatar_emoji: "🤖",
            personality: preset.personality,
          }),
          10000,
          `createAgent:${preset.name}`
        );
        lastAgent = created;
        successCount++;
        setCreatedCount(successCount);
      } catch (err: any) {
        console.error("[Onboarding] Failed to create agent:", preset.name, err);
        errors.push(`${preset.name}: ${err.message || "Unknown error"}`);
        setError(errors[0]); // Show first error
      }
    }

    setCreating(false);

    if (lastAgent) {
      // At least one agent created successfully
      setStep("done");
      setTimeout(() => onComplete(lastAgent!), 2000);
    } else {
      // All failed — go back to pick step with error visible
      setStep("pick");
      setError(errors.length > 0 ? errors[0] : "Agent creation failed. Please try again.");
    }
  };

  // Shared styles
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: "780px",
    width: "100%",
    background: "rgba(30, 41, 59, 0.85)",
    backdropFilter: "blur(16px)",
    borderRadius: "1.25rem",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    padding: "2.5rem",
    color: "#E2E8F0",
    animation: "fadeUp 0.4s ease-out",
    willChange: "transform, opacity" as const,
  };

  const ctaStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #06B6D4, #6366F1)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.875rem 2.5rem",
    fontSize: "1.05rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
  };

  const ctaDisabledStyle: React.CSSProperties = {
    ...ctaStyle,
    background: "rgba(71, 85, 105, 0.3)",
    color: "#64748B",
    cursor: "not-allowed",
  };

  const backBtnStyle: React.CSSProperties = {
    background: "transparent",
    color: "#94A3B8",
    border: "1px solid rgba(71, 85, 105, 0.4)",
    borderRadius: "0.5rem",
    padding: "0.625rem 1.5rem",
    cursor: "pointer",
    fontSize: "0.9rem",
  };

  return (
    <div style={containerStyle}>
      <style>{KEYFRAMES}</style>
      <div style={cardStyle}>
        {/* ========== Step 1: Welcome ========== */}
        {step === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <img
              className="pixel-icon"
              src="/icons/departments/icon-ceo.svg"
              alt=""
              width={80}
              height={80}
              style={{ margin: "0 auto 1.5rem", display: "block" }}
            />
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.75rem" }}>
              {ko ? "Your AI Crew starts here" : "Your AI Crew starts here"}
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
              {ko
                ? "AI 팀을 구성하고, 각자의 역할과 성격을 가진 팀원들과 함께 일하세요."
                : "Build your AI team — each member has a unique role, personality, and expertise."}
            </p>
            <button
              onClick={() => { setStep("team-name"); setTimeout(() => inputRef.current?.focus(), 100); }}
              style={ctaStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(6, 182, 212, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {ko ? "시작하기" : "Get Started"} →
            </button>
          </div>
        )}

        {/* ========== Step 2: Team Name ========== */}
        {step === "team-name" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀 이름을 정해주세요" : "Name Your Team"}
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.95rem", marginBottom: "2rem" }}>
              {ko ? "오피스 화면에 표시됩니다" : "This will appear in your office"}
            </p>

            {/* Preview */}
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
              color: "#06B6D4",
              marginBottom: "1.5rem",
              minHeight: "2rem",
              textShadow: "0 0 8px rgba(6, 182, 212, 0.4)",
            }}>
              {teamName || (ko ? "My AI Crew" : "My AI Crew")}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value.replace(/[<>]/g, ""))}
              placeholder={ko ? "My AI Crew" : "My AI Crew"}
              maxLength={30}
              style={{
                width: "100%",
                maxWidth: "360px",
                padding: "0.875rem 1rem",
                background: "rgba(15, 23, 42, 0.7)",
                border: "2px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "0.75rem",
                color: "#FFFFFF",
                fontSize: "1rem",
                textAlign: "center",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)"; }}
              onKeyDown={(e) => { if (e.key === "Enter") setStep("pick"); }}
            />

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem" }}>
              <button onClick={() => setStep("welcome")} style={backBtnStyle}>
                {ko ? "뒤로" : "Back"}
              </button>
              <button
                onClick={() => setStep("pick")}
                style={ctaStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(6, 182, 212, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {ko ? "다음" : "Next"} →
              </button>
            </div>
          </div>
        )}

        {/* ========== Step 3: Pick Agents ========== */}
        {step === "pick" && (
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀원을 선택하세요" : "Choose Your Team"}
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {ko
                ? `${selected.length}명 선택됨 — 나중에 더 추가할 수 있어요`
                : `${selected.length} selected — you can add more later`}
            </p>

            {/* 3-column grid (responsive) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.875rem",
              marginBottom: "1.5rem",
            }}>
              {PRESET_AGENTS.map((agent, idx) => {
                const isSelected = selected.includes(idx);
                return (
                  <button
                    key={agent.name}
                    onClick={() => toggleAgent(idx)}
                    style={{
                      background: isSelected
                        ? "rgba(6, 182, 212, 0.1)"
                        : "rgba(15, 23, 42, 0.5)",
                      border: `2px solid ${isSelected ? "#06B6D4" : "rgba(71, 85, 105, 0.3)"}`,
                      borderRadius: "0.875rem",
                      padding: "1.25rem 0.75rem",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      color: "#E2E8F0",
                      position: "relative",
                      minHeight: "44px",
                      ...(isSelected ? { animation: "soulGlow 2s ease-in-out infinite" } : {}),
                    }}
                  >
                    {/* Check badge */}
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#06B6D4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: "#FFFFFF",
                        fontWeight: 700,
                      }}>
                        ✓
                      </div>
                    )}

                    {/* Pixel avatar */}
                    <img
                      className="pixel-icon"
                      src={agent.avatar}
                      alt={agent.name}
                      width={56}
                      height={56}
                      style={{
                        margin: "0 auto 0.625rem",
                        display: "block",
                        minWidth: "56px",
                        minHeight: "56px",
                        ...(isSelected ? { animation: "pixelWalk 0.6s ease-in-out infinite" } : {}),
                      }}
                    />
                    <div style={{ fontWeight: 600, color: "#FFFFFF", fontSize: "0.95rem" }}>
                      {ko ? agent.name_ko : agent.name}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.78rem", marginTop: "0.25rem" }}>
                      {ko ? agent.role_ko : agent.role}
                    </div>
                    <div style={{
                      color: "#64748B",
                      fontSize: "0.7rem",
                      marginTop: "0.375rem",
                    }}>
                      {departments.find((d) => d.id === agent.department_id)?.icon}{" "}
                      {getDeptName(agent.department_id)}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p style={{ color: "#F87171", fontSize: "0.85rem", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "rgba(248,113,113,0.1)", borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.3)" }}>
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setStep("team-name")} style={backBtnStyle}>
                {ko ? "뒤로" : "Back"}
              </button>
              <button
                onClick={handleCreate}
                disabled={selected.length === 0}
                style={selected.length === 0 ? ctaDisabledStyle : ctaStyle}
                onMouseEnter={(e) => {
                  if (selected.length > 0) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(6, 182, 212, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {ko
                  ? `${selected.length}명 영입하기`
                  : `Recruit ${selected.length} Agent${selected.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* ========== Step 4: Creating ========== */}
        {step === "creating" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            {/* Pixel walk animation */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {selected.map((idx, i) => (
                <img
                  className="pixel-icon"
                  key={PRESET_AGENTS[idx].name}
                  src={PRESET_AGENTS[idx].avatar}
                  alt=""
                  width={40}
                  height={40}
                  style={{
                    imageRendering: "pixelated",
                    animation: `pixelWalk 0.6s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀을 구성하고 있어요..." : "Assembling your team..."}
            </h2>
            <p style={{ color: "#94A3B8" }}>
              {createdCount} / {selected.length} {ko ? "완료" : "complete"}
            </p>
            {/* Progress bar */}
            <div style={{
              width: "200px",
              height: "6px",
              background: "rgba(71, 85, 105, 0.3)",
              borderRadius: "3px",
              margin: "1rem auto 0",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${selected.length > 0 ? (createdCount / selected.length) * 100 : 0}%`,
                height: "100%",
                background: "linear-gradient(90deg, #06B6D4, #6366F1)",
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }} />
            </div>
            {error && (
              <p style={{ color: "#F87171", fontSize: "0.85rem", marginTop: "1rem" }}>{error}</p>
            )}
          </div>
        )}

        {/* ========== Step 5: Done ========== */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            {/* Soul spark effect */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: "1rem" }}>
              <div style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)",
                animation: "soulSpark 1.5s ease-out forwards",
              }} />
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", position: "relative" }}>
                {selected.map((idx) => (
                  <img
                    className="pixel-icon"
                    key={PRESET_AGENTS[idx].name}
                    src={PRESET_AGENTS[idx].avatar}
                    alt=""
                    width={48}
                    height={48}
                    style={{ imageRendering: "pixelated" }}
                  />
                ))}
              </div>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀 완성! 🎉" : "Team Ready! 🎉"}
            </h2>
            <p style={{ color: "#94A3B8" }}>
              {ko
                ? `${createdCount}명의 팀원이 오피스에 입장합니다...`
                : `${createdCount} team member${createdCount !== 1 ? "s" : ""} entering the office...`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
