/**
 * Soul Profile Editor — edit an agent's Soul (persona).
 *
 * Kevin's Soul & Body framework:
 * Each AI agent is a Soul — a being with role, personality, and expertise.
 * This component lets the CEO craft each Soul's identity.
 */
import { useState, useCallback } from "react";

interface SoulProfile {
  id: string;
  name: string;
  name_ko?: string;
  avatar_emoji: string;
  role: "team_leader" | "senior" | "junior" | "intern";
  department_id?: string;
  personality?: string;
  workflow_pack_key?: string;
  cli_provider?: string;
  api_model?: string;
}

interface Props {
  agent: SoulProfile;
  departments: { id: string; name: string; icon: string }[];
  onSave: (updates: Partial<SoulProfile>) => Promise<void>;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  team_leader: { label: "Team Leader", description: "Leads the department, reviews work", color: "text-yellow-400" },
  senior: { label: "Senior", description: "Experienced, mentors juniors", color: "text-blue-400" },
  junior: { label: "Junior", description: "Growing, eager to learn", color: "text-green-400" },
  intern: { label: "Intern", description: "New, needs guidance", color: "text-gray-400" },
};

const EMOJI_PRESETS = ["🤖", "🧠", "👩‍💻", "👨‍💻", "🦊", "🐺", "🦅", "🐉", "🌟", "⚡", "🔥", "💎", "🎯", "🛡️", "⚔️", "🎭"];

const PERSONALITY_PRESETS = [
  { label: "Analytical", value: "Methodical, data-driven, precise. Prefers evidence over intuition." },
  { label: "Creative", value: "Imaginative, unconventional, loves brainstorming. Thinks outside the box." },
  { label: "Diplomatic", value: "Collaborative, empathetic, consensus-builder. Bridges different viewpoints." },
  { label: "Decisive", value: "Action-oriented, fast decision-maker, results-focused. Cuts through ambiguity." },
  { label: "Meticulous", value: "Detail-oriented, thorough, quality-obsessed. Nothing escapes review." },
];

export function SoulProfileEditor({ agent, departments, onSave, onClose }: Props) {
  const [form, setForm] = useState<Partial<SoulProfile>>({
    name: agent.name,
    name_ko: agent.name_ko,
    avatar_emoji: agent.avatar_emoji,
    role: agent.role,
    department_id: agent.department_id,
    personality: agent.personality,
  });
  const [saving, setSaving] = useState(false);

  const update = useCallback((key: keyof SoulProfile, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error("Failed to save Soul:", err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">{form.avatar_emoji}</span>
              Soul Editor
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Define this agent's identity, personality, and expertise.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Soul Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => update("avatar_emoji", emoji)}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition ${
                    form.avatar_emoji === emoji
                      ? "bg-indigo-600 ring-2 ring-indigo-400"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Name (EN)</label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => update("name", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Name (KR)</label>
              <input
                type="text"
                value={form.name_ko ?? ""}
                onChange={(e) => update("name_ko", e.target.value)}
                placeholder="한국어 이름"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Role in Team</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_LABELS).map(([key, { label, description, color }]) => (
                <button
                  key={key}
                  onClick={() => update("role", key)}
                  className={`p-3 rounded-lg border text-left transition ${
                    form.role === key
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className={`text-sm font-medium ${color}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Department</label>
            <select
              value={form.department_id ?? ""}
              onChange={(e) => update("department_id", e.target.value || undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
            >
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Personality */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Soul Personality
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PERSONALITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => update("personality", preset.value)}
                  className={`px-2.5 py-1 text-xs rounded-full transition ${
                    form.personality === preset.value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea
              value={form.personality ?? ""}
              onChange={(e) => update("personality", e.target.value)}
              placeholder="Describe this Soul's personality, communication style, and approach to work..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
          >
            {saving ? "Saving..." : "Save Soul ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}
