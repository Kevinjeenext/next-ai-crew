/**
 * OrgChart — 조직도 트리 시각화
 * Pure CSS tree layout (no external dependency)
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, ChevronRight, Plus, GripVertical, Users, Send } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import SoulAvatar from "../ui/SoulAvatar";
import "./org-chart.css";

interface OrgNode {
  id: string;
  agent_id: string;
  parent_agent_id: string | null;
  title: string;
  department: string;
  level: number;
  rank: string;
  agent: {
    id: string;
    name: string;
    role: string;
    avatar_url: string;
    status: string;
    preset_id: string;
  } | null;
}

interface TreeNode extends OrgNode {
  children: TreeNode[];
  collapsed?: boolean;
}

// Build tree from flat positions list
function buildTree(positions: OrgNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create TreeNode for each position
  positions.forEach((p) => {
    map.set(p.agent_id, { ...p, children: [], collapsed: false });
  });

  // Link children to parents
  positions.forEach((p) => {
    const node = map.get(p.agent_id)!;
    if (p.parent_agent_id && map.has(p.parent_agent_id)) {
      map.get(p.parent_agent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort: C-level first, then by level
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

// Department color mapping
const DEPT_COLORS: Record<string, string> = {
  executive: "#6366f1",
  engineering: "#06b6d4",
  design: "#f472b6",
  marketing: "#f59e0b",
  security: "#ef4444",
  finance: "#10b981",
  operations: "#8b5cf6",
  strategy: "#3b82f6",
  product: "#14b8a6",
  hr: "#ec4899",
  legal: "#6b7280",
  general: "#64748b",
};

const RANK_LABELS: Record<string, string> = {
  c_level: "C-Level",
  vp: "VP",
  director: "Director",
  manager: "Manager",
  lead: "Lead",
  senior: "Senior",
  ic: "Team Member",
  intern: "Intern",
};

function OrgNodeCard({ node, onToggle, onDragStart, onDrop, depth, onTrigger }: {
  node: TreeNode;
  onToggle: (id: string) => void;
  onDragStart: (e: React.DragEvent, agentId: string) => void;
  onDrop: (e: React.DragEvent, targetAgentId: string) => void;
  depth: number;
  onTrigger?: (agentId: string, name: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const deptColor = DEPT_COLORS[node.department] || DEPT_COLORS.general;
  const agent = node.agent;
  const name = agent?.name || node.title;
  const role = node.title;
  const status = agent?.status || "idle";

  return (
    <div className="org-tree-branch">
      <div
        className={`org-node-card org-rank-${node.rank}`}
        style={{ "--dept-color": deptColor } as React.CSSProperties}
        draggable
        onDragStart={(e) => onDragStart(e, node.agent_id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, node.agent_id)}
      >
        <div className="org-node-header">
          {hasChildren && (
            <button className="org-node-toggle" onClick={() => onToggle(node.agent_id)}>
              {node.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <div className="org-node-grip">
            <GripVertical size={12} />
          </div>
          <SoulAvatar
            name={name}
            imageUrl={agent?.avatar_url}
            size={node.rank === "c_level" ? "lg" : "md"}
            department={node.department}
          />
          <div className="org-node-info">
            <div className="org-node-name">{name}</div>
            <div className="org-node-role">{role}</div>
          </div>
          <div className="org-node-badges">
            <span className={`org-status-dot org-status-${status}`} />
            <span className="org-rank-badge" style={{ background: deptColor }}>
              {RANK_LABELS[node.rank] || node.rank}
            </span>
          </div>
        </div>
        <div className="org-node-footer">
          {node.department && (
            <div className="org-node-dept" style={{ color: deptColor }}>
              {node.department}
            </div>
          )}
          {hasChildren && (
            <div className="org-node-count">
              <Users size={12} /> {node.children.length}명
            </div>
          )}
          {onTrigger && (
            <button className="org-node-trigger" onClick={(e) => { e.stopPropagation(); onTrigger(node.agent_id, name); }} title="지시하기">
              <Send size={12} /> 지시
            </button>
          )}
        </div>
      </div>

      {hasChildren && !node.collapsed && (
        <div className="org-tree-children">
          {node.children.map((child) => (
            <OrgNodeCard
              key={child.agent_id}
              node={child}
              onToggle={onToggle}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onTrigger={onTrigger}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [positions, setPositions] = useState<OrgNode[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [triggerSoul, setTriggerSoul] = useState<{ id: string; name: string } | null>(null);
  const [triggerTarget, setTriggerTarget] = useState("");
  const [triggerMsg, setTriggerMsg] = useState("");
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadOrgChart = useCallback(async () => {
    try {
      const res = await apiFetch("/api/org-chart");
      const data = await res.json();
      setPositions(data.positions || []);
      setFallback(!!data.fallback);
      setTree(buildTree(data.positions || []));
    } catch {
      setPositions([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrgChart(); }, [loadOrgChart]);

  // Apply collapsed state to tree
  useEffect(() => {
    const applyCollapsed = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({
        ...n,
        collapsed: collapsed.has(n.agent_id),
        children: applyCollapsed(n.children),
      }));
    setTree((prev) => applyCollapsed(prev));
  }, [collapsed]);

  const handleToggle = (agentId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(agentId) ? next.delete(agentId) : next.add(agentId);
      return next;
    });
  };

  const handleDragStart = (_e: React.DragEvent, agentId: string) => {
    setDraggedId(agentId);
  };

  const handleDrop = async (_e: React.DragEvent, targetAgentId: string) => {
    if (!draggedId || draggedId === targetAgentId) return;
    
    // Find the dragged position
    const draggedPos = positions.find((p) => p.agent_id === draggedId);
    if (!draggedPos) return;

    // Update parent via API
    try {
      await apiFetch(`/api/org-chart/${draggedPos.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_agent_id: targetAgentId }),
      });
      await loadOrgChart();
    } catch (err) {
      console.error("Failed to update org chart:", err);
    }
    setDraggedId(null);
  };

  if (loading) {
    return (
      <div className="org-chart-loading">
        <Building2 size={48} strokeWidth={1} />
        <p>조직도 로딩 중...</p>
      </div>
    );
  }

  const totalSouls = positions.length;
  const departments = [...new Set(positions.map((p) => p.department).filter(Boolean))];

  return (
    <div className="org-chart-page">
      <div className="org-chart-header">
        <div className="org-chart-title-row">
          <Building2 size={24} />
          <h1>조직도</h1>
          <span className="org-chart-count">{totalSouls}명</span>
        </div>
        {fallback && (
          <div className="org-chart-fallback-notice">
            ⚠️ DDL 미실행 — 채용된 Soul 기반 자동 생성 조직도입니다. 008 DDL 실행 후 조직 구조를 편집할 수 있습니다.
          </div>
        )}
        <div className="org-chart-dept-chips">
          {departments.map((dept) => (
            <span
              key={dept}
              className="org-dept-chip"
              style={{ background: `${DEPT_COLORS[dept] || DEPT_COLORS.general}22`, color: DEPT_COLORS[dept] || DEPT_COLORS.general }}
            >
              {dept}
            </span>
          ))}
        </div>
      </div>

      <div className="org-chart-tree">
        {tree.length === 0 ? (
          <div className="org-chart-empty">
            <Building2 size={64} strokeWidth={0.8} />
            <h2>조직도가 비어있습니다</h2>
            <p>Soul을 채용하면 자동으로 조직도가 생성됩니다.</p>
          </div>
        ) : (
          tree.map((root) => (
            <OrgNodeCard
              key={root.agent_id}
              node={root}
              onToggle={handleToggle}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onTrigger={(agentId, name) => setTriggerSoul({ id: agentId, name })}
              depth={0}
            />
          ))
        )}
      </div>

      {/* A2A Trigger Modal */}
      {triggerSoul && (
        <div className="org-trigger-overlay" onClick={() => { setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg(""); }}>
          <div className="org-trigger-modal" onClick={(e) => e.stopPropagation()}>
            <h3><Send size={16} /> {triggerSoul.name}에게 지시</h3>
            <label>대화 상대 Soul</label>
            <select value={triggerTarget} onChange={(e) => setTriggerTarget(e.target.value)}>
              <option value="">— 선택 —</option>
              {positions.filter(p => p.agent_id !== triggerSoul.id).map(p => (
                <option key={p.agent_id} value={p.agent_id}>{p.agent?.name || p.title} ({p.department})</option>
              ))}
            </select>
            <label>지시 내용</label>
            <textarea value={triggerMsg} onChange={(e) => setTriggerMsg(e.target.value)} placeholder="이 Soul에게 전달할 메시지..." rows={3} />
            <div className="org-trigger-actions">
              <button className="org-trigger-cancel" onClick={() => { setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg(""); }}>취소</button>
              <button className="org-trigger-confirm" disabled={!triggerTarget || !triggerMsg.trim() || triggering} onClick={async () => {
                setTriggering(true);
                try {
                  const res = await apiFetch("/api/a2a/trigger", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ from_soul_id: triggerSoul.id, to_soul_id: triggerTarget, message: triggerMsg }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setToast("대화 트리거 완료! 💬");
                    setTimeout(() => { setToast(null); navigate("/conversations"); }, 1500);
                    setTriggerSoul(null); setTriggerTarget(""); setTriggerMsg("");
                  } else { setToast("트리거 실패"); setTimeout(() => setToast(null), 3000); }
                } catch { setToast("트리거 오류"); setTimeout(() => setToast(null), 3000); }
                finally { setTriggering(false); }
              }}>
                {triggering ? "처리 중..." : "대화 시작"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="org-toast">{toast}</div>}
    </div>
  );
}
