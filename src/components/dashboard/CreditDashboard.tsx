/**
 * Credit Dashboard Widget — 크레딧 잔고 + 사용 현황
 * 대시보드에 삽입되는 카드 컴포넌트
 */
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api-fetch";

interface CreditData {
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

interface Props {
  language?: string;
}

export default function CreditDashboard({ language = "ko" }: Props) {
  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const isKo = language === "ko";

  useEffect(() => {
    apiFetch("/api/credits/stats")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.shimmer} />
      </div>
    );
  }

  if (!data) return null;

  const usedPercent = data.planCredits > 0
    ? Math.round((data.totalSpent / data.planCredits) * 100)
    : 0;
  const remainingPercent = 100 - usedPercent;
  const isLow = remainingPercent < 20;
  const isEmpty = data.balance <= 0;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>💰</span>
        <span style={styles.headerTitle}>
          {isKo ? "크레딧 현황" : "Credits"}
        </span>
      </div>

      {/* Balance Ring */}
      <div style={styles.balanceSection}>
        <div style={styles.ringContainer}>
          <svg viewBox="0 0 120 120" style={styles.ring}>
            {/* Background */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="10" />
            {/* Progress */}
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={isEmpty ? "#EF4444" : isLow ? "#F59E0B" : "#4F46E5"}
              strokeWidth="10"
              strokeDasharray={`${remainingPercent * 3.14} ${(100 - remainingPercent) * 3.14}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div style={styles.ringCenter}>
            <span style={styles.balanceNumber}>{data.balance.toLocaleString()}</span>
            <span style={styles.balanceLabel}>{isKo ? "잔여" : "remaining"}</span>
          </div>
        </div>

        <div style={styles.planInfo}>
          <span style={styles.planCredits}>
            / {data.planCredits.toLocaleString()} {isKo ? "월 크레딧" : "monthly"}
          </span>
        </div>
      </div>

      {/* Local vs Cloud breakdown */}
      <div style={styles.breakdown}>
        <div style={styles.breakdownItem}>
          <span style={styles.breakdownIcon}>🏠</span>
          <div style={styles.breakdownText}>
            <span style={styles.breakdownLabel}>
              {isKo ? "로컬 (무료)" : "Local (free)"}
            </span>
            <span style={styles.breakdownValue}>
              {data.breakdown.localCredits.toLocaleString()} ({data.breakdown.localPercent}%)
            </span>
          </div>
          <div style={{
            ...styles.breakdownBar,
            width: `${data.breakdown.localPercent}%`,
            background: "#10B981",
          }} />
        </div>

        <div style={styles.breakdownItem}>
          <span style={styles.breakdownIcon}>☁️</span>
          <div style={styles.breakdownText}>
            <span style={styles.breakdownLabel}>
              {isKo ? "클라우드" : "Cloud"}
            </span>
            <span style={styles.breakdownValue}>
              {data.breakdown.cloudCredits.toLocaleString()} ({100 - data.breakdown.localPercent}%)
            </span>
          </div>
          <div style={{
            ...styles.breakdownBar,
            width: `${100 - data.breakdown.localPercent}%`,
            background: "#6366F1",
          }} />
        </div>
      </div>

      {/* Status message */}
      {isEmpty && (
        <div style={styles.warning}>
          {isKo
            ? "💡 크레딧이 소진되었습니다. 로컬 AI만 사용 가능합니다."
            : "💡 Credits exhausted. Only local AI available."}
        </div>
      )}
      {isLow && !isEmpty && (
        <div style={styles.info}>
          {isKo
            ? "⚠️ 크레딧이 20% 미만입니다. 충전을 권장합니다."
            : "⚠️ Less than 20% credits remaining."}
        </div>
      )}

      {/* Reset date */}
      {data.resetAt && (
        <div style={styles.resetDate}>
          {isKo ? "다음 리셋: " : "Next reset: "}
          {new Date(data.resetAt).toLocaleDateString(isKo ? "ko-KR" : "en-US")}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #E5E7EB",
  },
  shimmer: {
    height: 200,
    borderRadius: 12,
    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  balanceSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  ringContainer: {
    position: "relative",
    width: 120,
    height: 120,
  },
  ring: {
    width: "100%",
    height: "100%",
  },
  ringCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
  },
  balanceNumber: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  balanceLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  planInfo: {
    marginTop: 8,
  },
  planCredits: {
    fontSize: 13,
    color: "#6B7280",
  },
  breakdown: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  breakdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  breakdownIcon: {
    fontSize: 16,
  },
  breakdownText: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
  },
  breakdownValue: {
    fontSize: 13,
    color: "#6B7280",
  },
  breakdownBar: {
    position: "absolute",
    bottom: -4,
    left: 28,
    height: 3,
    borderRadius: 2,
    minWidth: 4,
  },
  warning: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "#FEF2F2",
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  info: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "#FFFBEB",
    color: "#D97706",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  resetDate: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
  },
};
