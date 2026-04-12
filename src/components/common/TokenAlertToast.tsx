/**
 * TokenAlertToast — Ivy 03-pricing-token-ui P1
 * 토큰 사용량 경고 토스트 알림
 * 트리거: 75% (amber), 90% (orange), 100%+ (rose)
 */
import { useState, useEffect } from "react";
import "../billing/billing.css";

interface Props {
  usagePct: number;
  onDismiss?: () => void;
}

function getAlertConfig(pct: number): { show: boolean; level: "warning" | "danger"; message: string; emoji: string } | null {
  if (pct >= 100) return { show: true, level: "danger", message: "토큰이 소진되었습니다. 충전이 필요합니다.", emoji: "❌" };
  if (pct >= 90)  return { show: true, level: "danger", message: "토큰이 90% 소진되었습니다. 곧 소진됩니다.", emoji: "🟠" };
  if (pct >= 75)  return { show: true, level: "warning", message: `토큰이 ${pct}% 소진되었습니다.`, emoji: "⚠️" };
  return null;
}

export default function TokenAlertToast({ usagePct, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const config = getAlertConfig(usagePct);

  useEffect(() => {
    if (config && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [config, dismissed]);

  if (!visible || !config || dismissed) return null;

  return (
    <div className={`token-alert-toast ${config.level}`}>
      <span style={{ fontSize: 20 }}>{config.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--th-text-heading, #fff)", marginBottom: 4 }}>
          {config.message}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="hire-btn"
            style={{ flex: "none", padding: "6px 14px", fontSize: 11, borderRadius: 8 }}
            onClick={() => { window.location.href = "/dashboard/billing"; }}
          >
            충전하기
          </button>
          <button
            className="soul-profile-btn"
            style={{ flex: "none", padding: "6px 14px", fontSize: 11, borderRadius: 8 }}
            onClick={() => { setDismissed(true); setVisible(false); onDismiss?.(); }}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
