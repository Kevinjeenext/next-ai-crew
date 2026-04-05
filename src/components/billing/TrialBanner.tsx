/**
 * Trial Banner — "Free trial: X days remaining"
 * Design: Ivy Day 3 (stripe-architecture.md §4.3)
 *
 * Shows when: is_trial && trial_ends_at > now()
 * After expiry: "Trial ended. Subscribe to continue."
 */
import { useState, useEffect } from "react";

interface TrialBannerProps {
  isTrial: boolean;
  trialEndsAt: string | null;
  plan: string;
  onUpgrade?: () => void;
}

export default function TrialBanner({ isTrial, trialEndsAt, plan, onUpgrade }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!isTrial || !trialEndsAt) return;
    const endDate = new Date(trialEndsAt).getTime();
    const now = Date.now();
    const diff = Math.ceil((endDate - now) / 86400000);
    setDaysLeft(diff);
    setExpired(diff <= 0);
  }, [isTrial, trialEndsAt]);

  // Don't show for paid plans or non-trial
  if (!isTrial || plan !== "free") return null;

  if (expired) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl text-sm"
        style={{
          background: "rgba(244,63,94,0.1)",
          border: "1px solid rgba(244,63,94,0.3)",
        }}>
        <div className="flex items-center gap-2">
          <span>⏰</span>
          <span style={{ color: "#F43F5E" }}>
            Trial ended. Subscribe to reactivate your AI crew.
          </span>
        </div>
        <button
          onClick={onUpgrade}
          className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition hover:brightness-110 shrink-0"
          style={{ background: "#F43F5E" }}>
          Subscribe Now
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl text-sm"
      style={{
        background: "linear-gradient(90deg, rgba(37,99,235,0.08), rgba(6,182,212,0.08))",
        border: "1px solid rgba(6,182,212,0.2)",
      }}>
      <div className="flex items-center gap-2">
        <span>✨</span>
        <span style={{ color: "#06B6D4" }}>
          Free trial: <strong>{daysLeft}</strong> day{daysLeft !== 1 ? "s" : ""} remaining
        </span>
      </div>
      <button
        onClick={onUpgrade}
        className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition hover:brightness-110 shrink-0"
        style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
        Upgrade Now
      </button>
    </div>
  );
}
