/**
 * Industry Onboarding — 60초 업종 선택 → AI 팀 자동 생성
 *
 * Flow: 업종 선택 → 패키지 확인 → AI 팀 생성 → 완료!
 * "소상공인이 복잡한 설정 없이 바로 AI 직원을 만나는" 핵심 경험
 */
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api-fetch";

interface IndustryPackage {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  descriptionEn: string;
  targetPlan: string;
}

interface Props {
  onComplete: () => void;
  language?: string;
}

export default function IndustryOnboarding({ onComplete, language = "ko" }: Props) {
  const [step, setStep] = useState<"select" | "confirm" | "creating" | "done">("select");
  const [packages, setPackages] = useState<IndustryPackage[]>([]);
  const [selected, setSelected] = useState<IndustryPackage | null>(null);
  const [createdSouls, setCreatedSouls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isKo = language === "ko";

  // Load packages
  useEffect(() => {
    apiFetch("/api/industry-presets")
      .then((res) => res.json())
      .then((data) => setPackages(data.presets || []))
      .catch((err) => console.error("Failed to load presets:", err));
  }, []);

  // Apply package
  const applyPackage = async () => {
    if (!selected) return;
    setStep("creating");
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/industry-presets/${selected.id}/apply`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to apply");

      setCreatedSouls(data.souls || []);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: 업종 선택 ───
  if (step === "select") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isKo ? "🎯 어떤 업종이신가요?" : "🎯 What's your industry?"}
          </h1>
          <p style={styles.subtitle}>
            {isKo
              ? "업종을 선택하면 맞춤 AI 직원 팀을 바로 만들어드려요"
              : "Select your industry and we'll create a custom AI team instantly"}
          </p>
        </div>

        <div style={styles.grid}>
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              style={{
                ...styles.card,
                ...(selected?.id === pkg.id ? styles.cardSelected : {}),
              }}
              onClick={() => setSelected(pkg)}
            >
              <span style={styles.cardEmoji}>{pkg.emoji}</span>
              <span style={styles.cardName}>
                {isKo ? pkg.name : pkg.nameEn}
              </span>
              <span style={styles.cardDesc}>
                {isKo ? pkg.description : pkg.descriptionEn}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <button style={styles.nextBtn} onClick={() => setStep("confirm")}>
            {isKo ? `${selected.emoji} ${selected.name} 선택하기` : `Choose ${selected.nameEn}`}
          </button>
        )}
      </div>
    );
  }

  // ─── Step 2: 패키지 확인 ───
  if (step === "confirm") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {selected?.emoji} {isKo ? "이 팀으로 시작할까요?" : "Start with this team?"}
          </h1>
          <p style={styles.subtitle}>
            {isKo ? selected?.description : selected?.descriptionEn}
          </p>
        </div>

        <div style={styles.confirmBox}>
          <div style={styles.packageInfo}>
            <span style={styles.bigEmoji}>{selected?.emoji}</span>
            <h2 style={styles.packageName}>
              {isKo ? selected?.name : selected?.nameEn}
            </h2>
          </div>

          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.backBtn} onClick={() => setStep("select")}>
            {isKo ? "← 다시 선택" : "← Back"}
          </button>
          <button style={styles.confirmBtn} onClick={applyPackage} disabled={loading}>
            {isKo ? "🚀 AI 팀 만들기" : "🚀 Create AI Team"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: 생성 중 ───
  if (step === "creating") {
    return (
      <div style={styles.container}>
        <div style={styles.center}>
          <div style={styles.spinner} />
          <h2 style={styles.creatingTitle}>
            {isKo ? "AI 직원을 채용하고 있어요..." : "Hiring your AI team..."}
          </h2>
          <p style={styles.creatingDesc}>
            {isKo ? "잠시만 기다려주세요 ✨" : "Just a moment ✨"}
          </p>
        </div>
      </div>
    );
  }

  // ─── Step 4: 완료! ───
  return (
    <div style={styles.container}>
      <div style={styles.center}>
        <span style={styles.doneEmoji}>🎉</span>
        <h1 style={styles.doneTitle}>
          {isKo ? "AI 팀이 준비됐어요!" : "Your AI team is ready!"}
        </h1>
        <p style={styles.doneDesc}>
          {isKo
            ? `${createdSouls.length}명의 AI 직원이 합류했습니다`
            : `${createdSouls.length} AI employees have joined`}
        </p>

        <div style={styles.soulList}>
          {createdSouls.map((soul) => (
            <div key={soul.id} style={styles.soulItem}>
              <span style={styles.soulRole}>{soul.role}</span>
              <span style={styles.soulName}>{soul.name}</span>
              <span style={styles.soulDept}>{soul.department}</span>
            </div>
          ))}
        </div>

        <button style={styles.startBtn} onClick={onComplete}>
          {isKo ? "🗨️ 대화 시작하기" : "🗨️ Start Chatting"}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "40px 24px",
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    maxWidth: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
    width: "100%",
    marginBottom: 32,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    borderRadius: 16,
    border: "2px solid #e0e0e0",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
  },
  cardSelected: {
    borderColor: "#4F46E5",
    background: "#F5F3FF",
    boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.2)",
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#888",
    lineHeight: 1.4,
  },
  nextBtn: {
    padding: "14px 32px",
    borderRadius: 12,
    background: "#4F46E5",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
  },
  confirmBox: {
    background: "#F9FAFB",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 500,
    textAlign: "center",
    marginBottom: 24,
  },
  packageInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  bigEmoji: {
    fontSize: 64,
  },
  packageName: {
    fontSize: 22,
    fontWeight: 600,
  },
  error: {
    color: "#EF4444",
    marginTop: 12,
    fontSize: 14,
  },
  buttonRow: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
  },
  backBtn: {
    padding: "12px 24px",
    borderRadius: 10,
    background: "#F3F4F6",
    color: "#374151",
    fontSize: 15,
    border: "none",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "14px 32px",
    borderRadius: 12,
    background: "#4F46E5",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "4px solid #E5E7EB",
    borderTopColor: "#4F46E5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: 24,
  },
  creatingTitle: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 8,
  },
  creatingDesc: {
    fontSize: 16,
    color: "#666",
  },
  doneEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  },
  doneDesc: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  soulList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  soulItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#F9FAFB",
    borderRadius: 10,
  },
  soulRole: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: 500,
  },
  soulName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  soulDept: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  startBtn: {
    padding: "16px 40px",
    borderRadius: 14,
    background: "#4F46E5",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};
