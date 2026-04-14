/**
 * BudgetPage — Soul 예산 관리 대시보드
 * 도넛 차트 + Soul별 예산 카드 + 경고
 */
import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, AlertTriangle, TrendingUp, Zap, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import SoulAvatar from "../ui/SoulAvatar";
import "./budget.css";

interface Budget {
  id: string;
  agent_id: string;
  token_limit: number;
  tokens_used: number;
  cost_limit_cents: number;
  cost_used_cents: number;
  status: string;
  warning_threshold: number;
  period_type: string;
  period_start: string;
  period_end: string;
  usage_pct: number;
  cost_pct: number;
  agent: { id: string; name: string; role: string; avatar_url: string } | null;
}

interface Summary {
  total_budgets: number;
  total_token_limit: number;
  total_tokens_used: number;
  total_cost_limit_cents: number;
  total_cost_used_cents: number;
  token_usage_pct: number;
  cost_usage_pct: number;
  warning_count: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// SVG Donut Chart
function DonutChart({ used, limit, color, label }: { used: number; limit: number; color: string; label: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="budget-donut">
      <svg viewBox="0 0 128 128" className="budget-donut-svg">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--bg-quaternary, rgba(255,255,255,0.06))" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="budget-donut-label">
        <span className="budget-donut-pct">{pct}%</span>
        <span className="budget-donut-sub">{label}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status, pct }: { status: string; pct: number }) {
  let color = "#10b981", label = "정상";
  if (status === "limit_reached" || pct >= 100) { color = "#ef4444"; label = "한도 초과"; }
  else if (status === "warning" || pct >= 80) { color = "#f59e0b"; label = "경고"; }
  return (
    <span className="budget-status-badge" style={{ background: `${color}18`, color }}>
      {pct >= 80 && <AlertTriangle size={12} />} {label}
    </span>
  );
}

function BudgetCard({ budget, onDelete }: { budget: Budget; onDelete: (id: string) => void }) {
  const agent = budget.agent;
  const pct = budget.usage_pct;
  const barColor = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#10b981";

  return (
    <div className={`budget-card ${pct >= 80 ? "budget-card-warn" : ""}`}>
      <div className="budget-card-header">
        <SoulAvatar name={agent?.name || "?"} imageUrl={agent?.avatar_url} size="sm" />
        <div className="budget-card-info">
          <div className="budget-card-name">{agent?.name || budget.agent_id}</div>
          <div className="budget-card-role">{agent?.role || ""}</div>
        </div>
        <StatusBadge status={budget.status} pct={pct} />
        <button className="budget-delete-btn" onClick={() => onDelete(budget.id)} title="삭제">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="budget-card-bars">
        <div className="budget-bar-row">
          <span className="budget-bar-label"><Zap size={12} /> 토큰</span>
          <div className="budget-bar">
            <div className="budget-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
          </div>
          <span className="budget-bar-value">{formatTokens(budget.tokens_used)} / {formatTokens(budget.token_limit)}</span>
        </div>
        <div className="budget-bar-row">
          <span className="budget-bar-label"><TrendingUp size={12} /> 비용</span>
          <div className="budget-bar">
            <div className="budget-bar-fill" style={{ width: `${Math.min(100, budget.cost_pct)}%`, background: budget.cost_pct >= 80 ? "#f59e0b" : "#3b82f6" }} />
          </div>
          <span className="budget-bar-value">{formatCost(budget.cost_used_cents)} / {formatCost(budget.cost_limit_cents)}</span>
        </div>
      </div>

      <div className="budget-card-period">
        {budget.period_start} ~ {budget.period_end}
      </div>
    </div>
  );
}

// Add Budget Modal
function AddBudgetModal({ onClose, onAdd, souls }: {
  onClose: () => void;
  onAdd: (data: any) => void;
  souls: { id: string; name: string }[];
}) {
  const [agentId, setAgentId] = useState("");
  const [tokenLimit, setTokenLimit] = useState(1000000);
  const [costLimit, setCostLimit] = useState(60);

  return (
    <div className="budget-modal-overlay" onClick={onClose}>
      <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
        <h2>예산 할당</h2>

        <label>Soul 선택</label>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          <option value="">— 선택 —</option>
          {souls.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label>월간 토큰 한도</label>
        <input type="number" value={tokenLimit} onChange={(e) => setTokenLimit(Number(e.target.value))} />
        <span className="budget-input-hint">{formatTokens(tokenLimit)} 토큰</span>

        <label>월간 비용 한도 ($)</label>
        <input type="number" value={costLimit} onChange={(e) => setCostLimit(Number(e.target.value))} step={10} />
        <span className="budget-input-hint">{formatCost(costLimit * 100)}</span>

        <div className="budget-modal-actions">
          <button className="budget-btn-cancel" onClick={onClose}>취소</button>
          <button className="budget-btn-save" disabled={!agentId} onClick={() => {
            onAdd({ agent_id: agentId, token_limit: tokenLimit, cost_limit_cents: costLimit * 100 });
            onClose();
          }}>할당</button>
        </div>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [souls, setSouls] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        apiFetch("/api/budgets"),
        apiFetch("/api/budgets/summary"),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      setBudgets(bData.budgets || []);
      setAvailable(bData.available !== false);
      setSummary(sData.summary || null);

      // Load souls for add modal
      const soulsRes = await apiFetch("/api/souls");
      const soulsData = await soulsRes.json();
      setSouls((soulsData.agents || soulsData || []).map((a: any) => ({ id: a.id, name: a.name })));
    } catch {
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: any) => {
    try {
      await apiFetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await load();
    } catch (err) { console.error("Failed to add budget:", err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 예산을 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
      await load();
    } catch (err) { console.error("Failed to delete:", err); }
  };

  if (loading) {
    return <div className="budget-loading"><Wallet size={48} strokeWidth={1} /><p>예산 로딩 중...</p></div>;
  }

  return (
    <div className="budget-page">
      <div className="budget-header">
        <div className="budget-title-row">
          <Wallet size={24} />
          <h1>예산 관리</h1>
          <span className="budget-count">{budgets.length}개</span>
          <button className="budget-add-btn" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> 예산 할당
          </button>
        </div>

        {!available && (
          <div className="budget-unavailable-notice">
            ⚠️ 테이블 준비 중 — 008 DDL 실행 후 예산 관리 기능이 활성화됩니다.
          </div>
        )}
      </div>

      {/* Summary Donuts */}
      {summary && summary.total_budgets > 0 && (
        <div className="budget-summary">
          <DonutChart
            used={summary.total_tokens_used}
            limit={summary.total_token_limit}
            color={summary.token_usage_pct >= 80 ? "#f59e0b" : "#06b6d4"}
            label="토큰"
          />
          <DonutChart
            used={summary.total_cost_used_cents}
            limit={summary.total_cost_limit_cents}
            color={summary.cost_usage_pct >= 80 ? "#f59e0b" : "#10b981"}
            label="비용"
          />
          <div className="budget-summary-stats">
            <div className="budget-summary-stat">
              <span className="bss-value">{formatTokens(summary.total_tokens_used)}</span>
              <span className="bss-label">사용 토큰</span>
            </div>
            <div className="budget-summary-stat">
              <span className="bss-value">{formatCost(summary.total_cost_used_cents)}</span>
              <span className="bss-label">사용 비용</span>
            </div>
            <div className="budget-summary-stat">
              <span className="bss-value" style={{ color: summary.warning_count > 0 ? "#ef4444" : "#10b981" }}>
                {summary.warning_count}
              </span>
              <span className="bss-label">경고</span>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      <div className="budget-grid">
        {budgets.length === 0 ? (
          <div className="budget-empty">
            <Wallet size={64} strokeWidth={0.8} />
            <h2>예산이 없습니다</h2>
            <p>Soul별 토큰/비용 예산을 할당하세요.</p>
            <button className="budget-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> 첫 예산 할당
            </button>
          </div>
        ) : (
          budgets.map((b) => <BudgetCard key={b.id} budget={b} onDelete={handleDelete} />)
        )}
      </div>

      {showAdd && <AddBudgetModal onClose={() => setShowAdd(false)} onAdd={handleAdd} souls={souls} />}
    </div>
  );
}
