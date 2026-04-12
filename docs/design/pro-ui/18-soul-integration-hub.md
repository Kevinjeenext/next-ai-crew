# Soul 연동 허브 UI 설계서

> 2026-04-12 | Designer: Ivy | Kevin 지시
> Soul 상세 페이지에 4개 탭 추가: 연동 / 플레이북 / 데이터 파이프라인 / Physical AI

---

## 전체 탭 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  [아바타] Alex Chen  ·  Full-Stack Developer  ·  ● Online        │
├─────────────────────────────────────────────────────────────────┤
│  [개요]  [채팅]  [🔗 연동]  [📋 플레이북]  [📊 데이터]  [🤖 Physical AI]  │
├─────────────────────────────────────────────────────────────────┤
│                   (선택된 탭 콘텐츠)                              │
└─────────────────────────────────────────────────────────────────┘
```

**탭 CSS:**
```css
.soul-tab-nav {
  display: flex; gap: 0; border-bottom: 1px solid var(--border-subtle);
  padding: 0 28px; overflow-x: auto; scrollbar-width: none;
}
.soul-tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 16px; border: none; background: transparent;
  color: var(--text-tertiary); font: 500 14px var(--font-ui);
  border-bottom: 2px solid transparent; cursor: pointer;
  white-space: nowrap; transition: all 0.15s;
}
.soul-tab-btn:hover { color: var(--text-secondary); }
.soul-tab-btn.active {
  color: var(--brand-cyan);
  border-bottom-color: var(--brand-cyan);
}
```

---

## 탭 1 — 🔗 연동 (Integrations)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  연동 허브                              [+ 웹훅 추가]           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 웹훅 ──────────────────────────────────────────────      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔔 주문 알림        https://pos.mystore.com/hook  ✅    │  │
│  │    POST · 활성화                      [편집] [삭제]    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 🔔 재고 부족 알림   https://wms.mystore.com/hook  ⚠️   │  │
│  │    POST · 비활성                      [편집] [삭제]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ── API 연동 ───────────────────────────────────────────     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ [카카오 로고]  │ │  [POS 로고]  │ │ [배민 로고]   │         │
│  │  카카오톡     │ │  POS 시스템  │ │  배달의민족   │         │
│  │  ● 연결됨    │ │  ● 연결됨    │ │  ○ 미연결    │         │
│  │  [설정]      │ │  [설정]      │ │  [연결하기]   │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ┌──────────────┐ ┌──────────────┐                           │
│  │ [쿠팡이츠]    │ │  [+ 더보기]  │                           │
│  │  ○ 미연결    │ │              │                           │
│  │  [연결하기]   │ │              │                           │
│  └──────────────┘ └──────────────┘                           │
│                                                              │
│  ── Physical AI 연결 ────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  🖥️ 키오스크 #1     ● 온라인    마지막: 방금 전        │    │
│  │  📺 사이니지 #2     ● 온라인    마지막: 2분 전         │    │
│  │  📱 태블릿 #3       ○ 오프라인  마지막: 1시간 전        │    │
│  └──────────────────────────────────────────────────────┘    │
│                             [+ 디바이스 추가] [연결 테스트]    │
└──────────────────────────────────────────────────────────────┘
```

### 웹훅 카드 CSS

```css
.webhook-list { display: flex; flex-direction: column; gap: 8px; }
.webhook-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  transition: border-color 0.15s;
}
.webhook-item:hover { border-color: rgba(59,130,246,0.3); }
.webhook-url {
  font: 400 12px var(--font-mono); color: var(--text-tertiary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 280px;
}
.webhook-status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.webhook-status-dot.active { background: #22C55E; box-shadow: 0 0 6px #22C55E80; }
.webhook-status-dot.inactive { background: var(--text-tertiary); }
.webhook-actions { margin-left: auto; display: flex; gap: 6px; }
.btn-icon-sm {
  width: 30px; height: 30px; border-radius: 6px;
  background: transparent; border: 1px solid var(--border-subtle);
  color: var(--text-tertiary); cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.btn-icon-sm:hover { background: var(--bg-overlay); color: var(--text-primary); }
.btn-icon-sm.danger:hover { border-color: #EF4444; color: #EF4444; }
```

### API 연동 카드 CSS

```css
.integration-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.integration-card {
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 12px;
  padding: 16px; text-align: center; cursor: pointer;
  transition: all 0.15s;
}
.integration-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-1px); }
.integration-card.connected { border-color: rgba(34,197,94,0.3); }
.integration-logo {
  width: 40px; height: 40px; border-radius: 8px;
  margin: 0 auto 8px; object-fit: contain;
  background: var(--bg-elevated); padding: 6px;
}
.integration-name {
  font: 600 13px var(--font-ui); color: var(--text-primary);
  margin-bottom: 6px;
}
.integration-status {
  font: 400 11px var(--font-ui);
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.integration-status.connected { color: #22C55E; }
.integration-status.disconnected { color: var(--text-tertiary); }
.btn-connect {
  margin-top: 10px; width: 100%; padding: 6px;
  border-radius: 6px; font: 500 12px var(--font-ui);
  cursor: pointer; transition: all 0.15s;
}
.btn-connect.connect {
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);
  color: var(--brand-blue);
}
.btn-connect.connect:hover { background: rgba(59,130,246,0.2); }
.btn-connect.settings {
  background: transparent; border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
}
```

### Physical AI 연결 목록 CSS

```css
.physical-device-list { display: flex; flex-direction: column; gap: 8px; }
.physical-device-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.device-icon { font-size: 18px; }
.device-name { font: 500 14px var(--font-ui); color: var(--text-primary); flex: 1; }
.device-last-seen { font: 400 12px var(--font-ui); color: var(--text-tertiary); }
.device-status {
  display: flex; align-items: center; gap: 5px;
  font: 500 12px var(--font-ui);
}
.device-status.online { color: #22C55E; }
.device-status.offline { color: var(--text-tertiary); }
.device-status-dot {
  width: 7px; height: 7px; border-radius: 50%;
}
.device-status.online .device-status-dot {
  background: #22C55E;
  box-shadow: 0 0 6px #22C55E80;
  animation: pulse-green 2s infinite;
}
.device-status.offline .device-status-dot { background: var(--text-tertiary); }

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 4px #22C55E60; }
  50%       { box-shadow: 0 0 10px #22C55EA0; }
}
```

### 데이터 구조

```typescript
interface WebhookItem {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET' | 'PUT';
  active: boolean;
  last_triggered?: string; // ISO timestamp
  fail_count: number;
}

interface ApiIntegration {
  id: string;               // 'kakao' | 'pos' | 'baemin' | 'coupang' | ...
  name: string;             // '카카오톡'
  logo_url: string;
  connected: boolean;
  config?: Record<string, string>;
}

interface PhysicalDevice {
  id: string;
  name: string;             // '키오스크 #1'
  type: 'kiosk' | 'signage' | 'tablet' | 'robot' | 'custom';
  status: 'online' | 'offline' | 'connecting';
  last_seen: string;        // '방금 전' | '2분 전' | ...
  soul_id: string;          // 연결된 Soul
}
```

---

## 탭 2 — 📋 플레이북 (Playbooks)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  플레이북                         [+ 새 플레이북]              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 플레이북 목록 ──────────────────────────────────────      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  📋 주문 접수 자동화            [●──] 활성             │  │
│  │  트리거: 카카오 주문 → 알림 + POS 전송 + 영수증 출력    │  │
│  │  마지막 실행: 3분 전  /  오늘 47회                     │  │
│  │                                            [수정] [▶]  │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  📋 재고 부족 경고              [○──] 비활성            │  │
│  │  트리거: 재고 < 10개 → 알림 + 자동 발주                 │  │
│  │  마지막 실행: 어제                                      │  │
│  │                                            [수정] [▶]  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ── 플로우 빌더 ─────────────────────────────────────────    │
│                                                              │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │ TRIGGER │ ──▶ │  COND   │ ──▶ │ ACTION  │               │
│  │         │     │         │     │         │               │
│  │카카오 주문│     │금액 > 5만│     │POS 전송 │               │
│  └─────────┘     └────┬────┘     └─────────┘               │
│                       │ else                                 │
│                       ▼                                      │
│                  ┌─────────┐                                 │
│                  │ ACTION  │                                 │
│                  │ 알림 전송│                                 │
│                  └─────────┘                                 │
│                                                              │
│  ── 실행 로그 ───────────────────────────────────────────    │
│  ● 22:15:03  주문 접수 자동화  →  성공  (POS 전송 완료)       │
│  ● 22:12:47  주문 접수 자동화  →  성공                        │
│  ⚠ 22:10:01  재고 경고       →  실패  (API 타임아웃)          │
└──────────────────────────────────────────────────────────────┘
```

### 플레이북 카드 CSS

```css
.playbook-list { display: flex; flex-direction: column; gap: 8px; }
.playbook-item {
  padding: 16px 18px;
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 12px;
  transition: border-color 0.15s;
}
.playbook-item:hover { border-color: rgba(59,130,246,0.25); }
.playbook-item.active { border-color: rgba(34,197,94,0.2); }

.playbook-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.playbook-name { font: 600 15px var(--font-ui); color: var(--text-primary); flex: 1; }

/* Toggle Switch */
.toggle-switch {
  position: relative; width: 36px; height: 20px; cursor: pointer;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; inset: 0; border-radius: 20px;
  background: var(--border-subtle); transition: 0.2s;
}
.toggle-slider::before {
  content: ""; position: absolute; width: 14px; height: 14px;
  left: 3px; top: 3px; border-radius: 50%;
  background: white; transition: 0.2s;
}
.toggle-switch input:checked + .toggle-slider { background: var(--brand-blue); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(16px); }

.playbook-description {
  font: 400 13px var(--font-body); color: var(--text-secondary);
  margin-bottom: 8px;
}
.playbook-meta {
  display: flex; gap: 12px;
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
}
.playbook-actions { display: flex; gap: 6px; margin-left: auto; }
```

### 플로우 빌더 노드 CSS

```css
.flow-canvas {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle); border-radius: 12px;
  padding: 28px; min-height: 200px;
  position: relative; overflow: auto;
}
.flow-node {
  display: inline-flex; flex-direction: column; align-items: center;
  min-width: 100px; padding: 12px 16px;
  border-radius: 10px; cursor: pointer;
  user-select: none; transition: all 0.15s;
}
.flow-node.trigger {
  background: rgba(0,212,255,0.08);
  border: 1.5px solid rgba(0,212,255,0.4);
  color: var(--brand-cyan);
}
.flow-node.condition {
  background: rgba(250,204,21,0.08);
  border: 1.5px solid rgba(250,204,21,0.3);
  color: #FBBF24;
}
.flow-node.action {
  background: rgba(59,130,246,0.08);
  border: 1.5px solid rgba(59,130,246,0.3);
  color: var(--brand-blue);
}
.flow-node-label { font: 400 10px var(--font-ui); text-transform: uppercase; opacity: 0.7; }
.flow-node-value { font: 600 13px var(--font-ui); margin-top: 2px; }
.flow-arrow {
  font: 500 18px; color: var(--text-tertiary);
  align-self: center; margin: 0 8px;
}

/* 실행 로그 */
.run-log { display: flex; flex-direction: column; gap: 6px; }
.run-log-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--bg-elevated);
  font: 400 12px var(--font-mono);
}
.run-log-item.success { border-left: 3px solid #22C55E; }
.run-log-item.fail    { border-left: 3px solid #EF4444; }
.run-log-time { color: var(--text-tertiary); flex-shrink: 0; }
.run-log-name { color: var(--text-primary); flex: 1; }
.run-log-status.success { color: #22C55E; }
.run-log-status.fail    { color: #EF4444; }
```

### 데이터 구조

```typescript
type NodeType = 'trigger' | 'condition' | 'action';

interface FlowNode {
  id: string;
  type: NodeType;
  label: string;    // '카카오 주문' | '금액 > 5만' | 'POS 전송'
  config: Record<string, unknown>;
  next_true?: string;   // node id
  next_false?: string;  // condition 분기
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  active: boolean;
  nodes: FlowNode[];
  run_count_today: number;
  last_run_at?: string;
}

interface RunLog {
  id: string;
  playbook_id: string;
  playbook_name: string;
  status: 'success' | 'fail';
  error?: string;
  ran_at: string;
}
```

---

## 탭 3 — 📊 데이터 파이프라인 (Data Pipeline)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  데이터 파이프라인                    [+ 소스 추가]            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 연결된 소스 ──────────────────────────────────────────   │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ 📊 Google Sheets     │  │ 🏪 POS 매출 데이터   │           │
│  │ 연결됨 · 실시간 동기  │  │ 연결됨 · 5분 주기    │           │
│  │ 마지막: 방금 전       │  │ 마지막: 3분 전        │           │
│  │ 레코드: 1,204건       │  │ 레코드: 28,341건      │           │
│  │ [설정] [새로고침]     │  │ [설정] [새로고침]     │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
│  ── 실시간 스트리밍 ────────────────────────────────────     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ● 라이브   처리율: 342 req/s                          │   │
│  │  ████████████████████░░░░  68% 용량                   │   │
│  │                                                      │   │
│  │  22:20:01  주문 #4521  ₩32,000  → 처리완료            │   │
│  │  22:20:00  재고 업데이트  상품 #1031  10개 → 8개       │   │
│  │  22:19:59  주문 #4520  ₩18,500  → 처리완료            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── 대시보드 위젯 ──────────────────────────────────────     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 오늘 매출     │  │ 주문 수       │  │ 재고 부족     │       │
│  │ ₩1,240,000   │  │ 47건          │  │ 3종           │       │
│  │ ↑ +12.4%     │  │ ↑ +8건        │  │ ↓ -2종        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### 데이터 소스 카드 CSS

```css
.data-source-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.data-source-card {
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 12px;
  padding: 16px;
}
.data-source-card.connected { border-color: rgba(34,197,94,0.25); }
.data-source-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.data-source-icon { font-size: 20px; }
.data-source-name { font: 600 14px var(--font-ui); color: var(--text-primary); }
.data-source-stat {
  display: flex; justify-content: space-between;
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  padding: 4px 0; border-bottom: 1px solid var(--border-subtle);
}
.data-source-stat:last-child { border: none; }

/* 실시간 스트리밍 */
.stream-monitor {
  background: var(--bg-base); border: 1px solid var(--border-subtle);
  border-radius: 10px; padding: 16px;
  font-family: var(--font-mono);
}
.stream-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.stream-live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #EF4444;
  box-shadow: 0 0 8px #EF444480;
  animation: pulse-red 1.5s infinite;
}
@keyframes pulse-red {
  0%,100% { box-shadow: 0 0 4px #EF444460; }
  50%     { box-shadow: 0 0 12px #EF4444A0; }
}
.stream-log-line {
  font: 400 12px var(--font-mono); color: var(--text-secondary);
  padding: 3px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

/* KPI 위젯 */
.pipeline-kpi-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.pipeline-kpi-card {
  background: var(--glass-bg); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 10px;
  padding: 14px 16px;
}
.kpi-label { font: 400 12px var(--font-ui); color: var(--text-tertiary); }
.kpi-value { font: 700 20px var(--font-ui); color: var(--text-primary); margin: 4px 0; }
.kpi-trend {
  font: 500 12px var(--font-ui);
  display: flex; align-items: center; gap: 3px;
}
.kpi-trend.up   { color: #22C55E; }
.kpi-trend.down { color: #EF4444; }
```

### 데이터 구조

```typescript
interface DataSource {
  id: string;
  name: string;
  type: 'sheets' | 'pos' | 'database' | 'api' | 'webhook';
  sync_mode: 'realtime' | 'interval' | 'manual';
  sync_interval_sec?: number;
  connected: boolean;
  record_count: number;
  last_sync_at: string;
}

interface StreamEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'order' | 'inventory' | 'system';
}

interface PipelineKPI {
  label: string;
  value: string;
  change: string;   // '+12.4%' | '-2종'
  trend: 'up' | 'down' | 'neutral';
}
```

---

## 탭 4 — 🤖 Physical AI (디바이스 허브)

### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  Physical AI                        [+ 디바이스 등록]          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── 디바이스 목록 ────────────────────────────────────────   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🖥️  키오스크 #1  (KIOSK-001)      ● 온라인             │  │
│  │     마지막 통신: 방금 전  ·  오늘 명령 142건            │  │
│  │     [명령 전송] [로그 보기] [재시작] [설정]             │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 📺  사이니지 #2  (SIGN-001)       ● 온라인             │  │
│  │     마지막 통신: 1분 전  ·  오늘 명령 28건              │  │
│  │     [명령 전송] [로그 보기] [재시작] [설정]             │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 📱  태블릿 #3   (TAB-003)         ○ 오프라인           │  │
│  │     마지막 통신: 1시간 전  ·  오늘 명령 0건            │  │
│  │     [로그 보기] [설정]                                  │  │
│  └────────────────────────────────────────────────────────┘  │
││                                                              │
│  ── 명령 전송 콘솔 ────────────────────────────────────     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  대상: [키오스크 #1 ▼]                                │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  명령 유형: [화면 전환 ▼]                        │  │   │
│  │  │  파라미터: scene=menu                            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  [▶ 명령 전송]     [⟳ 테스트 연결]                   │   │
│  │                                                      │   │
│  │  응답: ✅ 200 OK · 43ms                              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 디바이스 카드 CSS

```css
.device-list { display: flex; flex-direction: column; gap: 10px; }
.device-card {
  background: var(--glass-bg); backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border); border-radius: 14px;
  padding: 16px 20px;
  transition: border-color 0.15s;
}
.device-card.online  { border-color: rgba(34,197,94,0.2); }
.device-card.offline { border-color: rgba(255,255,255,0.04); opacity: 0.75; }

.device-card-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
.device-type-icon { font-size: 22px; }
.device-info { flex: 1; }
.device-title  { font: 600 15px var(--font-ui); color: var(--text-primary); }
.device-serial { font: 400 12px var(--font-mono); color: var(--text-tertiary); }

.device-status-badge {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 20px;
  font: 500 12px var(--font-ui);
}
.device-status-badge.online  { background: rgba(34,197,94,0.1); color: #22C55E; }
.device-status-badge.offline { background: rgba(255,255,255,0.05); color: var(--text-tertiary); }
.device-status-badge .dot {
  width: 6px; height: 6px; border-radius: 50%;
}
.device-status-badge.online .dot {
  background: #22C55E;
  animation: pulse-green 2s infinite;
}
.device-status-badge.offline .dot { background: var(--text-tertiary); }

.device-meta {
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  margin-bottom: 12px;
}
.device-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-device-action {
  padding: 6px 12px; border-radius: 7px;
  font: 500 12px var(--font-ui); cursor: pointer; transition: all 0.15s;
}
.btn-device-action.primary {
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);
  color: var(--brand-blue);
}
.btn-device-action.primary:hover { background: rgba(59,130,246,0.2); }
.btn-device-action.ghost {
  background: transparent; border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
}
.btn-device-action.ghost:hover { color: var(--text-primary); }
.btn-device-action.danger:hover { border-color: #EF4444; color: #EF4444; }
.btn-device-action:disabled { opacity: 0.4; cursor: not-allowed; }
```

### 명령 전송 콘솔 CSS

```css
.command-console {
  background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 12px; padding: 20px; margin-top: 16px;
}
.console-target-select {
  display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
}
.console-select {
  flex: 1; padding: 8px 12px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 8px; color: var(--text-primary);
  font: 400 14px var(--font-ui);
}
.command-input-group {
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;
}
.command-param-input {
  width: 100%; background: transparent; border: none; outline: none;
  color: var(--text-primary); font: 400 13px var(--font-mono);
  margin-top: 8px; padding: 4px 0;
}
.console-actions { display: flex; gap: 8px; align-items: center; }
.console-response {
  margin-top: 12px; padding: 8px 12px;
  background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.15);
  border-radius: 8px; font: 400 12px var(--font-mono); color: #22C55E;
}
.console-response.error {
  background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.15);
  color: #EF4444;
}
```

### 데이터 구조

```typescript
type DeviceType = 'kiosk' | 'signage' | 'tablet' | 'robot' | 'custom';
type DeviceStatus = 'online' | 'offline' | 'connecting';

interface PhysicalDevice {
  id: string;
  serial: string;           // 'KIOSK-001'
  name: string;             // '키오스크 #1'
  type: DeviceType;
  status: DeviceStatus;
  last_seen: string;        // '방금 전'
  command_count_today: number;
  soul_id: string;
}

type CommandType =
  | 'screen_change'     // 화면 전환
  | 'display_message'   // 메시지 표시
  | 'play_media'        // 미디어 재생
  | 'system_restart'    // 재시작
  | 'custom';           // 커스텀 명령

interface DeviceCommand {
  type: CommandType;
  params: Record<string, string | number | boolean>;
}

interface CommandResponse {
  status: number;
  message: string;
  latency_ms: number;
}
```

---

## 통합 탭 React 구조

```tsx
// SoulDetailPage.tsx
type TabId = 'overview' | 'chat' | 'integrations' | 'playbooks' | 'pipeline' | 'physical';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview',     label: '개요',          icon: User },
  { id: 'chat',         label: '채팅',          icon: MessageSquare },
  { id: 'integrations', label: '연동',          icon: Link },
  { id: 'playbooks',    label: '플레이북',      icon: BookOpen },
  { id: 'pipeline',     label: '데이터',        icon: Database },
  { id: 'physical',     label: 'Physical AI',  icon: Cpu },
];

export function SoulDetailPage({ soulId }: { soulId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="soul-detail-page">
      {/* Soul 헤더 */}
      <SoulDetailHeader soul={soul} />

      {/* 탭 네비게이션 */}
      <nav className="soul-tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`soul-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 탭 콘텐츠 */}
      <div className="soul-tab-content">
        {activeTab === 'overview'     && <SoulOverviewTab soul={soul} />}
        {activeTab === 'chat'         && <SoulChatTab soul={soul} />}
        {activeTab === 'integrations' && <IntegrationsTab soulId={soulId} />}
        {activeTab === 'playbooks'    && <PlaybooksTab soulId={soulId} />}
        {activeTab === 'pipeline'     && <DataPipelineTab soulId={soulId} />}
        {activeTab === 'physical'     && <PhysicalAITab soulId={soulId} />}
      </div>
    </div>
  );
}
```

---

## Lucide 아이콘 매핑

| 용도 | 아이콘 |
|------|--------|
| 연동 탭 | `Link` |
| 플레이북 탭 | `BookOpen` |
| 데이터 파이프라인 탭 | `Database` |
| Physical AI 탭 | `Cpu` |
| 웹훅 | `Webhook` |
| 연결됨 | `CheckCircle2` |
| 미연결 | `CircleDashed` |
| 디바이스 온라인 | `Wifi` |
| 디바이스 오프라인 | `WifiOff` |
| 명령 전송 | `Send` |
| 연결 테스트 | `PlugZap` |
| 재시작 | `RotateCw` |
| 로그 | `ScrollText` |
| 트리거 노드 | `Zap` |
| 조건 노드 | `GitBranch` |
| 액션 노드 | `PlayCircle` |

---

## 구현 우선순위

| 순서 | 항목 | 중요도 |
|------|------|--------|
| P0 | 탭 네비게이션 구조 | UI 뼈대 |
| P0 | 연동 탭 — 웹훅 목록 + API 카드 | Kevin 핵심 요청 |
| P0 | Physical AI 탭 — 디바이스 목록 + 상태 | Kevin 핵심 요청 |
| P1 | 플레이북 탭 — 목록 + 토글 + 로그 | |
| P1 | 데이터 파이프라인 — KPI 위젯 + 소스 목록 | |
| P2 | 플로우 빌더 노드 (드래그앤드롭) | 복잡도 높음 |
| P2 | 실시간 스트리밍 모니터 | WebSocket 필요 |
| P2 | 명령 전송 콘솔 | Physical AI API 필요 |
