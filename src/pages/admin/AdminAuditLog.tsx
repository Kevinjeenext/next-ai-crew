/**
 * AdminAuditLog — /admin/audit 감사 로그 뷰어
 */
import { useState, useEffect } from "react";
import { ScrollText } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";

interface AuditEntry {
  id: string; actor_email: string; action: string;
  target_type: string | null; target_id: string | null;
  details: Record<string, any>; created_at: string;
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    try {
      const res = await apiFetch("/api/admin/audit-log?limit=100");
      if (res.ok) { const data = await res.json(); setLogs(data.logs); }
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>감사 로그</h1>
        <span className="admin-badge">{logs.length}건</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>시간</th><th>관리자</th><th>액션</th><th>대상</th><th>상세</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="admin-table-empty">로딩 중...</td></tr> :
            logs.length === 0 ? <tr><td colSpan={5} className="admin-table-empty"><ScrollText size={24} style={{ opacity: 0.3, marginBottom: 8 }} /><br />감사 로그 없음</td></tr> :
            logs.map(l => (
              <tr key={l.id}>
                <td className="mono">{new Date(l.created_at).toLocaleString("ko")}</td>
                <td>{l.actor_email}</td>
                <td><span className="action-tag">{l.action}</span></td>
                <td>{l.target_type ? `${l.target_type}: ${l.target_id?.slice(0,8)}...` : "—"}</td>
                <td className="mono">{JSON.stringify(l.details).slice(0, 60)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
