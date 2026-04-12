# Soul Chat — 전체 너비 메인 뷰

> 2026-04-12 | Designer: Ivy
> 기존 슬라이드인 패널(360px) → 앱 메인 영역 전체 차지
> 참고: Slack DM / Discord 채널 / Linear 코멘트 뷰

---

## 레이아웃 구조

```
┌────────────────────────────────────────────────────────────────────┐
│  글로벌 사이드바 (240px)  │  채팅 사이드바 (260px)  │  대화창    │
│                           │                          │            │
│  [로고]                   │  내 Soul 팀              │  [헤더]    │
│  ■ 대시보드               │  # Aria  (dev)   [3]    │            │
│  ■ Soul 팀    ←           │  # Kai   (devops)       │  [메시지]  │
│  ■ Soul 채용              │  # Luna  (design)       │            │
│  ─────────               │  ─────────────────────  │            │
│  ■ 빌링                   │  + Soul 채용하기         │  [입력창]  │
│  ■ 설정                   │                          │            │
└────────────────────────────────────────────────────────────────────┘
```

앱 셸 CSS:
```css
.app-shell { display: flex; height: 100vh; overflow: hidden; }

/* 글로벌 사이드바 */
.global-sidebar { width: 240px; flex-shrink: 0; }

/* 채팅 레이아웃 (글로벌 사이드바 우측 전체) */
.chat-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 채팅 Soul 사이드바 */
.chat-soul-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex; flex-direction: column;
  height: 100vh;
}

/* 대화창 메인 */
.chat-main {
  flex: 1;
  display: flex; flex-direction: column;
  overflow: hidden;
  background: var(--bg-base);
}
```

---

## 채팅 헤더 (전체 너비)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Ar]  Aria               ● Online     [🔍] [ℹ] [···]          │
│  (dev) Senior Developer — 오늘 12 tasks 완료 · 이번 달 588K tokens│
└──────────────────────────────────────────────────────────────────┘
```

```css
.chat-header {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  flex-shrink: 0;
}
.chat-header-avatar { flex-shrink: 0; }
.chat-header-info   { flex: 1; min-width: 0; }
.chat-header-name {
  font: 600 15px var(--font-ui); color: var(--text-primary);
  display: flex; align-items: center; gap: 8px; margin-bottom: 3px;
}
.chat-header-meta {
  font: 400 12px var(--font-ui); color: var(--text-tertiary);
  display: flex; align-items: center; gap: 10px;
}
.chat-header-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-tertiary); }
.chat-header-actions { display: flex; gap: 4px; }
```

---

## 메시지 영역 (전체 너비 최적화)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ─────────────── 오늘 2026.04.12 ───────────────                 │
│                                                                  │
│  [Ar]  Aria                                          14:23       │
│        안녕하세요! 무엇을 도와드릴까요?                          │
│        오늘 할 일 목록, 코드 리뷰, 문서 작성 등                  │
│        무엇이든 편하게 말씀해 주세요 😊                          │
│                                                                  │
│                                          14:24       [사용자]    │
│  API 문서 자동화 스크립트 만들어줘                               │
│                                                                  │
│  [Ar]  Aria                                          14:24       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ # API 문서 자동화 스크립트                              │    │  ← 코드 블록
│  │                                                         │    │
│  │ import anthropic                                        │    │
│  │ ...                                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Ar] ● ● ●                                                     │  ← 타이핑
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

```css
/* 전체 너비 메시지 영역 */
.chat-messages {
  flex: 1; overflow-y: auto;
  padding: 24px 32px;
  display: flex; flex-direction: column; gap: 0;
  scroll-behavior: smooth;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

/* 메시지 그룹 (같은 발신자 연속) */
.msg-group {
  display: flex; gap: 14px;
  padding: 4px 12px; margin: 0 -12px;
  border-radius: 6px;
  transition: background 0.1s;
}
.msg-group:hover { background: rgba(255,255,255,0.025); }

/* 연속 메시지 (같은 발신자, 1분 이내) */
.msg-group.continued { margin-top: 2px; }
.msg-group.continued .msg-avatar-col { visibility: hidden; } /* 아바타 숨김 */
.msg-group.continued .msg-header { display: none; }          /* 이름/시간 숨김 */

/* 새 발신자 첫 메시지 */
.msg-group.first-in-group { margin-top: 16px; }

.msg-avatar-col { width: 40px; flex-shrink: 0; padding-top: 1px; }
.msg-body-col   { flex: 1; min-width: 0; max-width: 800px; }

.msg-header {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px;
}
.msg-sender-name { font: 600 14px var(--font-ui); color: var(--text-primary); }
.msg-timestamp   { font: 400 11px var(--font-ui); color: var(--text-tertiary); }

.msg-text {
  font: 400 14px/1.65 var(--font-body);
  color: var(--text-secondary);
  white-space: pre-wrap; word-break: break-word;
}
/* 사용자 메시지 — 우측 정렬 */
.msg-group.user {
  flex-direction: row-reverse;
  justify-content: flex-start;
}
.msg-group.user .msg-body-col {
  display: flex; flex-direction: column; align-items: flex-end;
}
.msg-group.user .msg-header { flex-direction: row-reverse; }
.msg-group.user .msg-text {
  background: var(--brand-blue); color: white;
  padding: 10px 16px; border-radius: 14px; border-bottom-right-radius: 3px;
  display: inline-block;
}

/* 코드 블록 (전체 너비 최적화) */
.msg-code-wrap { margin: 8px 0; }
.msg-code-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-bottom: none; border-radius: 8px 8px 0 0;
  font: 500 12px var(--font-mono); color: var(--text-tertiary);
}
.msg-code-copy {
  font: 500 11px var(--font-ui); color: var(--text-tertiary);
  background: transparent; border: none; cursor: pointer;
  transition: color 0.12s; padding: 2px 6px; border-radius: 4px;
}
.msg-code-copy:hover { color: var(--text-secondary); background: var(--bg-overlay); }
.msg-code-body {
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 0 0 8px 8px; padding: 14px 16px;
  font: 400 13px/1.6 var(--font-mono); color: #E2E8F0;
  overflow-x: auto; max-height: 400px; overflow-y: auto;
}
.msg-code-body::-webkit-scrollbar { width: 4px; height: 4px; }
.msg-code-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

/* SSE 스트리밍 */
.msg-text.streaming::after {
  content: "▋"; color: var(--brand-cyan);
  animation: cursor-blink 0.7s step-end infinite;
}
@keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* 타이핑 인디케이터 */
.msg-typing-wrap {
  display: flex; gap: 14px; align-items: center; padding: 8px 12px; margin: 0 -12px;
}
.msg-typing-dots {
  display: flex; align-items: center; gap: 4px;
  padding: 10px 14px; background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 14px; border-bottom-left-radius: 3px;
}
.typing-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
```

---

## 입력창 (전체 너비)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ [📎]  Aria에게 메시지 보내기...                  [Enter ↑] │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Enter로 전송  ·  Shift+Enter로 줄바꿈                          │
└──────────────────────────────────────────────────────────────────┘
```

```css
.chat-input-area {
  padding: 12px 32px 20px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.chat-input-box {
  display: flex; align-items: flex-end; gap: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 12px; padding: 10px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.chat-input-box:focus-within {
  border-color: rgba(37,99,235,0.35);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}
.chat-attach-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px;
  color: var(--text-tertiary); cursor: pointer;
  transition: color 0.12s, background 0.12s;
  flex-shrink: 0;
}
.chat-attach-btn:hover { color: var(--text-secondary); background: var(--bg-overlay); }
.chat-textarea {
  flex: 1; background: transparent; border: none; outline: none;
  resize: none; max-height: 200px; min-height: 24px;
  font: 400 14px/1.55 var(--font-body); color: var(--text-primary);
  overflow-y: auto;
}
.chat-textarea::placeholder { color: var(--text-tertiary); }
.chat-send-btn {
  width: 32px; height: 32px; background: var(--brand-blue);
  border: none; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: white; cursor: pointer; flex-shrink: 0;
  transition: background 0.15s;
}
.chat-send-btn:hover { background: var(--brand-blue-h); }
.chat-send-btn:disabled { background: var(--bg-overlay); color: var(--text-tertiary); cursor: not-allowed; }
.chat-input-hint {
  font: 400 11px var(--font-ui); color: var(--text-tertiary);
  margin-top: 7px; padding: 0 2px;
}

/* 빈 상태 */
.chat-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px;
}
.chat-empty-avatar { flex-shrink: 0; margin-bottom: 16px; }
.chat-empty-name { font: 600 20px var(--font-ui); color: var(--text-primary); margin-bottom: 6px; }
.chat-empty-role { font: 400 14px var(--font-ui); color: var(--text-secondary); margin-bottom: 8px; }
.chat-empty-quote { font: 400 13px/1.7 var(--font-body); color: var(--text-tertiary); font-style: italic; max-width: 300px; text-align: center; margin-bottom: 28px; }
.chat-quick-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.chat-quick-btn {
  padding: 8px 16px; border-radius: 20px;
  border: 1px solid var(--border-default); background: transparent;
  font: 500 13px var(--font-ui); color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.chat-quick-btn:hover {
  border-color: rgba(37,99,235,0.4); color: #93BBFC;
  background: rgba(37,99,235,0.08);
}
```

---

## Soul 상세 패널 (우측 슬라이드오버 — 선택)

헤더 [ℹ] 클릭 시 우측에서 320px 패널 등장

```
┌────────────────────────────────┐
│  [×]  Soul 정보                │
│                                │
│  [Ar 72px]                     │
│  Aria                          │
│  Senior Developer              │
│  ● Online · 이번 달 588K tokens │
│                                │
│  스킬                          │
│  [React] [Python] [TypeScript] │
│                                │
│  성격                          │
│  꼼꼼함  ████████░░  78%       │
│  창의성  ██████░░░░  60%       │
│  속도    ██████████  95%       │
│  협업    ███████░░░  70%       │
│                                │
│  ─────────────────────────     │
│  이번 달 사용량                │
│  588,000 / 2,000,000 토큰      │
│  ████░░░░░░░░░░░  29%          │
│                                │
│  [Soul 설정] [채용 해제]       │
└────────────────────────────────┘
```

```css
.soul-info-panel {
  width: 320px; flex-shrink: 0;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  height: 100%; overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  position: absolute; right: 0; top: 0;
}
.soul-info-panel.open { transform: translateX(0); }
/* 패널 열릴 때 대화창 너비 자동 수축: flex layout으로 처리 */

.soul-info-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-subtle);
  font: 600 14px var(--font-ui); color: var(--text-primary);
}
.soul-info-body { padding: 24px 20px; display: flex; flex-direction: column; gap: 20px; }
.soul-info-top  { display: flex; flex-direction: column; align-items: center; text-align: center; }
.soul-info-name { font: 700 18px var(--font-ui); color: var(--text-primary); margin: 12px 0 4px; }
.soul-info-role { font: 400 13px var(--font-ui); color: var(--text-secondary); margin-bottom: 4px; }
.soul-info-status { display: flex; align-items: center; gap: 6px; font: 400 12px var(--font-ui); color: var(--text-tertiary); }
.soul-info-section-title { font: 600 12px var(--font-ui); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
```

---

## 반응형 (채팅)

```css
/* 태블릿: 글로벌 사이드바 숨김 → 햄버거 */
@media (max-width: 1024px) {
  .global-sidebar { display: none; }
}
/* 모바일: 채팅 Soul 사이드바 숨김 → 전체화면 대화창 */
@media (max-width: 768px) {
  .chat-soul-sidebar { display: none; }
  .chat-messages     { padding: 16px; }
  .chat-input-area   { padding: 10px 16px calc(16px + env(safe-area-inset-bottom)); }
}
```
