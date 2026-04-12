# Soul Preset Templates — Data Structure Design

> Next AI Crew "Soul 채용" 시스템의 프리셋 템플릿 설계.
> Kevin 비전: Soul(AI Agent) + Body(Physical AI) 바인딩 Phase 1.

## Current State (6 presets)

```
Alex (풀스택 개발자), Maya (UI/UX 디자이너), Sam (PM),
Kai (마케팅 전략가), Jordan (DevOps), Rina (데이터 분석가)
```

## Proposed Soul Template Interface

```typescript
interface SoulTemplate {
  // === Identity ===
  id: string;                    // unique template id (e.g. "soul-fullstack-dev")
  name: string;                  // display name (English)
  name_ko: string;               // display name (Korean)
  avatar: string;                // avatar icon path or emoji
  
  // === Role & Department ===
  department: DepartmentSlug;    // engineering | design | planning | marketing | operations | security | qa | devops | executive | support
  role: RoleLevel;               // junior | senior | team_leader | director
  role_title: string;            // "Full-Stack Developer"
  role_title_ko: string;         // "풀스택 개발자"
  
  // === Soul Personality ===
  personality: string;           // personality description (EN)
  personality_ko: string;        // personality description (KR)
  work_style: WorkStyle;         // analytical | creative | organized | collaborative | autonomous
  communication_tone: Tone;      // formal | casual | technical | friendly
  
  // === Capabilities ===
  skills: string[];              // ["TypeScript", "React", "Node.js", "PostgreSQL"]
  specialties: string[];         // ["API Design", "Performance Optimization"]
  cli_provider: CliProvider;     // claude | gpt | gemini | codex | opencode | llama
  preferred_model?: string;      // specific model override
  
  // === Token/Cost Tier ===
  tier: CostTier;                // lite | standard | pro | premium
  estimated_tokens_per_task: number;  // average token usage per task
  
  // === Onboarding ===
  default_prompt: string;        // system prompt template
  greeting: string;              // first message to user
  greeting_ko: string;
  
  // === Metadata ===
  tags: string[];                // ["backend", "fullstack", "senior"]
  popularity: number;            // 0-100, for sorting
  is_featured: boolean;          // show on landing page
  created_at: string;
  updated_at: string;
}

type DepartmentSlug = 
  | "engineering" | "design" | "planning" | "marketing" 
  | "operations" | "security" | "qa" | "devops" 
  | "executive" | "support";

type RoleLevel = "junior" | "senior" | "team_leader" | "director";
type WorkStyle = "analytical" | "creative" | "organized" | "collaborative" | "autonomous";
type Tone = "formal" | "casual" | "technical" | "friendly";
type CliProvider = "claude" | "gpt" | "gemini" | "codex" | "opencode" | "llama";
type CostTier = "lite" | "standard" | "pro" | "premium";
```

## Cost Tiers (Token Budget)

| Tier     | Monthly Token Limit | Target Use Case          | Price Point |
|----------|-------------------|--------------------------|-------------|
| lite     | 100K              | Simple tasks, Q&A        | Free tier   |
| standard | 500K              | Regular development      | Basic plan  |
| pro      | 2M                | Complex tasks, code gen  | Pro plan    |
| premium  | Unlimited         | Enterprise, mission-critical | Enterprise |

## Expanded Soul Catalog (20 templates)

### Engineering (6)
1. **Full-Stack Developer** — TypeScript, React, Node.js, DB
2. **Frontend Specialist** — React, CSS, Accessibility, Animation
3. **Backend Engineer** — API, DB, Microservices, Caching
4. **Mobile Developer** — React Native, Flutter, iOS/Android
5. **ML/AI Engineer** — Python, PyTorch, Data Pipeline
6. **DevOps Engineer** — Docker, K8s, CI/CD, Monitoring

### Design (2)
7. **UI/UX Designer** — Figma, Wireframe, User Research
8. **Brand Designer** — Visual Identity, Marketing Assets

### Product (3)
9. **Project Manager** — Agile, Sprint, Stakeholder Mgmt
10. **Product Owner** — Roadmap, Prioritization, Analytics
11. **Business Analyst** — Requirements, Data Analysis

### Marketing (2)
12. **Growth Marketer** — SEO, Analytics, Campaign
13. **Content Strategist** — Copywriting, Social Media, Brand Voice

### Quality & Security (3)
14. **QA Engineer** — Test Automation, E2E, Performance
15. **Security Analyst** — Audit, Vulnerability, Compliance
16. **Code Reviewer** — Best Practices, Architecture Review

### Operations (2)
17. **Data Analyst** — SQL, Dashboard, Business Intelligence
18. **Executive Assistant** — Scheduling, Reporting, Communication

### Leadership (2)
19. **Tech Lead** — Architecture, Code Review, Mentoring
20. **Scrum Master** — Agile Coach, Retrospective, Velocity

## DB Schema Extension (for Sujin CTO sync)

```sql
-- New table: soul_templates (catalog of available souls)
CREATE TABLE soul_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT,
  department TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'senior',
  role_title TEXT NOT NULL,
  role_title_ko TEXT,
  personality TEXT NOT NULL,
  personality_ko TEXT,
  work_style TEXT DEFAULT 'analytical',
  communication_tone TEXT DEFAULT 'technical',
  skills TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  cli_provider TEXT NOT NULL DEFAULT 'claude',
  preferred_model TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK(tier IN ('lite','standard','pro','premium')),
  estimated_tokens_per_task INT DEFAULT 5000,
  default_prompt TEXT,
  greeting TEXT,
  greeting_ko TEXT,
  avatar TEXT,
  tags TEXT[] DEFAULT '{}',
  popularity INT DEFAULT 50,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Extend agents table with soul reference
ALTER TABLE agents ADD COLUMN soul_template_id TEXT REFERENCES soul_templates(id);
ALTER TABLE agents ADD COLUMN tier TEXT DEFAULT 'standard' CHECK(tier IN ('lite','standard','pro','premium'));
ALTER TABLE agents ADD COLUMN token_used BIGINT DEFAULT 0;
ALTER TABLE agents ADD COLUMN token_limit BIGINT DEFAULT 500000;

-- Token usage tracking
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_token_usage_org ON token_usage(org_id, created_at DESC);
CREATE INDEX idx_token_usage_agent ON token_usage(agent_id, created_at DESC);
```

## Migration Path

1. Create `soul_templates` table + seed 20 templates
2. Add `soul_template_id`, `tier`, `token_used`, `token_limit` to agents
3. Create `token_usage` table
4. Frontend: Soul 채용 카탈로그 페이지 (marketplace style)
5. Frontend: 사용량 대시보드 (per-agent, per-org)

## Notes

- 수진 CTO 스키마 확장안과 머지 필요 (특히 agents 테이블 필드)
- Ivy UX 와이어프레임 결과에 따라 프론트 컴포넌트 조정
- Kevin 비전의 Body 바인딩은 Phase 2 — 현재는 Soul 채용 BM에 집중
