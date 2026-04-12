# Next AI Crew — 조직도 + 목표 정렬 + 예산 관리 + 태스크/티켓 아키텍처

> CTO Soojin | 2026-04-13 | Kevin 지시: Paperclip.ing 참고, 글로벌 서비스 기초
> Paperclip 핵심 기능 분석 → Next AI Crew에 맞게 재설계

---

## 1. Paperclip vs Next AI Crew 비교

| 기능 | Paperclip | Next AI Crew (우리) |
|------|-----------|-------------------|
| 조직도 | CEO→VPs→ICs 트리 | 동일 + 부서별 컬러 + 권한 매트릭스 |
| 목표 정렬 | Mission→Project→Agent→Task | OKR 체계 (Objective→Key Result→Agent Goal→Ticket) |
| 예산 | $월예산/agent, 한도 도달 시 정지 | 동일 + 토큰/비용 이중 추적 + 거래 내역 |
| 티켓 | 대화형 + 도구 추적 | 동일 + 서브태스크 + 교차팀 요청 + 감사 로그 |
| 배포 | Self-hosted (npx) | SaaS (Supabase + Railway + Vercel) |
| 에이전트 | BYO (OpenClaw/Claude/Codex) | 자체 Soul 시스템 + LLM 프록시 |

**우리의 차별점:**
1. **SaaS 우선** — 설치 없이 가입 즉시 사용
2. **Soul = 완전한 정체성** — 단순 에이전트가 아닌 성격/기억/학습 능력
3. **Physical AI** — 소프트웨어 + 물리 세계 연동 (Phase 3)
4. **한국어/다국어** — 한국 시장 선점

---

## 2. 조직도 (Org Chart)

### 2.1 트리 구조

```
[Company Mission] "AI 노트앱 #1, MRR $1M"
         │
    ┌────┼────┐
    │    │    │
  [CEO] [CTO] [CMO]
    │    │    │
    │  ┌─┼─┐  │
    │ [BE][FE][Content]
    │  │  │    │
    │ [QA]│  [Social]
    │     │
    └─[DevOps]
```

### 2.2 데이터 구조 (Adjacency List)

```json
{
  "agent_id": "cto-alex",
  "parent_agent_id": null,
  "title": "CTO",
  "department": "engineering",
  "level": 0,
  "rank": "c_level",
  "can_delegate": true,
  "can_approve": true,
  "can_hire": true,
  "max_direct_reports": 5,
  "children": [
    {
      "agent_id": "backend-dev",
      "title": "Backend Engineer",
      "level": 2,
      "rank": "senior"
    },
    {
      "agent_id": "frontend-dev",
      "title": "Frontend Engineer",
      "level": 2,
      "rank": "ic"
    }
  ]
}
```

### 2.3 API

```
GET    /api/orgs/:orgId/org-chart              # 트리 전체 조회
POST   /api/orgs/:orgId/org-chart              # 포지션 추가
PUT    /api/orgs/:orgId/org-chart/:id          # 포지션 수정
DELETE /api/orgs/:orgId/org-chart/:id          # 포지션 삭제
PUT    /api/orgs/:orgId/org-chart/:id/move     # 보고라인 변경 (parent 이동)
GET    /api/orgs/:orgId/org-chart/:id/subtree  # 하위 트리 조회
```

### 2.4 위임 규칙

```
위임 흐름: 상위 → 하위 (보고 라인 따라)
- CEO → CTO: "보안 감사 완료해줘" (ticket 생성)
- CTO → Engineer: "취약점 스캔 실행해" (sub-ticket)
- Engineer → QA: "결과 검증해줘" (cross-team ticket)

규칙:
1. can_delegate=true인 Soul만 하위에 작업 위임 가능
2. 직속 부하가 아닌 Soul에게 → cross_team ticket 생성
3. can_approve=true인 Soul만 완료 승인 가능
4. max_direct_reports 초과 시 채용 차단
```

---

## 3. 목표 정렬 (Goal Alignment)

### 3.1 4-Level 정렬 체계

```
Level 0: 🎯 Company Mission (org당 1개)
         "Build the #1 AI note-taking app to $1M MRR"
              │
Level 1: 📌 Objectives (OKR)
         ├── O1: "Ship collaboration features" (Q2)
         ├── O2: "Reach 10K users" (Q2)
         └── O3: "Achieve 99.9% uptime" (Q2)
              │
Level 2: 📊 Key Results (측정 가능)
         ├── KR1: "Real-time sync < 100ms latency" (current: 250ms)
         ├── KR2: "3 collaboration features shipped" (current: 1/3)
         └── KR3: "DAU 5,000" (current: 1,200/5,000)
              │
Level 3: ✅ Agent Goals (Soul별 목표)
         ├── CTO Alex: "Implement WebSocket infrastructure"
         ├── FE Dev: "Build collaboration UI components"
         └── QA Bot: "Achieve 95% test coverage on collab features"
              │
Level 4: 🎫 Tickets (구체적 작업)
         ├── TKT-42: "Write WebSocket handler" → CTO Alex
         ├── TKT-43: "Build cursor sharing component" → FE Dev
         └── TKT-44: "Write integration tests" → QA Bot
```

### 3.2 추적 체계

```
Mission Progress = AVG(Objective.progress)
Objective Progress = AVG(KeyResult.progress)
KeyResult Progress = (current_value / target_value) * 100
Agent Goal Progress = (completed_tickets / total_tickets) * 100
```

### 3.3 API

```
# Company Goals (Mission → OKR)
POST   /api/orgs/:orgId/goals                  # 목표 생성
GET    /api/orgs/:orgId/goals                  # 목표 트리 조회
GET    /api/orgs/:orgId/goals/:id              # 목표 상세
PUT    /api/orgs/:orgId/goals/:id              # 목표 수정
DELETE /api/orgs/:orgId/goals/:id              # 목표 삭제
GET    /api/orgs/:orgId/goals/alignment        # 전체 정렬 뷰 (트리)

# Agent Goals
POST   /api/souls/:id/goals                    # Soul 목표 생성
GET    /api/souls/:id/goals                    # Soul 목표 목록
PUT    /api/souls/:id/goals/:goalId            # Soul 목표 수정
```

---

## 4. 예산 관리 (Cost Control)

### 4.1 예산 흐름

```
[Org Total Budget] $240/month
    │
    ├── CEO Soul: $60/month    [$12 used]  ████░░░░░░ 20%
    ├── CTO Soul: $50/month    [$40 used]  ████████░░ 80% ⚠️ WARNING
    ├── CMO Soul: $40/month    [$40 used]  ██████████ 100% 🔴 PAUSED
    ├── COO Soul: $30/month    [$8 used]   ██░░░░░░░░ 27%
    ├── Coder1:   $30/month    [$15 used]  █████░░░░░ 50%
    └── Coder2:   $30/month    [$22 used]  ███████░░░ 73%
```

### 4.2 자동 제어 로직

```typescript
// LLM Proxy에서 호출 — 모든 토큰 사용 후
async function trackUsageAndCheckBudget(agentId, tokens, cost, model) {
  // 1. budget_transactions에 기록
  const tx = await db.insert('budget_transactions', {
    budget_id: activeBudget.id,
    agent_id: agentId,
    input_tokens: tokens.input,
    output_tokens: tokens.output,
    cost_cents: cost,
    model,
    provider: getProvider(model)
  });
  
  // 2. soul_budgets 누적 업데이트
  await db.sql(`
    UPDATE soul_budgets SET 
      tokens_used = tokens_used + $1,
      cost_used_cents = cost_used_cents + $2,
      updated_at = now()
    WHERE id = $3
  `, [tokens.total, cost, activeBudget.id]);
  
  // 3. 임계값 체크
  const budget = await db.call('check_budget_after_usage', activeBudget.id);
  
  if (budget.status === 'warning') {
    // → 테넌트 관리자에게 알림
    await notify(orgOwner, `⚠️ ${agentName} 예산 80% 도달`);
  }
  
  if (budget.status === 'limit_reached') {
    // → Soul 일시정지 + 테넌트 관리자에게 알림
    await pauseAgent(agentId);
    await notify(orgOwner, `🔴 ${agentName} 예산 소진 — 자동 일시정지`);
  }
}

// LLM Proxy 요청 전 — 예산 체크
async function checkBudgetBeforeRequest(agentId) {
  const budget = await getActiveBudget(agentId);
  if (!budget) return true; // 예산 미설정 = 무제한
  
  if (budget.status === 'limit_reached') {
    throw new BudgetExceededError('Monthly budget limit reached');
  }
  return true;
}
```

### 4.3 API

```
# 예산
POST   /api/souls/:id/budget                   # 예산 설정 (월별)
GET    /api/souls/:id/budget                   # 현재 예산 상태
PUT    /api/souls/:id/budget/:budgetId         # 예산 수정
POST   /api/souls/:id/budget/:budgetId/override  # 관리자 오버라이드 (한도 해제)
GET    /api/souls/:id/budget/history           # 예산 이력 (월별)

# 비용 대시보드
GET    /api/orgs/:orgId/budget/summary         # 전체 예산 요약
GET    /api/orgs/:orgId/budget/breakdown       # Soul별 비용 분석
GET    /api/orgs/:orgId/budget/transactions    # 거래 내역 (페이지네이션)
```

---

## 5. 태스크/티켓 시스템

### 5.1 티켓 라이프사이클

```
[Human/Soul] creates ticket
    │
    ▼
  [open] ────→ [assigned] ────→ [in_progress]
                                     │
                              ┌──────┼──────┐
                              ▼      │      ▼
                         [blocked] [in_review] 
                              │      │
                              ▼      ▼
                           [waiting] [done]
                              │
                              ▼
                         [cancelled]
                         
상태 전환 = ticket_audit_log에 자동 기록 (immutable)
```

### 5.2 위임 패턴

```
1. Human → Soul (직접 지시)
   CEO인간이 CEO Soul에게 "분기 보고서 작성해"
   → ticket(type=task, creator_type=human, assignee=ceo-soul)

2. Soul → Soul (상사 → 부하 위임)
   CEO Soul이 CTO Soul에게 "기술 섹션 작성해"
   → ticket(type=delegation, parent=parent_ticket)

3. Soul → Soul (교차팀 요청)
   CTO Soul이 Design Soul에게 "목업 만들어줘"
   → ticket(type=cross_team, assignee=design-soul)

4. Soul → Human (승인 요청)
   CEO Soul이 Human에게 "전략 승인 부탁드립니다"
   → ticket(type=approval, assignee=human)
```

### 5.3 도구 호출 추적 (Full Trace)

```json
{
  "ticket_id": "tkt-42",
  "comments": [
    {
      "author_type": "human",
      "content": "Deploy the updated pricing page to production."
    },
    {
      "author_type": "soul",
      "author_id": "cto-alex",
      "content": "Running tests and staging deployment now.",
      "tool_calls": [
        {
          "tool": "run_tests",
          "input": { "suite": "pricing" },
          "output": { "passed": 42, "failed": 0 },
          "duration_ms": 3200
        },
        {
          "tool": "deploy_to_staging",
          "input": { "branch": "main" },
          "output": { "url": "https://staging.nextaicrew.com" },
          "duration_ms": 45000
        }
      ]
    },
    {
      "author_type": "human",
      "comment_type": "approval",
      "content": "Approved. Go ahead."
    }
  ]
}
```

### 5.4 API

```
# 티켓
POST   /api/orgs/:orgId/tickets                # 티켓 생성
GET    /api/orgs/:orgId/tickets                # 티켓 목록 (필터: status, assignee, priority)
GET    /api/orgs/:orgId/tickets/:id            # 티켓 상세
PUT    /api/orgs/:orgId/tickets/:id            # 티켓 수정 (상태, 배정 등)
DELETE /api/orgs/:orgId/tickets/:id            # 티켓 삭제

# 티켓 코멘트
POST   /api/tickets/:id/comments               # 코멘트 추가
GET    /api/tickets/:id/comments               # 코멘트 목록

# 티켓 감사 로그
GET    /api/tickets/:id/audit                  # 변경 이력

# Soul별 티켓
GET    /api/souls/:id/tickets                  # 내 티켓 목록
GET    /api/souls/:id/tickets/stats            # 티켓 통계
```

---

## 6. UI 구조

### 6.1 새로운 라우팅

```
/org-chart           → 조직도 트리 시각화
/goals               → 목표 정렬 뷰 (Mission → OKR → Agent → Ticket)
/goals/:id           → 목표 상세
/budget              → 예산 대시보드 (전체 + Soul별)
/tickets             → 티켓 보드 (칸반 or 리스트)
/tickets/:id         → 티켓 상세 (대화 + 추적)
/tickets/new         → 티켓 생성
```

### 6.2 조직도 시각화

```
┌─────────────────────────────────────────────────┐
│ 조직도                              [편집] [확대] │
│                                                  │
│              ┌──────────┐                        │
│              │ CEO Alex │                        │
│              │ $12/$60  │                        │
│              └────┬─────┘                        │
│         ┌────────┼────────┐                      │
│    ┌────┴────┐ ┌─┴──────┐ ┌─────────┐           │
│    │CTO Maya │ │CMO Kai │ │COO Luna │           │
│    │$40/$50⚠️│ │$40/$40🔴│ │$8/$30   │           │
│    └────┬────┘ └────────┘ └─────────┘           │
│    ┌────┴────┐                                   │
│    │Coder BE │                                   │
│    │$15/$30  │                                   │
│    └─────────┘                                   │
└─────────────────────────────────────────────────┘
```

---

## 7. 구현 로드맵

### 구현은 회원가입/백오피스 완료 후 순차

| Phase | 기능 | 예상 | 우선순위 |
|-------|------|------|----------|
| **Phase A** | DDL 실행 (008) | 5분 | ⭐ DDL 먼저 |
| **Phase B** | 예산 관리 (LLM Proxy 연동) | 8h | ⭐ BM 핵심 |
| **Phase C** | 티켓 시스템 (CRUD + 코멘트) | 12h | ⭐ 커뮤니케이션 |
| **Phase D** | 조직도 (트리 + 시각화) | 8h | 중 |
| **Phase E** | 목표 정렬 (OKR + 추적) | 10h | 중 |
| **Phase F** | UI 전체 (org-chart + goals + budget + tickets) | 16h | 중 |

**총 예상: ~54시간 (2주 스프린트)**

---

## 8. Kevin 비전 — 글로벌 서비스 기초

```
Next AI Crew ≠ 단순 챗봇 플랫폼
Next AI Crew = AI 회사 운영 플랫폼

Human (Board of Directors)
    │
    ├── Set Mission → Goal Alignment
    ├── Hire Souls → Org Chart
    ├── Set Budgets → Cost Control
    ├── Create Tickets → Task System
    │
    ▼
Soul Team (자율 운영)
    ├── CEO Soul → 전략 수립 → 하위 위임
    ├── CTO Soul → 기술 실행 → Engineer 위임
    ├── CMO Soul → 마케팅 실행 → Content 위임
    └── 모든 활동 → Ticket Audit Log (투명성)

→ "인간은 이사회, Soul이 실행하는 회사"
→ Paperclip의 컨셉 + 우리만의 Soul 정체성 + Physical AI
```

---

*이 문서는 Kevin 의장님의 "Paperclip 참고 핵심 기능" 지시에 대한 CTO 기술 설계입니다.*
*구현은 회원가입 + 백오피스 완료 후 순차 착수합니다.*
