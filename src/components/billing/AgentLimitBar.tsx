/**
 * Agent Limit Bar — "2/3 agents used" progress bar
 * Design: Ivy Day 3 (stripe-architecture.md §4.2)
 *
 * Shows agent usage vs plan limit.
 * At limit: disables add button, shows upgrade CTA.
 */

interface AgentLimitBarProps {
  current: number;
  limit: number;
  plan: string;
  onUpgrade?: () => void;
}

export default function AgentLimitBar({ current, limit, plan, onUpgrade }: AgentLimitBarProps) {
  // Unlimited plan
  if (limit === -1) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs"
        style={{ background: "var(--th-card-bg)", border: "1px solid var(--th-card-border)" }}>
        <span style={{ color: "var(--th-text-muted)" }}>
          🤖 <strong style={{ color: "var(--th-text-heading)" }}>{current}</strong> agents
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "rgba(99,102,241,0.15)", color: "#6366F1" }}>
          {plan.toUpperCase()} — Unlimited
        </span>
      </div>
    );
  }

  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const atLimit = current >= limit;
  const nearLimit = current >= limit - 1 && !atLimit;

  // Progress bar color
  const barColor = atLimit
    ? "#F43F5E"    // red at limit
    : nearLimit
      ? "#FBBF24"  // amber near limit
      : "#2563EB";  // blue normal

  return (
    <div className="rounded-xl px-4 py-3"
      style={{ background: "var(--th-card-bg)", border: "1px solid var(--th-card-border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: "var(--th-text-muted)" }}>
          🤖 Agent usage
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tabular-nums"
            style={{ color: atLimit ? "#F43F5E" : "var(--th-text-heading)" }}>
            {current}/{limit}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: `${barColor}20`,
              color: barColor,
            }}>
            {plan.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--th-bg-secondary, rgba(30,41,59,1))" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: atLimit
              ? "#F43F5E"
              : `linear-gradient(90deg, #2563EB, #06B6D4)`,
          }}
        />
      </div>

      {/* At limit: upgrade CTA */}
      {atLimit && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: "#F43F5E" }}>
            Agent limit reached
          </span>
          <button
            onClick={onUpgrade}
            className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white transition hover:brightness-110"
            style={{ background: "#2563EB" }}>
            Upgrade to add more →
          </button>
        </div>
      )}
    </div>
  );
}
