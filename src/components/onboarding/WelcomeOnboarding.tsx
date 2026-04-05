/**
 * Welcome Onboarding — shown when user has 0 agents after first login.
 * Guides through creating their first AI team member.
 */
import { useState } from "react";
import * as api from "../../api";
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
    role: "Full-Stack Developer",
    department_id: "engineering",
    avatar_emoji: "👨‍💻",
    personality: "Pragmatic and detail-oriented. Writes clean, tested code.",
    cli_provider: "anthropic",
  },
  {
    name: "Maya",
    name_ko: "마야",
    role: "UI/UX Designer",
    department_id: "design",
    avatar_emoji: "🎨",
    personality: "Creative and user-focused. Obsessed with pixel-perfect designs.",
    cli_provider: "anthropic",
  },
  {
    name: "Sam",
    name_ko: "샘",
    role: "Project Manager",
    department_id: "planning",
    avatar_emoji: "📋",
    personality: "Organized and communicative. Keeps the team aligned.",
    cli_provider: "anthropic",
  },
  {
    name: "Kai",
    name_ko: "카이",
    role: "Marketing Strategist",
    department_id: "marketing",
    avatar_emoji: "📢",
    personality: "Data-driven and creative. Finds the right audience.",
    cli_provider: "anthropic",
  },
  {
    name: "Jordan",
    name_ko: "조던",
    role: "DevOps Engineer",
    department_id: "engineering",
    avatar_emoji: "🔧",
    personality: "Calm under pressure. Automates everything.",
    cli_provider: "anthropic",
  },
  {
    name: "Rina",
    name_ko: "리나",
    role: "Data Analyst",
    department_id: "operations",
    avatar_emoji: "📊",
    personality: "Curious and thorough. Turns data into insights.",
    cli_provider: "anthropic",
  },
];

type Step = "welcome" | "pick" | "creating" | "done";

export function WelcomeOnboarding({ departments, onComplete, language }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [selected, setSelected] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdCount, setCreatedCount] = useState(0);

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

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setCreating(true);
    setStep("creating");
    setError("");

    let lastAgent: Agent | null = null;
    for (const idx of selected) {
      const preset = PRESET_AGENTS[idx];
      try {
        lastAgent = await api.createAgent({
          name: preset.name,
          name_ko: preset.name_ko,
          department_id: preset.department_id,
          role: preset.role,
          cli_provider: preset.cli_provider,
          avatar_emoji: preset.avatar_emoji,
          personality: preset.personality,
        });
        setCreatedCount((c) => c + 1);
      } catch (err: any) {
        console.error("[Onboarding] Failed to create agent:", preset.name, err);
        setError(err.message || "Failed to create agent");
      }
    }

    setCreating(false);
    if (lastAgent) {
      setStep("done");
      setTimeout(() => onComplete(lastAgent!), 1500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          width: "100%",
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(12px)",
          borderRadius: "1rem",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          padding: "2.5rem",
          color: "#E2E8F0",
        }}
      >
        {/* Step: Welcome */}
        {step === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.75rem" }}>
              {ko ? "Next AI Crew에 오신 것을 환영합니다!" : "Welcome to Next AI Crew!"}
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              {ko
                ? "AI 팀원을 생성하여 업무를 시작하세요. 각 에이전트는 고유한 역할과 성격을 가집니다."
                : "Create your AI team members to get started. Each agent has a unique role and personality."}
            </p>
            <button
              onClick={() => setStep("pick")}
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.875rem 2.5rem",
                fontSize: "1.05rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {ko ? "팀 구성 시작하기" : "Build Your Team"} →
            </button>
          </div>
        )}

        {/* Step: Pick agents */}
        {step === "pick" && (
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀원을 선택하세요" : "Choose Your Team"}
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {ko
                ? `${selected.length}명 선택됨 — 나중에 더 추가할 수 있습니다`
                : `${selected.length} selected — you can add more later`}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {PRESET_AGENTS.map((agent, idx) => {
                const isSelected = selected.includes(idx);
                return (
                  <button
                    key={agent.name}
                    onClick={() => toggleAgent(idx)}
                    style={{
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.2)"
                        : "rgba(15, 23, 42, 0.5)",
                      border: `2px solid ${isSelected ? "#6366F1" : "rgba(71, 85, 105, 0.4)"}`,
                      borderRadius: "0.75rem",
                      padding: "1rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      color: "#E2E8F0",
                    }}
                  >
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
                      {agent.avatar_emoji}
                      {isSelected && <span style={{ marginLeft: "0.5rem", fontSize: "1rem" }}>✓</span>}
                    </div>
                    <div style={{ fontWeight: 600, color: "#FFFFFF", fontSize: "0.95rem" }}>
                      {ko ? agent.name_ko : agent.name}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                      {agent.role}
                    </div>
                    <div
                      style={{
                        color: "#64748B",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      {departments.find((d) => d.id === agent.department_id)?.icon}{" "}
                      {getDeptName(agent.department_id)}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep("welcome")}
                style={{
                  background: "transparent",
                  color: "#94A3B8",
                  border: "1px solid rgba(71, 85, 105, 0.4)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 1.5rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {ko ? "뒤로" : "Back"}
              </button>
              <button
                onClick={handleCreate}
                disabled={selected.length === 0}
                style={{
                  background:
                    selected.length === 0
                      ? "rgba(71, 85, 105, 0.3)"
                      : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: selected.length === 0 ? "#64748B" : "#FFFFFF",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 1.5rem",
                  cursor: selected.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {ko
                  ? `${selected.length}명 영입하기`
                  : `Recruit ${selected.length} Agent${selected.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Creating */}
        {step === "creating" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                border: "3px solid rgba(99, 102, 241, 0.3)",
                borderTopColor: "#6366F1",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1.5rem",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀원 영입 중..." : "Recruiting agents..."}
            </h2>
            <p style={{ color: "#94A3B8" }}>
              {createdCount} / {selected.length} {ko ? "완료" : "complete"}
            </p>
            {error && (
              <p style={{ color: "#F87171", fontSize: "0.85rem", marginTop: "1rem" }}>{error}</p>
            )}
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              {ko ? "팀 구성 완료!" : "Team Ready!"}
            </h2>
            <p style={{ color: "#94A3B8" }}>
              {ko
                ? `${createdCount}명의 AI 팀원이 합류했습니다. 오피스로 이동합니다...`
                : `${createdCount} AI team member${createdCount !== 1 ? "s" : ""} joined. Heading to the office...`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
