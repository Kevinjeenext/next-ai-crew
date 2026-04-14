/**
 * GoalsPage — OKR 목표 정렬 뷰
 * Objective → Key Results 계층 카드 + 진행률
 */
import React, { useState, useEffect, useCallback } from "react";
import { Target, Plus, ChevronDown, ChevronRight, Trash2, Edit3, Check, X, Flag, AlertTriangle } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import SoulAvatar from "../ui/SoulAvatar";
import "./goals.css";

interface Goal {
  id: string;
  parent_id: string | null;
  goal_type: string;
  title: string;
  description: string | null;
  metric_type: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  start_date: string | null;
  due_date: string | null;
  status: string;
  progress: number;
  color: string;
  owner_agent_id: string | null;
  owner: { id: string; name: string; avatar_url: string; preset_id: string } | null;
}

interface GoalTree extends Goal {
  children: GoalTree[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "초안", color: "#6b7280", icon: <Edit3 size={12} /> },
  active: { label: "진행중", color: "#3b82f6", icon: <Target size={12} /> },
  on_track: { label: "순조로움", color: "#10b981", icon: <Check size={12} /> },
  at_risk: { label: "위험", color: "#f59e0b", icon: <AlertTriangle size={12} /> },
  behind: { label: "지연", color: "#ef4444", icon: <AlertTriangle size={12} /> },
  completed: { label: "완료", color: "#10b981", icon: <Check size={12} /> },
  cancelled: { label: "취소", color: "#6b7280", icon: <X size={12} /> },
};

const TYPE_LABELS: Record<string, string> = {
  mission: "미션",
  objective: "Objective",
  key_result: "Key Result",
  project: "프로젝트",
  milestone: "마일스톤",
};

function buildGoalTree(goals: Goal[]): GoalTree[] {
  const map = new Map<string, GoalTree>();
  const roots: GoalTree[] = [];

  goals.forEach((g) => map.set(g.id, { ...g, children: [] }));
  goals.forEach((g) => {
    const node = map.get(g.id)!;
    if (g.parent_id && map.has(g.parent_id)) {
      map.get(g.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function ProgressBar({ progress, color, size = "md" }: { progress: number; color: string; size?: "sm" | "md" }) {
  return (
    <div className={`goal-progress-bar goal-progress-${size}`}>
      <div className="goal-progress-fill" style={{ width: `${progress}%`, background: color }} />
      <span className="goal-progress-text">{progress}%</span>
    </div>
  );
}

function GoalCard({ goal, depth, onUpdate, onDelete, collapsed, onToggle }: {
  goal: GoalTree;
  depth: number;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: (id: string) => void;
}) {
  const hasChildren = goal.children.length > 0;
  const statusConf = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
  const isObjective = goal.goal_type === "objective" || goal.goal_type === "mission";

  return (
    <div className="goal-branch">
      <div className={`goal-card goal-type-${goal.goal_type}`} style={{ "--goal-color": goal.color } as React.CSSProperties}>
        <div className="goal-card-header">
          {hasChildren && (
            <button className="goal-toggle" onClick={() => onToggle(goal.id)}>
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <span className="goal-type-badge" style={{ background: `${goal.color}22`, color: goal.color }}>
            {TYPE_LABELS[goal.goal_type] || goal.goal_type}
          </span>
          <h3 className={`goal-title ${isObjective ? "goal-title-obj" : ""}`}>{goal.title}</h3>
          <div className="goal-actions">
            <button className="goal-action-btn" onClick={() => onDelete(goal.id)} title="삭제">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {goal.description && (
          <p className="goal-description">{goal.description}</p>
        )}

        <div className="goal-card-footer">
          <ProgressBar progress={goal.progress} color={goal.color} size={isObjective ? "md" : "sm"} />

          <div className="goal-meta">
            <span className="goal-status-badge" style={{ background: `${statusConf.color}18`, color: statusConf.color }}>
              {statusConf.icon} {statusConf.label}
            </span>

            {goal.due_date && (
              <span className="goal-due-date">
                <Flag size={12} /> {goal.due_date}
              </span>
            )}

            {goal.metric_type && goal.target_value && (
              <span className="goal-metric">
                {goal.current_value ?? 0} / {goal.target_value} {goal.unit || ""}
              </span>
            )}

            {goal.owner && (
              <div className="goal-owner">
                <SoulAvatar name={goal.owner.name} imageUrl={goal.owner.avatar_url} size="xs" />
                <span>{goal.owner.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div className="goal-children">
          {goal.children.map((child) => (
            <GoalCard
              key={child.id}
              goal={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              collapsed={false}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Goal Modal ───
function AddGoalModal({ onClose, onAdd, parentId, existingGoals }: {
  onClose: () => void;
  onAdd: (goal: Partial<Goal>) => void;
  parentId: string | null;
  existingGoals: Goal[];
}) {
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState(parentId ? "key_result" : "objective");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [color, setColor] = useState("#2563EB");

  const colors = ["#2563EB", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className="goal-modal-overlay" onClick={onClose}>
      <div className="goal-modal" onClick={(e) => e.stopPropagation()}>
        <h2>목표 추가</h2>

        <label>유형</label>
        <select value={goalType} onChange={(e) => setGoalType(e.target.value)}>
          <option value="mission">미션</option>
          <option value="objective">Objective</option>
          <option value="key_result">Key Result</option>
          <option value="project">프로젝트</option>
          <option value="milestone">마일스톤</option>
        </select>

        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="목표 제목을 입력하세요" autoFocus />

        <label>설명 (선택)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상세 설명" rows={3} />

        <label>마감일 (선택)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <label>색상</label>
        <div className="goal-color-picker">
          {colors.map((c) => (
            <button key={c} className={`goal-color-swatch ${color === c ? "active" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>

        <div className="goal-modal-actions">
          <button className="goal-btn-cancel" onClick={onClose}>취소</button>
          <button className="goal-btn-save" disabled={!title.trim()} onClick={() => {
            onAdd({ title, goal_type: goalType, description: description || null, due_date: dueDate || null, color, parent_id: parentId });
            onClose();
          }}>추가</button>
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tree, setTree] = useState<GoalTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const loadGoals = useCallback(async () => {
    try {
      const res = await apiFetch("/api/goals");
      const data = await res.json();
      setGoals(data.goals || []);
      setAvailable(data.available !== false);
      setTree(buildGoalTree(data.goals || []));
    } catch {
      setGoals([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const handleAdd = async (goal: Partial<Goal>) => {
    try {
      await apiFetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });
      await loadGoals();
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Goal>) => {
    try {
      await apiFetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await loadGoals();
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 목표를 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
      await loadGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="goals-loading">
        <Target size={48} strokeWidth={1} />
        <p>목표 로딩 중...</p>
      </div>
    );
  }

  const stats = {
    total: goals.length,
    completed: goals.filter((g) => g.status === "completed").length,
    atRisk: goals.filter((g) => g.status === "at_risk" || g.status === "behind").length,
    avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
  };

  return (
    <div className="goals-page">
      <div className="goals-header">
        <div className="goals-title-row">
          <Target size={24} />
          <h1>목표 정렬</h1>
          <span className="goals-count">{stats.total}개</span>
          <button className="goals-add-btn" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> 목표 추가
          </button>
        </div>

        {!available && (
          <div className="goals-unavailable-notice">
            ⚠️ 테이블 준비 중 — 008 DDL 실행 후 목표 정렬 기능이 활성화됩니다.
          </div>
        )}

        {stats.total > 0 && (
          <div className="goals-summary">
            <div className="goals-stat">
              <span className="goals-stat-value">{stats.avgProgress}%</span>
              <span className="goals-stat-label">평균 진행률</span>
            </div>
            <div className="goals-stat">
              <span className="goals-stat-value" style={{ color: "#10b981" }}>{stats.completed}</span>
              <span className="goals-stat-label">완료</span>
            </div>
            <div className="goals-stat">
              <span className="goals-stat-value" style={{ color: "#ef4444" }}>{stats.atRisk}</span>
              <span className="goals-stat-label">위험</span>
            </div>
          </div>
        )}
      </div>

      <div className="goals-tree">
        {tree.length === 0 ? (
          <div className="goals-empty">
            <Target size={64} strokeWidth={0.8} />
            <h2>목표가 없습니다</h2>
            <p>OKR 목표를 추가하여 팀의 방향을 정렬하세요.</p>
            <button className="goals-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> 첫 번째 목표 추가
            </button>
          </div>
        ) : (
          tree.map((root) => (
            <GoalCard
              key={root.id}
              goal={root}
              depth={0}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              collapsed={collapsedIds.has(root.id)}
              onToggle={toggleCollapse}
            />
          ))
        )}
      </div>

      {showAdd && (
        <AddGoalModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          parentId={null}
          existingGoals={goals}
        />
      )}
    </div>
  );
}
