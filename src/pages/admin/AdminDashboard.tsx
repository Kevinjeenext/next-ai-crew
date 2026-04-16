/**
 * AdminDashboard — /admin 메인 통계 카드
 */
import { useState, useEffect } from "react";
import { Users, Building2, Bot, DollarSign, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import { useAdmin } from "./AdminLayout";
import SoulAvatar from "../../components/ui/SoulAvatar";

interface Stats { total_users: number; total_tenants: number; total_souls: number; mrr: number; }
interface UsageSummary { period: string; total_tokens: number; prompt_tokens: number; completion_tokens: number; message_count: number; active_souls: number; budget_limit: number; budget_used_pct: number; plan: string; }
interface SoulUsage { soul_id: string; soul_name: string; soul_role: string; avatar_url?: string; total_tokens: number; message_count: number; avg_tokens_per_msg: number; }
interface DailyHistory { date: string; total_tokens: number; message_count: number; }

export default function AdminDashboard() {
  const { user } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [soulUsage, setSoulUsage] = useState<SoulUsage[]>([]);
  const [history, setHistory] = useState<DailyHistory[]>([]);

  useEffect(() => { fetchStats(); fetchUsage(); }, []);

  async function fetchStats() {
    try {
      const res = await apiFetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchUsage() {
    try {
      const [sumRes, soulRes, histRes] = await Promise.all([
        apiFetch("/api/usage/summary"),
        apiFetch("/api/usage/souls"),
        apiFetch("/api/usage/history"),
      ]);
      if (sumRes.ok) setUsage(await sumRes.json());
      if (soulRes.ok) { const d = await soulRes.json(); setSoulUsage(d.souls || d || []); }
      if (histRes.ok) { const d = await histRes.json(); setHistory(d.history || d || []); }
    } catch {}
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>백오피스 대시보드</h1>
        <span className="admin-user-badge">{user?.email} ({user?.system_role})</span>
      </div>
      <div className="admin-stats-grid">
        <StatCard icon={<Users size={24} />} label="전체 유저" value={stats?.total_users ?? "—"} loading={loading} />
        <StatCard icon={<Building2 size={24} />} label="테넌트" value={stats?.total_tenants ?? "—"} loading={loading} />
        <StatCard icon={<Bot size={24} />} label="Soul 에이전트" value={stats?.total_souls ?? "—"} loading={loading} />
        <StatCard icon={<DollarSign size={24} />} label="MRR" value={stats?.mrr ? `₩${stats.mrr.toLocaleString()}` : "₩0"} loading={loading} />
      </div>

      {/* Token Usage */}
      <div className="admin-section">
        <h2 className="admin-section-title"><Zap size={18} /> 토큰 사용량</h2>
        <div className="admin-stats-grid">
          <StatCard icon={<Zap size={24} />} label="이번 달 토큰" value={usage ? usage.total_tokens.toLocaleString() : "—"} loading={!usage} />
          <StatCard icon={<TrendingUp size={24} />} label="메시지 수" value={usage?.message_count ?? "—"} loading={!usage} />
          <StatCard icon={<Bot size={24} />} label="활성 Soul" value={usage?.active_souls ?? "—"} loading={!usage} />
          <StatCard icon={<AlertTriangle size={24} />} label="예산 사용률" value={usage ? `${usage.budget_used_pct}%` : "—"} loading={!usage} />
        </div>
        {usage && usage.budget_limit > 0 && (
          <div className="admin-budget-bar">
            <div className="admin-budget-label">
              <span>{usage.plan} 플랜</span>
              <span>{usage.total_tokens.toLocaleString()} / {usage.budget_limit.toLocaleString()}</span>
            </div>
            <div className="admin-budget-track">
              <div className={`admin-budget-fill ${usage.budget_used_pct > 80 ? "warning" : ""} ${usage.budget_used_pct > 95 ? "danger" : ""}`}
                style={{ width: `${Math.min(usage.budget_used_pct, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Soul Usage */}
      {soulUsage.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">Soul별 사용량</h2>
          <div className="admin-soul-usage-list">
            {soulUsage.slice(0, 10).map(s => (
              <div key={s.soul_id} className="admin-soul-usage-row">
                <SoulAvatar name={s.soul_name} imageUrl={s.avatar_url} size="sm" />
                <div className="admin-soul-usage-info">
                  <span className="admin-soul-usage-name">{s.soul_name}</span>
                  <span className="admin-soul-usage-role">{s.soul_role}</span>
                </div>
                <div className="admin-soul-usage-tokens">{s.total_tokens.toLocaleString()} 토큰</div>
                <div className="admin-soul-usage-msgs">{s.message_count}건</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily History */}
      {history.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">일별 추이 (14일)</h2>
          <div className="admin-history-bars">
            {history.slice(-14).map(d => {
              const max = Math.max(...history.map(h => h.total_tokens), 1);
              return (
                <div key={d.date} className="admin-history-bar-col">
                  <div className="admin-history-bar" style={{ height: `${(d.total_tokens / max) * 80}px` }} />
                  <span>{d.date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | number; loading: boolean }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-info">
        <div className="admin-stat-value">{loading ? "..." : value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
