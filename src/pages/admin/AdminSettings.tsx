/**
 * AdminSettings — /admin/settings 시스템 설정 페이지
 */
import { useState, useEffect } from "react";
import { Settings, ToggleLeft, ToggleRight, Save, Check } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import { useAdmin } from "./AdminLayout";

interface SettingItem {
  value: any;
  updated_at: string | null;
}

const PLAN_OPTIONS = ["free", "starter", "pro", "team", "enterprise"];

export default function AdminSettings() {
  const { user } = useAdmin();
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isSuperAdmin = user?.system_role === "super_admin";

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {      const res = await apiFetch("/api/admin/settings", {
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch {} finally { setLoading(false); }
  }

  async function updateSetting(key: string, value: any) {
    setSaving(key);
    try {      const res = await apiFetch("/api/admin/settings/${key}", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: { value, updated_at: new Date().toISOString() } }));
        showToast(`${key} 저장 완료`);
      }
    } catch {} finally { setSaving(null); }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function getValue(key: string, fallback: any = null) {
    return settings[key]?.value ?? fallback;
  }

  if (loading) return <div className="admin-page"><p style={{ color: "var(--text-tertiary)" }}>로딩 중...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>시스템 설정</h1>
        {!isSuperAdmin && <span className="admin-badge" style={{ color: "#F59E0B" }}>읽기 전용 (super_admin 필요)</span>}
      </div>

      <div className="settings-grid">
        {/* 회원가입 허용 */}
        <SettingCard
          icon="🔐" title="회원가입 허용" description="새 유저 가입을 허용합니다"
          control={
            <ToggleButton
              value={getValue("signup_enabled", true)}
              onChange={v => updateSetting("signup_enabled", v)}
              disabled={!isSuperAdmin || saving === "signup_enabled"}
            />
          }
        />

        {/* 유지보수 모드 */}
        <SettingCard
          icon="🔧" title="유지보수 모드" description="활성화 시 일반 유저 접근 차단"
          control={
            <ToggleButton
              value={getValue("maintenance_mode", false)}
              onChange={v => updateSetting("maintenance_mode", v)}
              disabled={!isSuperAdmin || saving === "maintenance_mode"}
            />
          }
        />

        {/* 기본 요금제 */}
        <SettingCard
          icon="📋" title="기본 요금제" description="신규 가입 시 적용되는 기본 플랜"
          control={
            <SelectControl
              value={getValue("default_plan", "free")}
              options={PLAN_OPTIONS}
              onChange={v => updateSetting("default_plan", v)}
              disabled={!isSuperAdmin || saving === "default_plan"}
            />
          }
        />

        {/* 기본 Soul 수 */}
        <SettingCard
          icon="🤖" title="기본 Soul 제한" description="신규 조직의 기본 Soul 생성 한도"
          control={
            <NumberControl
              value={getValue("default_max_souls", 3)}
              onChange={v => updateSetting("default_max_souls", v)}
              disabled={!isSuperAdmin || saving === "default_max_souls"}
              min={1} max={100}
            />
          }
        />

        {/* 기본 멤버 수 */}
        <SettingCard
          icon="👥" title="기본 멤버 제한" description="신규 조직의 기본 멤버 한도"
          control={
            <NumberControl
              value={getValue("default_max_members", 5)}
              onChange={v => updateSetting("default_max_members", v)}
              disabled={!isSuperAdmin || saving === "default_max_members"}
              min={1} max={500}
            />
          }
        />

        {/* 허용 이메일 도메인 */}
        <SettingCard
          icon="📧" title="허용 이메일 도메인" description="비어있으면 모든 도메인 허용. 쉼표로 구분"
          control={
            <DomainsControl
              value={getValue("allowed_email_domains", [])}
              onChange={v => updateSetting("allowed_email_domains", v)}
              disabled={!isSuperAdmin || saving === "allowed_email_domains"}
            />
          }
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="settings-toast">
          <Check size={14} strokeWidth={2} /> {toast}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function SettingCard({ icon, title, description, control }: {
  icon: string; title: string; description: string; control: React.ReactNode;
}) {
  return (
    <div className="setting-card">
      <div className="setting-card-left">
        <span className="setting-icon">{icon}</span>
        <div>
          <div className="setting-title">{title}</div>
          <div className="setting-desc">{description}</div>
        </div>
      </div>
      <div className="setting-card-right">{control}</div>
    </div>
  );
}

function ToggleButton({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
  return (
    <button className={`setting-toggle ${value ? "on" : "off"}`} onClick={() => !disabled && onChange(!value)} disabled={disabled}>
      {value ? <ToggleRight size={28} strokeWidth={1.5} /> : <ToggleLeft size={28} strokeWidth={1.5} />}
      <span>{value ? "ON" : "OFF"}</span>
    </button>
  );
}

function SelectControl({ value, options, onChange, disabled }: { value: string; options: string[]; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <select className="setting-select" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function NumberControl({ value, onChange, disabled, min, max }: { value: number; onChange: (v: number) => void; disabled: boolean; min: number; max: number }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <div className="setting-number">
      <input type="number" value={local} min={min} max={max} disabled={disabled}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { const n = Math.max(min, Math.min(max, parseInt(local) || min)); onChange(n); }}
      />
      <button className="setting-save-btn" onClick={() => { const n = Math.max(min, Math.min(max, parseInt(local) || min)); onChange(n); }} disabled={disabled}>
        <Save size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function DomainsControl({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const [local, setLocal] = useState((value || []).join(", "));
  useEffect(() => { setLocal((value || []).join(", ")); }, [value]);
  return (
    <div className="setting-domains">
      <input type="text" value={local} placeholder="nextpay.co.kr, gmail.com" disabled={disabled}
        onChange={e => setLocal(e.target.value)}
      />
      <button className="setting-save-btn" onClick={() => {
        const domains = local.split(",").map(d => d.trim()).filter(Boolean);
        onChange(domains);
      }} disabled={disabled}>
        <Save size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
