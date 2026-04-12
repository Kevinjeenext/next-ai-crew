# 3. 채팅 인터페이스 — Slack/Discord 스타일

> 레이아웃: 좌측 사이드바 + 중앙 대화창

---

## 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  사이드바 (260px)        │  대화창                            │
│ ─────────────────────── │ ─────────────────────────────────  │
│  Next AI Crew            │  [헤더: Aria · Developer · ●]      │
│  ─────────────────────  │ ─────────────────────────────────  │
│  내 Soul 팀              │                                    │
│  # Aria  (dev)   [3]    │                                    │
│  # Kai   (devops)       │  [메시지 영역 스크롤]               │
│  # Luna  (design)       │                                    │
│                         │                                    │
│  ─────────────────────  │                                    │
│  + Soul 채용            │                                    │
│                         │ ─────────────────────────────────  │
│                         │  [입력창]                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 채팅 사이드바

```css
.chat-sidebar {
  width: 260px; flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
}
.chat-sidebar-header {
  padding: 16px; border-bottom: 1px solid var(--border-subtle);
  font: 700 15px var(--font-ui); color: var(--text-primary);
}

.chat-sidebar-section { padding: 4px 8px; }
.chat-sidebar-label {
  padding: 12px 8px 4px;
  font: 600 11px var(--font-ui);
  color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.6px;
}

.soul-channel-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 8px; border-radius: 6px;
  cursor: pointer; transition: background 0.12s;
}
.soul-channel-item:hover  { background: var(--bg-overlay); }
.soul-channel-item.active { background: rgba(37,99,235,0.12); }

.channel-hash {
  font: 400 14px var(--font-ui); color: var(--text-tertiary);
  width: 16px; text-align: center; flex-shrink: 0;
}
.channel-name {
  flex: 1;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.soul-channel-item.active .channel-name { color: var(--text-primary); }
.channel-unread {
  min-width: 18px; height: 18px;
  background: var(--brand-blue); color: white;
  border-radius: 9px; padding: 0 5px;
  font: 700 11px var(--font-ui);
  display: flex; align-items: center; justify-content: center;
}

.chat-sidebar-add {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  font: 400 13px var(--font-ui); color: var(--text-tertiary);
  transition: background 0.12s, color 0.12s;
  margin-top: 4px;
}
.chat-sidebar-add:hover { background: var(--bg-overlay); color: var(--text-secondary); }
```

---

## 대화창 헤더

```
┌─────────────────────────────────────────────────────┐
│  [Ar]  Aria               ● Online     [설정 ···]   │
│        Senior Developer — 오늘 12 tasks 완료         │
└─────────────────────────────────────────────────────┘
```

```css
.chat-main-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  flex-shrink: 0;
}
.chat-main-title {
  flex: 1;
}
.chat-main-name {
  font: 600 15px var(--font-ui); color: var(--text-primary);
  display: flex; align-items: center; gap: 8px;
}
.chat-main-sub {
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  margin-top: 2px;
}
.chat-header-actions { display: flex; gap: 6px; }
.chat-header-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; background: transparent;
  border: none; cursor: pointer; color: var(--text-tertiary);
  transition: background 0.12s, color 0.12s;
}
.chat-header-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
```

---

## 메시지 영역

```css
.chat-messages {
  flex: 1; overflow-y: auto;
  padding: 20px;
  display: flex; flex-direction: column; gap: 2px;
}
.chat-messages::-webkit-scrollbar { width: 3px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

/* 날짜 구분 */
.chat-date-divider {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 0 8px;
}
.chat-date-divider::before,
.chat-date-divider::after {
  content: ""; flex: 1; height: 1px;
  background: var(--border-subtle);
}
.chat-date-label {
  font: 500 11px var(--font-ui); color: var(--text-tertiary);
  white-space: nowrap;
}

/* 메시지 그룹 (같은 발신자 연속) */
.msg-group { display: flex; gap: 12px; padding: 3px 0; }
.msg-group:hover { background: rgba(255,255,255,0.02); border-radius: 6px; }

/* Soul 메시지 */
.msg-avatar-col { width: 36px; flex-shrink: 0; padding-top: 2px; }
.msg-body-col { flex: 1; min-width: 0; }
.msg-header {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;
}
.msg-sender-name {
  font: 600 14px var(--font-ui); color: var(--text-primary);
}
.msg-timestamp {
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
}
.msg-text {
  font: 400 14px/1.6 var(--font-body); color: var(--text-secondary);
  white-space: pre-wrap; word-break: break-word;
}

/* 코드 블록 */
.msg-code {
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 6px; padding: 12px 14px; margin: 6px 0;
  font: 400 12px/1.6 var(--font-mono); color: #E2E8F0;
  overflow-x: auto;
}

/* 사용자 메시지 */
.msg-group.user { flex-direction: row-reverse; }
.msg-group.user .msg-body-col { align-items: flex-end; }
.msg-group.user .msg-header { flex-direction: row-reverse; }
.msg-group.user .msg-text {
  background: var(--brand-blue); color: white;
  padding: 9px 14px; border-radius: 10px; border-bottom-right-radius: 3px;
  display: inline-block; max-width: 80%;
}

/* SSE 스트리밍 커서 */
.msg-text.streaming::after {
  content: "▋"; color: var(--brand-cyan);
  animation: cursor-blink 0.7s step-end infinite;
}
@keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* 타이핑 인디케이터 */
.msg-typing .msg-text {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  padding: 10px 14px; border-radius: 10px; border-bottom-left-radius: 3px;
  display: inline-flex; align-items: center; gap: 4px;
}
.typing-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }
```

---

## 입력창

```css
.chat-input-wrap {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.chat-input-box {
  display: flex; align-items: flex-end; gap: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 10px; padding: 10px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.chat-input-box:focus-within {
  border-color: rgba(37,99,235,0.4);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}
.chat-textarea {
  flex: 1; background: transparent; border: none; outline: none;
  resize: none; max-height: 120px; min-height: 22px;
  font: 400 14px/1.5 var(--font-body); color: var(--text-primary);
  overflow-y: auto;
}
.chat-textarea::placeholder { color: var(--text-tertiary); }
.chat-send-btn {
  width: 32px; height: 32px;
  background: var(--brand-blue); border: none; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: white; flex-shrink: 0;
  transition: background 0.15s;
}
.chat-send-btn:hover { background: var(--brand-blue-h); }
.chat-send-btn:disabled { background: var(--bg-overlay); color: var(--text-tertiary); cursor: not-allowed; }
.chat-input-hint {
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
  margin-top: 6px; padding: 0 2px;
}
```
