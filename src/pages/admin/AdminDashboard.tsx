/**
 * AdminDashboard — /admin 메인 통계 카드
 */
import { useState, useEffect } from "react";
import { Users, Building2, Bot, DollarSign } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAdmin } from "./AdminLayout";

interface Stats { total_users: number; total_tenants: number; total_souls: number; mrr: number; }

export default function AdminDashboard() {
  const { user } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {} finally { setLoading(false); }
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
