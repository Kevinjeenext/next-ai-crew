/**
 * Soul Chat Panel — 1:1 conversation with a Soul
 * Opens from office/hire when clicking a Soul avatar
 * Supports streaming (SSE) + standard responses
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Copy, Check, Send } from "lucide-react";
import "./soul-chat.css";

/** Render message content with code blocks (``` ... ```) */
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  if (parts.length === 1) return <>{content}</>;

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const nlIdx = inner.indexOf("\n");
          const lang = nlIdx > 0 && nlIdx < 20 ? inner.slice(0, nlIdx).trim() : "";
          const code = lang ? inner.slice(nlIdx + 1) : inner;
          return <CodeBlock key={i} lang={lang} code={code} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };
  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span className="chat-code-lang">{lang || "code"}</span>
        <button className="chat-code-copy" onClick={handleCopy}>
          {copied ? <><Check size={14} strokeWidth={1.5} /> 복사됨</> : <><Copy size={14} strokeWidth={1.5} /> 복사</>}
        </button>
      </div>
      <pre className="chat-code-pre"><code>{code}</code></pre>
    </div>
  );
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

interface Props {
  soulId: string;
  soulName: string;
  soulNameKo: string;
  soulRole: string;
  soulAvatar: string;
  department: string;
  onClose: () => void;
  embedded?: boolean;
}

const DEPT_COLORS: Record<string, string> = {
  engineering: "#2563EB",
  design: "#06B6D4",
  planning: "#6366F1",
  marketing: "#F59E0B",
  qa: "#10B981",
  security: "#EF4444",
  devops: "#8B5CF6",
  operations: "#64748B",
};

export default function SoulChatPanel({
  soulId,
  soulName,
  soulNameKo,
  soulRole,
  soulAvatar,
  department,
  onClose,
  embedded,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]); 
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [llmReady, setLlmReady] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const deptColor = DEPT_COLORS[department] || "#2563EB";

  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Check LLM status on mount
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "";
    fetch(`${API}/api/llm/status`)
      .then((r) => r.json())
      .then((d) => setLlmReady(d.ready))
      .catch(() => setLlmReady(false));
  }, []);

  // Load history
  useEffect(() => {
    fetch(`/api/souls/${soulId}/messages?limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) {
          setMessages(
            d.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
              model: m.model_used,
            }))
          );
        }
      })
      .catch(() => {});
  }, [soulId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Use SSE streaming
      setIsStreaming(true);
      setStreamingContent("");

      const res = await fetch(`/api/souls/${soulId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`, role: "assistant",
          content: data.message || data.error || "응답을 받지 못했습니다.",
          timestamp: new Date(),
        }]);
        setIsStreaming(false);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.done) {
                // Stream complete
                if (payload.conversation_id) setConversationId(payload.conversation_id);
              } else if (payload.content) {
                fullContent += payload.content;
                setStreamingContent(fullContent);
              } else if (payload.error) {
                fullContent = payload.error;
              }
            } catch { /* skip */ }
          }
        }
      }

      // Finalize: move streaming content to messages
      setIsStreaming(false);
      setStreamingContent("");
      if (fullContent) {
        setMessages((prev) => [...prev, {
          id: `asst-${Date.now()}`, role: "assistant",
          content: fullContent, timestamp: new Date(),
        }]);
      }
    } catch (err: any) {
      setIsStreaming(false);
      setStreamingContent("");
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, role: "assistant",
        content: "네트워크 오류가 발생했습니다.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, soulId, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="soul-chat-panel">
      {/* Header */}
      <div className="soul-chat-header" style={{ borderColor: deptColor }}>
        <img src={soulAvatar} alt={soulName} className="soul-chat-avatar" />
        <div className="soul-chat-header-info">
          <div className="soul-chat-name">{soulNameKo}</div>
          <div className="soul-chat-role">{soulRole}</div>
        </div>
        <div className="soul-chat-header-actions">
          {llmReady === false && (
            <span className="soul-chat-badge offline">LLM 미설정</span>
          )}
          {llmReady === true && (
            <span className="soul-chat-badge online">온라인</span>
          )}
          <button className="soul-chat-close" onClick={onClose}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="soul-chat-messages">
        {messages.length === 0 && !loading && (
          <div className="soul-chat-empty">
            <img src={soulAvatar} alt="" className="soul-chat-empty-avatar" />
            <p className="soul-chat-empty-name">{soulNameKo}</p>
            <p className="soul-chat-empty-role">{soulRole}</p>
            <p className="soul-chat-empty-hint">메시지를 보내 대화를 시작하세요</p>
            <div className="soul-chat-quick-pills">
              {["자기소개 해줘", "오늘 할 일 정리해줘", "능력 알려줘"].map((pill) => (
                <button
                  key={pill}
                  className="soul-chat-quick-pill"
                  onClick={() => { setInput(pill); }}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null;
          const isContinued = prev && prev.role === msg.role &&
            (msg.timestamp.getTime() - prev.timestamp.getTime()) < 60000;
          const isFirst = !isContinued;
          const groupCls = [
            "msg-group",
            msg.role === "user" ? "user" : "",
            isFirst ? "first-in-group" : "continued",
          ].filter(Boolean).join(" ");

          // Date separator
          const showDateSep = !prev || msg.timestamp.toDateString() !== prev.timestamp.toDateString();
          const dateFmt = msg.timestamp.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

          return (
            <React.Fragment key={msg.id}>
            {showDateSep && <div className="chat-date-sep">{dateFmt === new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }) ? `오늘 ${dateFmt}` : dateFmt}</div>}
            <div key={msg.id} className={groupCls}>
              <div className="msg-avatar-col">
                {msg.role === "assistant" ? (
                  <div className="soul-chat-avatar" style={{ width: 40, height: 40, background: deptColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    {soulName.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <div className="soul-chat-avatar" style={{ width: 40, height: 40, background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>나</div>
                )}
              </div>
              <div className="msg-body-col">
                <div className="msg-header">
                  <span className="msg-sender-name">{msg.role === "assistant" ? soulNameKo : "나"}</span>
                  <span className="msg-timestamp">{msg.timestamp.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="msg-text"><MessageContent content={msg.content} /></div>
                {msg.model && <span className="msg-model-tag">{msg.model}</span>}
              </div>
            </div>
            </React.Fragment>
          );
        })}
        {/* Typing indicator */}
        {loading && !isStreaming && (
          <div className="msg-typing-wrap">
            <div className="msg-avatar-col">
              <div className="soul-chat-avatar" style={{ width: 40, height: 40, background: deptColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                {soulName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="msg-typing-dots">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        {/* Streaming */}
        {isStreaming && streamingContent && (
          <div className="msg-group first-in-group">
            <div className="msg-avatar-col">
              <div className="soul-chat-avatar" style={{ width: 40, height: 40, background: deptColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                {soulName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="msg-body-col">
              <div className="msg-header">
                <span className="msg-sender-name">{soulNameKo}</span>
              </div>
              <div className="msg-text streaming">{streamingContent}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="soul-chat-input-area">
        <div className="soul-chat-input-box">
          <textarea
            ref={inputRef}
            className="soul-chat-input"
            placeholder={`${soulNameKo}에게 메시지 보내기...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="soul-chat-send"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="soul-chat-input-hint">Enter 전송 · Shift+Enter 줄바꿈</div>
      </div>
    </div>
  );
}
