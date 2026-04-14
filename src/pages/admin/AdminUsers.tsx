/**
 * AdminUsers — /admin/users 유저 관리 테이블
 */
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import { useAdmin } from "./AdminLayout";

interface User {
  id: string; email: string; full_name: string; system_role: string;
  is_active: boolean; created_at: string; last_sign_in_at: string | null;
}

export default function AdminUsers() {
  const { user: admin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    try {      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search ? { search } : {}) });
      const res = await apiFetch("/api/admin/users?${params}", {
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users); setTotal(data.total);
      }
    } catch {} finally { setLoading(false); }
  }

  async function changeRole(userId: string, newRole: string) {    const res = await apiFetch("/api/admin/users/${userId}/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_role: newRole }),
    });
    if (res.ok) fetchUsers();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>유저 관리</h1>
        <span className="admin-badge">{total}명</span>
      </div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} strokeWidth={1.5} />
          <input placeholder="이메일 또는 이름 검색..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th>가입일</th><th>최근 로그인</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="admin-table-empty">로딩 중...</td></tr> :
            users.length === 0 ? <tr><td colSpan={6} className="admin-table-empty">유저 없음</td></tr> :
            users.map(u => (
              <tr key={u.id}>
                <td>{u.full_name || "—"}</td>
                <td>{u.email}</td>
                <td>
                  {admin?.system_role === "super_admin" ? (
                    <select value={u.system_role} onChange={e => changeRole(u.id, e.target.value)} className="admin-role-select">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  ) : (
                    <span className={`role-tag role-${u.system_role}`}>{u.system_role}</span>
                  )}
                </td>
                <td><span className={`status-dot ${u.is_active ? "active" : "inactive"}`} />{u.is_active ? "활성" : "정지"}</td>
                <td>{new Date(u.created_at).toLocaleDateString("ko")}</td>
                <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ko") : "—"}</td>
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
