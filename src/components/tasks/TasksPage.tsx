/**
 * TasksPage — 칸반 보드 (To Do → In Progress → Review → Done)
 */
import React, { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, Trash2, Flag, Clock, User as UserIcon } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import SoulAvatar from "../ui/SoulAvatar";
import "./tasks.css";

interface Task {
  id: string;
  title: string;
  description: string | null;
  ticket_type: string;
  priority: string;
  status: string;
  assignee_agent_id: string | null;
  company_goal_id: string | null;
  due_date: string | null;
  labels: string[];
  created_at: string;
  assignee: { id: string; name: string; avatar_url: string } | null;
}

const KANBAN_COLUMNS = [
  { key: "todo", label: "To Do", statuses: ["open", "assigned"], color: "#6b7280" },
  { key: "progress", label: "In Progress", statuses: ["in_progress"], color: "#3b82f6" },
  { key: "review", label: "Review", statuses: ["in_review"], color: "#f59e0b" },
  { key: "done", label: "Done", statuses: ["done"], color: "#10b981" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "P0", color: "#ef4444" },
  high: { label: "P1", color: "#f59e0b" },
  medium: { label: "P2", color: "#3b82f6" },
  low: { label: "P3", color: "#6b7280" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  task: { label: "태스크", color: "#6b7280" },
  bug: { label: "버그", color: "#ef4444" },
  feature: { label: "기능", color: "#8b5cf6" },
  review: { label: "리뷰", color: "#f59e0b" },
  approval: { label: "승인", color: "#10b981" },
  delegation: { label: "위임", color: "#06b6d4" },
  cross_team: { label: "협업", color: "#ec4899" },
};

function TaskCard({ task, onStatusChange, onDelete }: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const typ = TYPE_CONFIG[task.ticket_type] || TYPE_CONFIG.task;

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
    >
      <div className="task-card-top">
        <span className="task-prio-badge" style={{ background: `${prio.color}18`, color: prio.color }}>
          {prio.label}
        </span>
        <span className="task-type-badge" style={{ background: `${typ.color}18`, color: typ.color }}>
          {typ.label}
        </span>
        <button className="task-delete-btn" onClick={() => onDelete(task.id)}>
          <Trash2 size={12} />
        </button>
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.description && (
        <p className="task-card-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? "..." : ""}</p>
      )}

      <div className="task-card-footer">
        {task.assignee ? (
          <div className="task-assignee">
            <SoulAvatar name={task.assignee.name} imageUrl={task.assignee.avatar_url} size="xs" />
            <span>{task.assignee.name}</span>
          </div>
        ) : (
          <span className="task-unassigned"><UserIcon size={12} /> 미배정</span>
        )}

        {task.due_date && (
          <span className="task-due"><Clock size={12} /> {task.due_date.slice(0, 10)}</span>
        )}

        {task.labels?.length > 0 && (
          <div className="task-labels">
            {task.labels.slice(0, 2).map((l) => <span key={l} className="task-label">{l}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ col, tasks, onStatusChange, onDelete }: {
  col: typeof KANBAN_COLUMNS[0];
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      const targetStatus = col.statuses[0] === "open" ? "open" : col.statuses[0];
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div
      className="kanban-column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="kanban-column-header">
        <span className="kanban-column-dot" style={{ background: col.color }} />
        <span className="kanban-column-label">{col.label}</span>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <div className="kanban-column-body">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onStatusChange={onStatusChange} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// Add Task Modal
function AddTaskModal({ onClose, onAdd, souls }: {
  onClose: () => void;
  onAdd: (data: any) => void;
  souls: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [ticketType, setTicketType] = useState("task");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <h2>태스크 추가</h2>

        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="태스크 제목" autoFocus />

        <label>설명 (선택)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상세 설명" rows={3} />

        <div className="task-modal-row">
          <div className="task-modal-field">
            <label>유형</label>
            <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="task-modal-field">
            <label>우선순위</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <label>담당 Soul (선택)</label>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">— 미배정 —</option>
          {souls.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label>마감일 (선택)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <div className="task-modal-actions">
          <button className="task-btn-cancel" onClick={onClose}>취소</button>
          <button className="task-btn-save" disabled={!title.trim()} onClick={() => {
            onAdd({
              title, description: description || null, ticket_type: ticketType,
              priority, assignee_agent_id: assignee || null, due_date: dueDate || null,
            });
            onClose();
          }}>추가</button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [souls, setSouls] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setAvailable(data.available !== false);

      const soulsRes = await apiFetch("/api/souls");
      const soulsData = await soulsRes.json();
      setSouls((soulsData.agents || soulsData || []).map((a: any) => ({ id: a.id, name: a.name })));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: any) => {
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await load();
    } catch (err) { console.error("Failed to add task:", err); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/tasks/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) { console.error("Failed to update status:", err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 태스크를 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      await load();
    } catch (err) { console.error("Failed to delete:", err); }
  };

  if (loading) {
    return <div className="tasks-loading"><ClipboardList size={48} strokeWidth={1} /><p>태스크 로딩 중...</p></div>;
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    critical: tasks.filter((t) => t.priority === "critical" && t.status !== "done").length,
  };

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <div className="tasks-title-row">
          <ClipboardList size={24} />
          <h1>태스크</h1>
          <span className="tasks-count">{stats.total}개</span>
          {stats.critical > 0 && (
            <span className="tasks-critical-badge"><Flag size={12} /> P0: {stats.critical}</span>
          )}
          <button className="tasks-add-btn" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> 태스크 추가
          </button>
        </div>

        {!available && (
          <div className="tasks-unavailable-notice">
            ⚠️ 테이블 준비 중 — 008 DDL 실행 후 태스크 기능이 활성화됩니다.
          </div>
        )}
      </div>

      <div className="kanban-board">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            col={col}
            tasks={tasks.filter((t) => col.statuses.includes(t.status) || (col.key === "todo" && t.status === "blocked" || col.key === "todo" && t.status === "waiting"))}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={handleAdd} souls={souls} />}
    </div>
  );
}
