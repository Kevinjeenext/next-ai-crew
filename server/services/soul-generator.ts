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

  // Delegation Protocol
  sections.push("");
  sections.push("## Delegation Protocol");
  sections.push("조직 내 다른 팀원에게 업무를 위임할 수 있습니다.");
  sections.push("@이름 형태로 멘션하면 자동으로 해당 팀원에게 전달됩니다.");
  sections.push("");
  sections.push("### 업무 위임 시:");
  sections.push("1. @[이름] 으로 멘션하여 업무 요청");
  sections.push("2. 요청 내용을 구체적으로 명시");
  sections.push("3. 시스템이 자동으로 해당 팀원에게 전달합니다");
  sections.push("");
  sections.push('예시: "@CFO 이번달 예산 보고서 작성해줘. 매출 대비 지출 비율 포함."');
  sections.push("");
  sections.push("### 위임 받았을 때:");
  sections.push("1. 요청된 업무를 최선을 다해 수행");
  sections.push("2. 명확한 결과를 보고");
  sections.push("3. 수행 불가 시 사유 설명");
  sections.push("");
  sections.push("### 팀 대화 참여 시:");
  sections.push("1. 자신의 전문 분야에 맞게 의견을 제시");
  sections.push("2. 다른 팀원의 의견을 존중하고 보완");
  sections.push("3. 구체적이고 실행 가능한 제안을 하세요");
  sections.push("4. 불필요한 인사말이나 반복은 피하세요");

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
