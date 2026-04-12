/**
 * AdminTenants — /admin/tenants 테넌트 관리
 */
import { useState, useEffect } from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Tenant {
  id: string; name: string; slug: string; status: string;
  max_souls: number; max_members: number; created_at: string;
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTenants(); }, [page]);

  async function fetchTenants() {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API}/api/admin/tenants?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const data = await res.json(); setTenants(data.tenants); setTotal(data.total); }
    } catch {} finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const API = import.meta.env.VITE_API_URL || "";
    await fetch(`${API}/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchTenants();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>테넌트 관리</h1>
        <span className="admin-badge">{total}개</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>이름</th><th>슬러그</th><th>상태</th><th>Soul 제한</th><th>멤버 제한</th><th>생성일</th><th>액션</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="admin-table-empty">로딩 중...</td></tr> :
            tenants.length === 0 ? <tr><td colSpan={7} className="admin-table-empty">테넌트 없음</td></tr> :
            tenants.map(t => (
              <tr key={t.id}>
                <td><Building2 size={14} style={{ marginRight: 6, opacity: 0.5 }} />{t.name}</td>
                <td className="mono">{t.slug}</td>
                <td><span className={`status-tag status-${t.status}`}>{t.status}</span></td>
                <td>{t.max_souls ?? 3}</td>
                <td>{t.max_members ?? 5}</td>
                <td>{new Date(t.created_at).toLocaleDateString("ko")}</td>
                <td>
                  {t.status === "active" ? (
                    <button className="admin-btn-sm danger" onClick={() => updateStatus(t.id, "suspended")}>정지</button>
                  ) : (
                    <button className="admin-btn-sm" onClick={() => updateStatus(t.id, "active")}>활성화</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
