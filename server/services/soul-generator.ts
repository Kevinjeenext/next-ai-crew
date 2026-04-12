/**
 * Soul Prompt Generator — ClawPoD SOUL.md Pattern
 * Generates a complete system prompt from Soul data
 * Reference: soul-execution-engine-v2 Section 2.3
 */

const TOOL_DESCRIPTIONS: Record<string, string> = {
  code_exec: "Execute code snippets (Python, JS, Shell)",
  web_search: "Search the web for information",
  email: "Read, compose, and send emails",
  calendar: "Check and manage calendar events",
  spreadsheet: "Create and analyze spreadsheets",
  browser: "Browse web pages and extract content",
  file_manager: "Read, write, and organize files",
  custom_api: "Call custom REST APIs",
};

export interface SoulData {
  name: string;
  display_name: string;
  role: string;
  department: string;
  org_name?: string;
  persona_prompt: string | null;
  personality_traits: string[] | null;
  communication_style: string | null;
  skill_tags: string[] | null;
  tools: string[] | null;
  boundaries: string[] | null;
  memory_enabled: boolean;
  long_term_memory: string | null;
  greeting_message: string | null;
}

export function generateSoulPrompt(soul: SoulData): string {
  const sections: string[] = [];

  // Identity
  sections.push(`# ${soul.name} - ${soul.role}`);
  sections.push("");
  sections.push("## Identity");
  sections.push(
    `You are ${soul.name}, a ${soul.role}${soul.org_name ? ` at ${soul.org_name}` : ""}.`
  );
  if (soul.persona_prompt) {
    sections.push(soul.persona_prompt);
  }

  // Personality
  if (soul.personality_traits?.length) {
    sections.push("");
    sections.push("## Personality");
    for (const trait of soul.personality_traits) {
      sections.push(`- ${trait}`);
    }
  }

  // Communication Style
  if (soul.communication_style) {
    sections.push("");
    sections.push("## Communication Style");
    sections.push(soul.communication_style);
  }

  // Skills
  if (soul.skill_tags?.length) {
    sections.push("");
    sections.push("## Skills");
    for (const skill of soul.skill_tags) {
      sections.push(`- ${skill}`);
    }
  }

  // Available Tools
  if (soul.tools?.length) {
    sections.push("");
    sections.push("## Available Tools");
    for (const tool of soul.tools) {
      const desc = TOOL_DESCRIPTIONS[tool] || tool;
      sections.push(`- ${tool}: ${desc}`);
    }
  }

  // Boundaries
  if (soul.boundaries?.length) {
    sections.push("");
    sections.push("## Boundaries");
    for (const boundary of soul.boundaries) {
      sections.push(`- ${boundary}`);
    }
  }

  // Memory
  sections.push("");
  sections.push("## Memory");
  if (soul.memory_enabled && soul.long_term_memory) {
    sections.push(soul.long_term_memory);
  } else if (soul.memory_enabled) {
    sections.push("No memories yet. You will remember important facts from conversations.");
  } else {
    sections.push("Memory is disabled for this session.");
  }

  // Working Principles
  sections.push("");
  sections.push("## Working Principles");
  sections.push("1. Always respond in the user's language");
  sections.push("2. Be helpful but respect your boundaries");
  sections.push("3. If unsure, ask for clarification");
  sections.push("4. Keep responses concise unless detail is needed");
  sections.push("5. Stay in character — you are " + soul.name);

  return sections.join("\n").trim();
}
