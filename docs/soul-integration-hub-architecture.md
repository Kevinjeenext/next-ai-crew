# Next AI Crew — Soul Integration Hub 아키텍처

> CTO Soojin | 2026-04-12 | Kevin 지시: Soul × Physical AI + Webhook + API + Playbook + Data Pipeline

---

## 1. 전체 아키텍처

```
                    ┌─────────────────────────────────────────────┐
                    │              Soul Integration Hub            │
                    │                                             │
   [Human]          │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
   [Browser] ──────→│  │ Webhook  │  │   API    │  │ Playbook │ │
                    │  │ Engine   │  │ Gateway  │  │ Engine   │ │
                    │  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
                    │       │             │              │       │
                    │       ▼             ▼              ▼       │
                    │  ┌──────────────────────────────────────┐  │
                    │  │           Event Bus (내부)            │  │
   [Physical AI]    │  │   Supabase Realtime + soul_events    │  │
   [Robot/Kiosk] ──→│  └──────────────────────────────────────┘  │
                    │       │             │              │       │
                    │       ▼             ▼              ▼       │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
   [외부 서비스]     │  │  Data    │  │ Physical │  │  Soul    │ │
   [Slack/Notion] ──→│  │ Pipeline │  │ AI Bridge│  │ Engine   │ │
                    │  └──────────┘  └──────────┘  └──────────┘ │
                    └─────────────────────────────────────────────┘
```

---

## 2. Webhook Engine

### 2.1 Inbound Webhook (외부 → Soul)

```
[외부 서비스]
    │
    ▼
POST /api/hooks/{endpoint_path}
    │
    ├── HMAC 서명 검증 (secret)
    ├── 이벤트 타입 매칭
    ├── 페이로드 변환 (transform)
    │
    ▼
[Event Bus] → soul_events INSERT
    │
    ├── Playbook 트리거 체크
    ├── Data Pipeline 입력
    └── Soul에게 메시지 전달
```

### 2.2 Outbound Webhook (Soul → 외부)

```
[Soul 이벤트 발생]
    │
    ├── message.sent
    ├── task.completed
    ├── playbook.finished
    │
    ▼
[Webhook Dispatcher]
    ├── 대상 URL 조회 (soul_webhooks WHERE direction='outbound')
    ├── 이벤트 필터 매칭
    ├── HMAC 서명 생성
    ├── HTTP POST (timeout 5s)
    ├── 실패 시 retry (3회, 지수 백오프)
    └── 결과 → soul_events 기록
```

### API

```
POST   /api/souls/:id/webhooks          # 웹훅 등록
GET    /api/souls/:id/webhooks          # 웹훅 목록
PUT    /api/souls/:id/webhooks/:whId    # 웹훅 수정
DELETE /api/souls/:id/webhooks/:whId    # 웹훅 삭제
POST   /api/souls/:id/webhooks/:whId/test  # 테스트 발송
POST   /api/hooks/{endpoint_path}       # 인바운드 수신 (public)
```

---

## 3. API Gateway (외부 서비스 연동)

### 3.1 Integration Registry

```
┌────────────────────────────────────────┐
│ Integration Registry                    │
│                                        │
│  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │  Slack   │  │  Notion │  │ Google │ │
│  │  OAuth2  │  │  OAuth2 │  │ Sheets │ │
│  └─────────┘  └─────────┘  └────────┘ │
│  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │Salesforce│  │  Jira   │  │ Custom │ │
│  │  OAuth2  │  │  API    │  │  API   │ │
│  └─────────┘  └─────────┘  └────────┘ │
└────────────────────────────────────────┘
```

### 3.2 Provider 인터페이스

```typescript
interface IntegrationProvider {
  id: string;                    // 'slack', 'notion', ...
  name: string;
  type: 'oauth2' | 'api' | 'webhook';
  
  // OAuth2
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  
  // 액션
  actions: IntegrationAction[];  // 사용 가능한 액션 목록
}

interface IntegrationAction {
  id: string;                    // 'send_message', 'create_page', ...
  name: string;
  inputSchema: JSONSchema;       // 입력 파라미터
  outputSchema: JSONSchema;      // 출력 형태
}

// 사용 예: Soul이 Slack에 메시지 보내기
await integrationService.execute({
  integrationId: 'int_xxx',
  action: 'send_message',
  params: { channel: '#general', text: '보고서 완료!' }
});
```

### API

```
GET    /api/integrations/providers          # 지원 제공자 목록
POST   /api/souls/:id/integrations          # 연동 등록
GET    /api/souls/:id/integrations          # 연동 목록
PUT    /api/souls/:id/integrations/:intId   # 연동 수정
DELETE /api/souls/:id/integrations/:intId   # 연동 해제
POST   /api/souls/:id/integrations/:intId/test  # 연동 테스트
GET    /api/integrations/oauth2/callback    # OAuth2 콜백 (공통)
```

---

## 4. Physical AI Bridge

### 4.1 Soul → Body 통신 (명령)

```
[Soul 결정]
    │
    ▼
[Physical AI Bridge]
    │
    ├── gRPC: 실시간 명령 (로봇 제어, 키오스크 화면 전환)
    │   └── soul.Command { device_id, action, params, timeout }
    │
    ├── MQTT: 비동기 명령 (센서 설정 변경, 배치 제어)
    │   └── Topic: next-ai/{org_id}/{device_id}/command
    │
    └── ROS2: 로봇 전용 (navigation, manipulation)
        └── Topic: /soul/{agent_id}/cmd_vel, /soul/{agent_id}/goal
```

### 4.2 Body → Soul 통신 (센서/텔레메트리)

```
[Physical Device]
    │
    ├── MQTT Publish: next-ai/{org_id}/{device_id}/telemetry
    │   { "temperature": 25.3, "humidity": 60, "battery": 85, "ts": ... }
    │
    ├── gRPC Stream: soul.TelemetryStream
    │   연속 데이터 (카메라 프레임, 오디오, 고빈도 센서)
    │
    └── HTTP POST: /api/devices/{id}/telemetry (단순)
    │
    ▼
[Data Pipeline] → 변환 → 집계 → 이상 탐지
    │
    ▼
[Soul 분석] → 판단 → 명령
```

### 4.3 헬스체크 + 자동 재연결

```typescript
// Physical AI Health Monitor
class DeviceHealthMonitor {
  // 주기적 헬스체크 (기본 30초)
  async checkDevice(device: PhysicalDevice) {
    try {
      const health = await this.ping(device);
      await this.updateStatus(device.id, 'online', health);
    } catch (err) {
      device.failCount++;
      if (device.failCount >= 3) {
        await this.updateStatus(device.id, 'offline');
        await this.notifySoul(device.agent_id, 'device.offline', device);
        
        if (device.auto_reconnect) {
          await this.reconnect(device);  // 지수 백오프
        }
      }
    }
  }
  
  // 재연결 (지수 백오프: 5s → 10s → 20s → ... max 5min)
  async reconnect(device: PhysicalDevice, attempt = 0) {
    if (attempt >= device.max_reconnect_attempts) {
      await this.notifySoul(device.agent_id, 'device.reconnect_failed', device);
      return;
    }
    const delay = Math.min(device.reconnect_interval_ms * (2 ** attempt), 300000);
    await sleep(delay);
    // ... reconnect logic per protocol
  }
}
```

### API

```
POST   /api/souls/:id/devices              # 디바이스 등록
GET    /api/souls/:id/devices              # 디바이스 목록
PUT    /api/souls/:id/devices/:devId       # 디바이스 수정
DELETE /api/souls/:id/devices/:devId       # 디바이스 삭제
POST   /api/souls/:id/devices/:devId/command  # 명령 전송
GET    /api/souls/:id/devices/:devId/telemetry  # 텔레메트리 조회
GET    /api/souls/:id/devices/:devId/health  # 건강 상태
POST   /api/devices/:devId/telemetry       # 디바이스 → 서버 (인증 토큰)
```

---

## 5. Playbook Engine (DAG 워크플로우)

### 5.1 Playbook 구조

```
Playbook: "일일 매장 보고서"
├── Trigger: schedule ("0 9 * * MON-FRI")
│
├── Step 1: [data_fetch] 매출 데이터 조회 (POS API)
│   └── next → Step 2
│
├── Step 2: [data_fetch] 재고 데이터 조회 (WMS API)
│   └── next → Step 3
│
├── Step 3: [llm_call] AI 분석 + 보고서 생성
│   └── next → Step 4
│
├── Step 4: [condition] 이상치 감지?
│   ├── true → Step 5 (알림)
│   └── false → Step 6 (저장)
│
├── Step 5: [notification] 관리자 알림 (Slack + 카카오톡)
│   └── next → Step 6
│
└── Step 6: [webhook_send] 보고서 전송 (이메일/Notion)
    └── END
```

### 5.2 JSON 스키마 (노코드 빌더용)

```json
{
  "name": "일일 매장 보고서",
  "trigger": {
    "type": "schedule",
    "config": { "cron": "0 9 * * MON-FRI", "tz": "Asia/Seoul" }
  },
  "steps": [
    {
      "id": "fetch_sales",
      "type": "api_call",
      "name": "매출 데이터 조회",
      "config": {
        "integration_id": "int_pos_system",
        "action": "get_daily_sales",
        "params": { "date": "{{trigger.date}}" }
      },
      "next": ["fetch_inventory"],
      "timeout_ms": 10000,
      "retry": { "count": 2, "backoff": "exponential" }
    },
    {
      "id": "ai_analysis",
      "type": "llm_call",
      "name": "AI 분석",
      "config": {
        "model": "auto",
        "prompt": "다음 매출/재고 데이터를 분석하여 보고서를 작성하세요:\n매출: {{fetch_sales.output}}\n재고: {{fetch_inventory.output}}",
        "max_tokens": 2000
      },
      "next": ["check_anomaly"]
    },
    {
      "id": "check_anomaly",
      "type": "condition",
      "name": "이상치 확인",
      "config": {
        "expression": "ai_analysis.output.anomaly_score > 0.7"
      },
      "next_true": ["send_alert"],
      "next_false": ["save_report"]
    },
    {
      "id": "send_alert",
      "type": "notification",
      "name": "관리자 알림",
      "config": {
        "channels": ["slack", "kakaotalk"],
        "message": "⚠️ 이상치 감지: {{ai_analysis.output.summary}}"
      },
      "next": ["save_report"]
    },
    {
      "id": "save_report",
      "type": "webhook_send",
      "name": "보고서 저장",
      "config": {
        "webhook_id": "wh_notion_daily",
        "payload": { "title": "{{trigger.date}} 일일 보고서", "content": "{{ai_analysis.output.report}}" }
      }
    }
  ]
}
```

### 5.3 스텝 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `llm_call` | AI 모델 호출 | 분석, 요약, 생성 |
| `api_call` | 외부 API 호출 | 데이터 조회, 서비스 연동 |
| `webhook_send` | 웹훅 전송 | Slack, Notion, 이메일 |
| `condition` | 조건 분기 | if/else |
| `delay` | 대기 | 5분 후 재확인 |
| `human_approval` | 인간 승인 대기 | 중요 결정 전 승인 |
| `physical_command` | 디바이스 명령 | 로봇 이동, 키오스크 화면 |
| `data_transform` | 데이터 변환 | 필터, 집계, 포맷팅 |
| `notification` | 알림 전송 | 카카오톡, SMS, Push |
| `soul_message` | 다른 Soul에게 메시지 | Soul간 협업 |

### 5.4 상태 머신

```
[pending] → [running] → [completed]
              │    ↑
              │    └── (step 재시도)
              ▼
        [waiting_approval] → [running]
              │
              ▼
        [paused] → [running]  (수동 재개)
              │
              ▼
        [cancelled]
              
[running] → [failed] → [running]  (전체 재시도)
```

### API

```
POST   /api/souls/:id/playbooks              # 플레이북 생성
GET    /api/souls/:id/playbooks              # 플레이북 목록
GET    /api/souls/:id/playbooks/:pbId        # 플레이북 상세
PUT    /api/souls/:id/playbooks/:pbId        # 플레이북 수정
DELETE /api/souls/:id/playbooks/:pbId        # 플레이북 삭제
POST   /api/souls/:id/playbooks/:pbId/run    # 수동 실행
GET    /api/souls/:id/playbooks/:pbId/runs   # 실행 이력
GET    /api/playbooks/runs/:runId            # 실행 상세
POST   /api/playbooks/runs/:runId/approve    # 인간 승인
POST   /api/playbooks/runs/:runId/cancel     # 실행 취소
POST   /api/playbooks/runs/:runId/resume     # 일시정지 재개
```

---

## 6. Data Pipeline

### 6.1 실시간 스트리밍

```
[Source]                    [Transform]              [Sink]
  │                            │                       │
  ├── MQTT telemetry ──→ filter ──→ aggregate ──→ Dashboard (WebSocket)
  ├── Webhook event ───→ enrich ──→ anomaly ───→ Soul notification
  └── API poll ────────→ diff ────→ format ────→ Database storage
```

### 6.2 배치 집계

```
[Cron Trigger] → "매 5분마다"
    │
    ├── SELECT FROM soul_events WHERE created_at > last_run
    ├── 집계: AVG, SUM, COUNT, PERCENTILE
    ├── 이상 탐지: Z-score, 임계값
    └── INSERT INTO aggregated_metrics
```

### 6.3 이상 탐지 룰 엔진

```typescript
interface AlertRule {
  name: string;
  condition: string;           // "temperature > 35"
  action: 'notify' | 'playbook' | 'command';
  severity: 'info' | 'warning' | 'critical';
  cooldown_ms: number;         // 중복 알림 방지
  playbook_id?: string;        // action=playbook일 때
  command?: DeviceCommand;     // action=command일 때
}

// 엔진 실행
function evaluateRules(data: TelemetryData, rules: AlertRule[]) {
  for (const rule of rules) {
    if (evaluate(rule.condition, data)) {
      if (isInCooldown(rule)) continue;
      executeAction(rule, data);
    }
  }
}
```

### API

```
POST   /api/souls/:id/pipelines              # 파이프라인 생성
GET    /api/souls/:id/pipelines              # 파이프라인 목록
PUT    /api/souls/:id/pipelines/:plId        # 파이프라인 수정
DELETE /api/souls/:id/pipelines/:plId        # 파이프라인 삭제
GET    /api/souls/:id/pipelines/:plId/metrics # 집계 데이터
POST   /api/souls/:id/pipelines/:plId/test   # 테스트 실행
```

---

## 7. Event Bus (내부 이벤트 라우팅)

### 이벤트 타입 체계

```
message.*          — 메시지 관련
  message.received    Soul이 메시지 수신
  message.sent        Soul이 메시지 전송

task.*             — 작업 관련
  task.created        작업 생성
  task.completed      작업 완료
  task.failed         작업 실패

sensor.*           — 센서 데이터
  sensor.data         텔레메트리 데이터
  sensor.alert        이상치 감지

device.*           — 디바이스 상태
  device.online       온라인
  device.offline      오프라인
  device.error        에러

webhook.*          — 웹훅
  webhook.received    인바운드 수신
  webhook.sent        아웃바운드 전송

playbook.*         — 플레이북
  playbook.triggered  실행 시작
  playbook.completed  실행 완료
  playbook.failed     실행 실패

integration.*      — 외부 연동
  integration.connected   연결 성공
  integration.error       연결 에러
  integration.synced      동기화 완료

pipeline.*         — 데이터 파이프라인
  pipeline.output     출력 데이터
  pipeline.alert      이상 탐지 알림
```

### 라우팅 규칙

```
[Event] → Event Bus
    │
    ├── Subscriptions 매칭
    │   ├── Playbook trigger: event_type 매칭 → playbook 실행
    │   ├── Webhook outbound: events[] 매칭 → webhook 발송
    │   ├── Pipeline input: source config 매칭 → pipeline 처리
    │   └── Soul notification: → Soul에게 메시지
    │
    └── soul_events 테이블 기록 (감사 추적)
```

---

## 8. 구현 로드맵

### Phase 1: Foundation (W2, 즉시)
| # | 태스크 | 예상 | 우선순위 |
|---|--------|------|----------|
| 1 | DDL 실행 (007_soul_integration_hub.sql) | 5분 | ⭐ |
| 2 | Webhook Engine (inbound/outbound) | 8h | ⭐ |
| 3 | Event Bus (soul_events + Supabase Realtime) | 4h | ⭐ |
| 4 | Soul Integration Hub UI (탭: 웹훅/연동/디바이스/플레이북) | 6h | ⭐ |

### Phase 2: Playbook (W3)
| # | 태스크 | 예상 |
|---|--------|------|
| 5 | Playbook Engine (DAG executor + state machine) | 12h |
| 6 | Playbook Builder UI (노코드 드래그앤드롭) | 16h |
| 7 | 플레이북 템플릿 마켓플레이스 | 4h |

### Phase 3: Physical AI (W4+)
| # | 태스크 | 예상 |
|---|--------|------|
| 8 | gRPC 서비스 정의 (.proto) | 4h |
| 9 | MQTT 브로커 연동 (Mosquitto/EMQX) | 8h |
| 10 | Device Health Monitor | 4h |
| 11 | Data Pipeline Engine | 12h |
| 12 | 이상 탐지 룰 엔진 | 8h |

---

## 9. Kevin 비전 — Soul + Body 통합

```
         ┌──────────────┐
         │  Soul (AI)    │
         │  - 성격/역할   │
         │  - 판단/분석   │
         │  - 학습/기억   │
         └──────┬───────┘
                │
    ┌───────────┼───────────┐
    │   Integration Hub     │
    │   (Webhook/API/       │
    │    Playbook/Pipeline) │
    └───────────┼───────────┘
                │
         ┌──────┴───────┐
         │  Body (물리)  │
         │  - 로봇       │
         │  - 키오스크   │
         │  - 센서       │
         │  - 디스플레이  │
         └──────────────┘

Soul이 판단하고, Body가 실행하고,
Integration Hub가 그 사이를 연결하고,
Data Pipeline이 결과를 수집하고,
Playbook이 전체를 자동화한다.

→ 오프라인 인간 협업의 완성
```

---

*이 문서는 Kevin 의장님의 "Soul × Physical AI 연동" 비전에 대한 CTO 기술 설계입니다.*
*Phase 1 (Webhook + Event Bus)은 W2 즉시 구현 가능합니다.*
