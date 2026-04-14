/**
 * AdminLayout — /admin 라우트 가드 + 레이아웃
 * system_role: super_admin | admin 만 접근 가능
 */
import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Building2, ScrollText, Settings, Shield, ArrowLeft } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import "./admin.css";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  system_role: string;
}

const AdminContext = createContext<{ user: AdminUser | null }>({ user: null });
export const useAdmin = () => useContext(AdminContext);

export default function AdminLayout() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) throw new Error("Auth failed");

      const data = await res.json();
      const role = data.user?.system_role;
      if (role !== "super_admin" && role !== "admin") {
        setError("접근 권한이 없습니다. 관리자만 접근 가능합니다.");
        return;
      }
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (error) return (
    <div className="admin-denied">
      <Shield size={48} strokeWidth={1.5} />
      <h2>Access Denied</h2>
      <p>{error}</p>
      <button onClick={() => navigate("/")}>← 대시보드로 돌아가기</button>
    </div>
  );

  return (
    <AdminContext.Provider value={{ user }}>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <Shield size={20} strokeWidth={1.5} />
            <span>Admin</span>
            <span className="admin-role-badge">{user?.system_role}</span>
          </div>
          <nav className="admin-nav">
            <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
              <LayoutDashboard size={16} strokeWidth={1.5} /> 대시보드
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
              <Users size={16} strokeWidth={1.5} /> 유저 관리
            </NavLink>
            <NavLink to="/admin/tenants" className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
              <Building2 size={16} strokeWidth={1.5} /> 테넌트 관리
            </NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
              <ScrollText size={16} strokeWidth={1.5} /> 감사 로그
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
              <Settings size={16} strokeWidth={1.5} /> 시스템 설정
            </NavLink>
          </nav>
          <div className="admin-sidebar-footer">
            <button className="admin-back-btn" onClick={() => navigate("/")}>
              <ArrowLeft size={14} strokeWidth={1.5} /> 서비스로 돌아가기
            </button>
          </div>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </AdminContext.Provider>
  );
}
