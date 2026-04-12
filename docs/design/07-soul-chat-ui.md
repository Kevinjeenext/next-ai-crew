# Soul Chat Panel — UI/UX 와이어프레임

> 2026-04-12 | Designer: Ivy | 요청: 수진 CTO
> 참고: ChatGPT / Claude / Discord DM / Slack DM + ClawPoD 톤
> SSE 스트리밍 API 연동 기준

---

## 1. 진입 방식 (2가지)

```
[오피스] → Soul 아바타 클릭 → 우측 슬라이드인 패널 (데스크탑)
                             → 전체 화면 채팅 뷰 (768px 이하 모바일)
```

---

## 2. 데스크탑 — 슬라이드인 패널 (360px 고정 너비)

```
┌─────────────────────────────────────────────────────────┐
│  [오피스 뷰 (남은 영역)]         │  Soul Chat Panel     │
│                                  │  ┌───────────────┐   │
│  [Aria] [Kai] [Luna] ...         │  │ ● 헤더         │   │
│                                  │  │ ─────────────  │   │
│                                  │  │ ● 메시지 영역  │   │
│                                  │  │               │   │
│                                  │  │               │   │
│                                  │  │               │   │
│                                  │  │ ─────────────  │   │
│                                  │  │ ● 입력창       │   │
│                                  │  └───────────────┘   │
└─────────────────────────────────────────────────────────┘
```

패널 진입 애니메이션:
```css
.soul-chat-panel {
  position: fixed;
  top: 0; right: 0;
  width: 360px; height: 100vh;
  background: var(--th-card-bg);
  border-left: 1px solid rgba(255,255,255,0.08);
  box-shadow: -8px 0 32px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
}
.soul-chat-panel.open {
  transform: translateX(0);
}
```

---

## 3. 패널 헤더

```
┌─────────────────────────────────────────┐
│  [×]  [Aria 아바타 40px]  Aria          │
│                           Senior Dev    │
│                           ● Active      │  ← 초록 상태 도트
│                    [프로필 →]           │  ← Soul 채용 카드로 이동
└─────────────────────────────────────────┘
```

```css
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.chat-header-close {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--th-text-muted);
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.chat-header-close:hover { background: rgba(255,255,255,0.06); }

.chat-header-avatar {
  width: 40px; height: 40px;
  image-rendering: pixelated; image-rendering: crisp-edges;
  border-radius: 8px;
  flex-shrink: 0;
}
.chat-header-info { flex: 1; min-width: 0; }
.chat-header-name {
  font: 600 15px/1.2 "Space Grotesk";
  color: var(--th-text-heading);
  margin-bottom: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.chat-header-role {
  font: 400 12px/1 "Pretendard";
  color: var(--th-text-muted);
  margin-bottom: 4px;
}
.chat-header-status {
  display: flex; align-items: center; gap: 5px;
  font: 500 12px/1 "Space Grotesk";
}
.status-dot {
  width: 7px; height: 7px; border-radius: 2px;
}
.status-dot.active  { background: #10B981; box-shadow: 0 0 4px rgba(16,185,129,0.5); }
.status-dot.idle    { background: #F59E0B; }
.status-dot.offline { background: #475569; }
.status-label.active  { color: #6EE7B7; }
.status-label.idle    { color: #FCD34D; }
.status-label.offline { color: var(--th-text-muted); }

.chat-profile-link {
  font: 500 12px/1 "Space Grotesk";
  color: var(--th-text-muted);
  text-decoration: none;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.15s;
  white-space: nowrap;
}
.chat-profile-link:hover {
  border-color: rgba(255,255,255,0.16);
  color: var(--th-text-body);
}
```

---

## 4. 메시지 영역

```
┌─────────────────────────────────────────┐
│                                         │
│  [Aria 24px]                            │
│  ┌──────────────────────────┐           │
│  │ 안녕하세요! 무엇을 도와  │           │  ← Soul 말풍선 (좌측)
│  │ 드릴까요?                │           │
│  └──────────────────────────┘           │
│  14:23                                  │
│                                         │
│                    ┌─────────────────┐  │
│                    │ API 문서 작성   │  │  ← 사용자 말풍선 (우측)
│                    │ 좀 도와줘       │  │
│                    └─────────────────┘  │
│                                   14:24 │
│                                         │
│  [Aria 24px]                            │
│  ┌──────────────────────────┐           │
│  │ 물론이죠! 어떤 API인지   │  ← SSE 스트리밍 중
│  │ 알려주시면 ▋             │     커서 깜빡임
│  └──────────────────────────┘           │
│                                         │
│  [Aria 24px] ● ● ●                     │  ← 타이핑 인디케이터
└─────────────────────────────────────────┘
```

```css
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex; flex-direction: column; gap: 16px;
  scroll-behavior: smooth;
}
/* 스크롤바 얇게 */
.chat-messages::-webkit-scrollbar { width: 3px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

/* 메시지 행 */
.chat-message-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.chat-message-row.user {
  flex-direction: row-reverse;
}

/* Soul 아바타 (소형) */
.chat-msg-avatar {
  width: 28px; height: 28px;
  image-rendering: pixelated; image-rendering: crisp-edges;
  border-radius: 6px;
  flex-shrink: 0;
  align-self: flex-end;
}

/* 말풍선 */
.chat-bubble {
  max-width: 80%;
  padding: 11px 14px;
  border-radius: 14px;
  font: 400 14px/1.6 "Pretendard";
  color: var(--th-text-body);
  word-break: break-word;
  white-space: pre-wrap;
}
/* Soul 말풍선 — 좌측, 카드 배경 */
.chat-bubble.soul {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  border-bottom-left-radius: 4px;
}
/* 사용자 말풍선 — 우측, crew-blue */
.chat-bubble.user {
  background: #2563EB;
  color: white;
  border-bottom-right-radius: 4px;
}

/* 타임스탬프 */
.chat-timestamp {
  font: 400 11px "Space Grotesk";
  color: rgba(255,255,255,0.25);
  margin-top: 4px;
  padding: 0 4px;
}
.chat-message-row.user .chat-timestamp { text-align: right; }

/* SSE 스트리밍 커서 */
.chat-bubble.streaming::after {
  content: "▋";
  color: #06B6D4;
  animation: cursor-blink 0.8s step-end infinite;
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* 타이핑 인디케이터 */
.chat-typing {
  display: flex; align-items: center; gap: 5px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px; border-bottom-left-radius: 4px;
  width: fit-content;
}
.typing-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.4);
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-5px); opacity: 1; }
}
```

---

## 5. 입력창

```
┌─────────────────────────────────────────┐
│  [📎]  [업무를 입력하세요...        ] [↑]│
└─────────────────────────────────────────┘
```

```css
.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.chat-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 8px 12px;
  transition: border-color 0.15s;
}
.chat-input-row:focus-within {
  border-color: rgba(37,99,235,0.4);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}
.chat-attach-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: var(--th-text-muted);
  cursor: pointer; border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.chat-attach-btn:hover { color: var(--th-text-body); background: rgba(255,255,255,0.06); }

.chat-textarea {
  flex: 1;
  background: transparent; border: none; outline: none; resize: none;
  font: 400 14px/1.5 "Pretendard";
  color: var(--th-text-body);
  max-height: 120px; min-height: 24px;
  overflow-y: auto;
}
.chat-textarea::placeholder { color: rgba(255,255,255,0.25); }

.chat-send-btn {
  width: 32px; height: 32px;
  background: #2563EB;
  border: none; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  flex-shrink: 0;
  color: white;
}
.chat-send-btn:hover  { background: #1D4ED8; }
.chat-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* 키보드 단축키 힌트 */
.chat-input-hint {
  font: 400 11px "Space Grotesk";
  color: rgba(255,255,255,0.2);
  margin-top: 6px;
  padding: 0 4px;
}
/* Enter 전송, Shift+Enter 줄바꿈 */
```

---

## 6. 하단 토큰 사용량 바 (선택)

```
┌─────────────────────────────────────────┐
│  ⚡ Aria 이번 달  588K / 2M  ████░░░░░░ │
└─────────────────────────────────────────┘
```

```css
.chat-token-bar {
  padding: 8px 16px;
  border-top: 1px solid rgba(255,255,255,0.04);
  display: flex; align-items: center; gap: 8px;
}
.chat-token-label {
  font: 400 11px "Space Grotesk";
  color: rgba(255,255,255,0.3);
  white-space: nowrap;
  flex-shrink: 0;
}
.chat-token-gauge {
  flex: 1; height: 3px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px; overflow: hidden;
}
.chat-token-fill {
  height: 100%; border-radius: 2px;
  background: #2563EB;
  transition: width 0.8s ease;
}
.chat-token-fill[data-usage="caution"] { background: #F59E0B; }
.chat-token-fill[data-usage="danger"]  { background: #EF4444; }
.chat-token-pct {
  font: 500 11px "JetBrains Mono";
  color: rgba(255,255,255,0.3);
  flex-shrink: 0;
}
```

---

## 7. 모바일 전체화면 뷰 (768px 이하)

```
┌────────────────────────────┐
│ [←]  [Aria] Aria   ● Active│  ← 헤더 (뒤로가기 포함)
│ ─────────────────────────  │
│                             │
│  ┌──────────────────────┐  │
│  │ 안녕하세요! 무엇을    │  │
│  │ 도와드릴까요?         │  │
│  └──────────────────────┘  │
│                             │
│              ┌───────────┐  │
│              │  API 문서  │  │
│              │  도와줘    │  │
│              └───────────┘  │
│                             │
│ ─────────────────────────  │
│ [📎] [입력...          ][↑]│  ← 입력창 하단 고정
│ [safe-area padding]         │
└────────────────────────────┘
```

```css
@media (max-width: 768px) {
  .soul-chat-panel {
    width: 100%; height: 100%;
    top: 0; left: 0;
    border-left: none;
    box-shadow: none;
    border-radius: 0;
    transform: translateY(100%);
  }
  .soul-chat-panel.open { transform: translateY(0); }

  .chat-input-area {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
  /* 뒤로가기 버튼 노출 */
  .chat-back-btn { display: flex; }
  .chat-close-btn { display: none; }
}
@media (min-width: 769px) {
  .chat-back-btn { display: none; }
}
```

---

## 8. 빈 상태 (첫 대화)

```
┌─────────────────────────────────────────┐
│                                         │
│           [Aria 아바타 64px]            │
│           Aria                          │
│           Senior Developer              │
│                                         │
│    "코드는 시다. 나는 매일 한 줄씩      │
│     더 나은 시를 쓴다."                │
│                                         │
│    ─────────────────────────────────   │
│    💬 무엇이든 물어보세요              │
│                                         │
│    빠른 시작:                           │
│    [코드 리뷰 요청] [버그 수정] [문서화]│
└─────────────────────────────────────────┘
```

```css
.chat-empty-state {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 24px; text-align: center;
}
.chat-empty-avatar {
  width: 64px; height: 64px;
  image-rendering: pixelated; image-rendering: crisp-edges;
  border-radius: 16px; margin-bottom: 16px;
}
.chat-empty-name {
  font: 600 18px/1.2 "Space Grotesk"; color: var(--th-text-heading);
  margin-bottom: 4px;
}
.chat-empty-role {
  font: 400 13px "Pretendard"; color: var(--th-text-muted);
  margin-bottom: 16px;
}
.chat-empty-quote {
  font: 400 13px/1.7 "Pretendard"; color: rgba(255,255,255,0.3);
  font-style: italic; max-width: 240px; margin-bottom: 24px;
}
.chat-quick-actions {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
}
.chat-quick-btn {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  font: 500 12px "Space Grotesk"; color: var(--th-text-muted);
  cursor: pointer; transition: all 0.15s;
}
.chat-quick-btn:hover {
  border-color: rgba(37,99,235,0.4);
  color: #93BBFC;
  background: rgba(37,99,235,0.08);
}
```

---

## 9. SSE 스트리밍 연동 포인트

```typescript
// 메시지 전송 → SSE 수신
async function sendMessage(content: string) {
  // 1. 사용자 메시지 즉시 렌더
  appendMessage({ role: 'user', content });

  // 2. Soul 타이핑 인디케이터 표시
  showTypingIndicator();

  // 3. SSE 연결
  const eventSource = new EventSource(`/api/soul-chat/${soulId}?msg=${encodeURIComponent(content)}`);

  let soulMessage = '';
  // 4. 타이핑 인디케이터 숨기고 스트리밍 말풍선 표시
  hideTypingIndicator();
  const bubble = appendStreamingBubble();

  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.done) {
      bubble.classList.remove('streaming'); // 커서 제거
      eventSource.close();
      updateTokenUsage(data.tokensUsed);    // 토큰 바 업데이트
      return;
    }
    soulMessage += data.chunk;
    bubble.textContent = soulMessage;
    scrollToBottom();
  };
}
```

---

## 10. 구현 우선순위

| 순서 | 항목 | 난이도 |
|------|------|--------|
| P0 | 패널 슬라이드인/아웃 + 헤더 | Easy |
| P0 | 메시지 말풍선 (user/soul) | Easy |
| P0 | 입력창 + 전송 (Enter/클릭) | Easy |
| P0 | SSE 스트리밍 커서 + 텍스트 추가 | Medium |
| P1 | 타이핑 인디케이터 (3 dots) | Easy |
| P1 | 빈 상태 + 빠른 시작 버튼 | Easy |
| P1 | 토큰 사용량 바 | Easy |
| P1 | 모바일 전체화면 전환 | Medium |
| P2 | 파일 첨부 (Phase 2) | Hard |
