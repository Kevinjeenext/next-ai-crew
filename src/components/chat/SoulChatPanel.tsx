/**
 * Soul Chat Panel — 1:1 conversation with a Soul
 * Opens from office/hire when clicking a Soul avatar
 * Supports streaming (SSE) + standard responses
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Copy, Check, Send, Paperclip, File, FileText, Image as ImageIcon, Table, Trash2, AlertCircle } from "lucide-react";
import * as tus from "tus-js-client";
import { apiFetch } from "../../lib/api-fetch";
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

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: string;
  attachments?: Attachment[];
}

// No file size limit per Kevin directive
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain", "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];
const ALLOWED_EXTS = [".jpg",".jpeg",".png",".gif",".webp",".pdf",".txt",".md",".docx",".xlsx",".csv"];

function isAllowedFile(file: File): boolean {
  if (ALLOWED_TYPES.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTS.includes(ext);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon size={16} />;
  if (type === "application/pdf" || type.includes("word")) return <FileText size={16} />;
  if (type.includes("sheet") || type === "text/csv") return <Table size={16} />;
  return <File size={16} />;
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, { percent: number; status: "uploading" | "done" | "error" }>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check LLM status on mount
  useEffect(() => {
    apiFetch("/api/llm/status")
      .then((r) => r.json())
      .then((d) => setLlmReady(d.ready))
      .catch(() => setLlmReady(false));
  }, []);

  // Reset state on Soul change
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setStreamingContent("");
    setIsStreaming(false);
    setLoading(false);
  }, [soulId]);

  // Load history
  useEffect(() => {
    apiFetch(`/api/souls/${soulId}/messages?limit=50`)
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
              attachments: m.attachments || undefined,
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

  // Auto-delegate on @mention detection
  const handleMentions = useCallback(async (mentions: { soul_id: string; display_name: string }[], _context: string) => {
    for (const m of mentions) {
      try {
        await apiFetch("/api/a2a/delegate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_soul_id: soulId,
            to_soul_id: m.soul_id,
            message: _context,
          }),
        });
        setMessages(prev => [...prev, {
          id: `sys-${Date.now()}`, role: "system",
          content: `📨 ${m.display_name}에게 업무 위임 완료. 조직 대화에서 확인하세요.`,
          timestamp: new Date(),
        }]);
      } catch {}
    }
  }, [soulId]);

  // File handling
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: File[] = [];
    for (const f of arr) {
      if (!isAllowedFile(f)) { alert(`${f.name}: 지원하지 않는 형식`); continue; }
      valid.push(f);
    }
    setPendingFiles(prev => [...prev, ...valid]);
  }, []);

  const removeFile = useCallback((idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const getAuthToken = useCallback((): string | null => {
    try {
      const raw = localStorage.getItem("sb-auth-token") || sessionStorage.getItem("sb-auth-token");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.access_token || parsed || null;
    } catch { return null; }
  }, []);

  const RESUMABLE_THRESHOLD = 50 * 1024 * 1024; // 50MB

  const uploadSingleFile = useCallback((file: File, soulId: string): Promise<Attachment | null> => {
    const key = `${file.name}-${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [key]: { percent: 0, status: "uploading" } }));

    // Small files → standard upload, large files → tus resumable
    if (file.size < RESUMABLE_THRESHOLD) {
      return fallbackUpload(file, soulId, key);
    }
    return resumableUpload(file, soulId, key);
  }, []);

  const resumableUpload = useCallback((file: File, soulId: string, key: string): Promise<Attachment | null> => {
    return new Promise(async (resolve) => {
      try {
        // 1. Get upload metadata from server
        const metaRes = await apiFetch(`/api/souls/${soulId}/upload/resumable`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
        });
        if (!metaRes.ok) {
          console.warn("[tus] Metadata API failed, falling back");
          resolve(await fallbackUpload(file, soulId, key));
          return;
        }
        const meta = await metaRes.json();
        const token = getAuthToken();

        // 2. Create tus upload
        const tusUpload = new tus.Upload(file, {
          endpoint: meta.tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            authorization: `Bearer ${token || ""}`,
            apikey: meta.supabaseAnonKey || "",
            "x-upsert": "true",
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: meta.bucketId || "soul-attachments",
            objectName: meta.storagePath,
            contentType: file.type,
            cacheControl: "3600",
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (error) => {
            console.warn("[tus] Upload failed, falling back:", error.message);
            setUploadProgress(prev => ({ ...prev, [key]: { percent: 0, status: "uploading" } }));
            fallbackUpload(file, soulId, key).then(resolve);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percent = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress(prev => ({ ...prev, [key]: { percent, status: "uploading" } }));
          },
          onSuccess: () => {
            setUploadProgress(prev => ({ ...prev, [key]: { percent: 100, status: "done" } }));
            resolve({ name: file.name, url: meta.publicUrl, type: file.type, size: file.size });
          },
        });

        // Resume previous if available
        const prevUploads = await tusUpload.findPreviousUploads();
        if (prevUploads.length > 0) tusUpload.resumeFromPreviousUpload(prevUploads[0]);
        tusUpload.start();
      } catch (err) {
        console.warn("[tus] Init failed, falling back:", err);
        resolve(await fallbackUpload(file, soulId, key));
      }
    });
  }, [getAuthToken]);

  // Fallback: standard upload via server API (for when tus fails)
  const fallbackUpload = useCallback(async (file: File, soulId: string, key: string): Promise<Attachment | null> => {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch(`/api/souls/${soulId}/upload`, { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setUploadProgress(prev => ({ ...prev, [key]: { percent: 100, status: "done" } }));
        return { name: file.name, url: data.url, type: file.type, size: file.size };
      }
    } catch {}
    setUploadProgress(prev => ({ ...prev, [key]: { percent: 0, status: "error" } }));
    return null;
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<Attachment[]> => {
    if (files.length === 0) return [];
    setUploading(true);
    setUploadProgress({});
    const results: Attachment[] = [];
    for (const file of files) {
      const att = await uploadSingleFile(file, soulId);
      if (att) results.push(att);
    }
    setUploading(false);
    // Clear progress after brief delay
    setTimeout(() => setUploadProgress({}), 2000);
    return results;
  }, [soulId, uploadSingleFile]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || loading) return;

    // Upload pending files first
    const filesToUpload = [...pendingFiles];
    setPendingFiles([]);
    setInput("");
    setLoading(true);

    let attachments: Attachment[] = [];
    if (filesToUpload.length > 0) {
      attachments = await uploadFiles(filesToUpload);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text || (attachments.length > 0 ? `📎 ${attachments.map(a => a.name).join(", ")}` : ""),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Use SSE streaming
      setIsStreaming(true);
      setStreamingContent("");

      const res = await apiFetch(`/api/souls/${soulId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || `[첨부 파일: ${attachments.map(a => a.name).join(", ")}]`,
          conversation_id: conversationId,
          stream: true,
          attachments: attachments.length > 0 ? attachments : undefined,
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
                // Stream complete — check for mentions → auto-delegate
                if (payload.conversation_id) setConversationId(payload.conversation_id);
                if (payload.mentions && payload.mentions.length > 0) {
                  handleMentions(payload.mentions, fullContent);
                }
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
  }, [input, loading, soulId, conversationId, pendingFiles, uploadFiles]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  return (
    <div
      className={`soul-chat-panel ${dragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="soul-chat-drop-overlay">
          <Paperclip size={48} />
          <p>파일을 드롭하세요</p>
        </div>
      )}
      {/* Header */}
      <div className="soul-chat-header" style={{ borderColor: deptColor }}>
        {soulAvatar ? (
          <img src={soulAvatar} alt={soulName} className="soul-chat-avatar" />
        ) : (
          <div className="soul-chat-avatar soul-chat-avatar-fallback" style={{ background: deptColor }}>
            {soulName?.charAt(0) || "?"}
          </div>
        )}
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
            {soulAvatar ? (
              <img src={soulAvatar} alt="" className="soul-chat-empty-avatar" />
            ) : (
              <div className="soul-chat-empty-avatar soul-chat-avatar-fallback" style={{ background: deptColor }}>
                {soulName?.charAt(0) || "?"}
              </div>
            )}
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
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="msg-attachments">
                    {msg.attachments.map((att, ai) => (
                      att.type.startsWith("image/") ? (
                        <a key={ai} href={att.url} target="_blank" rel="noopener" className="msg-att-image">
                          <img src={att.url} alt={att.name} />
                        </a>
                      ) : (
                        <a key={ai} href={att.url} target="_blank" rel="noopener" className="msg-att-file">
                          {getFileIcon(att.type)}
                          <span className="msg-att-name">{att.name}</span>
                          <span className="msg-att-size">{formatFileSize(att.size)}</span>
                        </a>
                      )
                    ))}
                  </div>
                )}
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
        {/* Pending file previews */}
        {(pendingFiles.length > 0 || Object.keys(uploadProgress).length > 0) && (
          <div className="soul-chat-pending-files">
            {/* Upload progress items */}
            {Object.entries(uploadProgress).map(([key, prog]) => (
              <div key={key} className={`pending-file-item ${prog.status}`}>
                <div className="pending-file-icon">
                  {prog.status === "done" ? <Check size={16} className="upload-done-icon" /> : prog.status === "error" ? <AlertCircle size={16} className="upload-error-icon" /> : <div className="upload-spinner-mini" />}
                </div>
                <div className="pending-file-info">
                  <span className="pending-file-name">{key.replace(/-\d+$/, "")}</span>
                  {prog.status === "uploading" && (
                    <div className="upload-progress-bar">
                      <div className="upload-progress-fill" style={{ width: `${prog.percent}%` }} />
                    </div>
                  )}
                  <span className="pending-file-size">
                    {prog.status === "uploading" ? `${prog.percent}%` : prog.status === "done" ? "✅ 완료" : "❌ 실패"}
                  </span>
                </div>
              </div>
            ))}
            {/* Pending (not yet uploading) */}
            {pendingFiles.map((f, i) => (
              <div key={i} className="pending-file-item">
                {f.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(f)} alt={f.name} className="pending-file-thumb" />
                ) : (
                  <div className="pending-file-icon">{getFileIcon(f.type)}</div>
                )}
                <div className="pending-file-info">
                  <span className="pending-file-name">{f.name}</span>
                  <span className="pending-file-size">{formatFileSize(f.size)}</span>
                </div>
                <button className="pending-file-remove" onClick={() => removeFile(i)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="soul-chat-input-box">
          <input
            type="file"
            ref={fileInputRef}
            className="soul-chat-file-input"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md,.docx,.xlsx,.csv"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
          <button className="soul-chat-attach-btn" onClick={() => fileInputRef.current?.click()} title="파일 첨부">
            <Paperclip size={18} />
          </button>
          <textarea
            ref={inputRef}
            className="soul-chat-input"
            placeholder={`${soulNameKo}에게 메시지 보내기...`}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 200) + "px";
            }}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={loading}
          />
          <button
            className="soul-chat-send"
            onClick={sendMessage}
            disabled={(!input.trim() && pendingFiles.length === 0) || loading || uploading}
          >
            {uploading ? <div className="soul-chat-upload-spinner" /> : <Send size={16} strokeWidth={2} />}
          </button>
        </div>
        <div className="soul-chat-input-hint">Enter 전송 · Shift+Enter 줄바꿈 · 파일 드래그앱드롭 지원</div>
      </div>
    </div>
  );
}
