import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const SAMPLE_QUESTIONS = {
  Finance: [
    "Explain EBITDA",
    "What is SIP investment?",
    "What is the P/E ratio?",
    "Explain equity dilution",
    "What are derivatives in finance?",
    "What is market capitalization?",
  ],
  Tech: [
    "What is Docker?",
    "Explain Kubernetes",
    "What is CI/CD?",
    "Explain microservices",
    "What is a vector database?",
    "REST API vs GraphQL?",
  ],
};

const DOMAIN_COLORS = {
  Finance: "#22c55e",
  Tech: "#38bdf8",
  General: "#a78bfa",
};

const DOMAIN_ICONS = {
  Finance: "₹",
  Tech: "</>",
  General: "◈",
};

function TypingDots() {
  return (
    <span className="typing-dots">
      <span /><span /><span />
    </span>
  );
}

export default function App() {
  const [prompt, setPrompt]       = useState("");
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("Finance");
  const [modelStatus, setModelStatus] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch model status on mount
  useEffect(() => {
    axios.get(`${API_BASE}/health`)
      .then(r => setModelStatus(r.data))
      .catch(() => setModelStatus(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const q = (text || prompt).trim();
    if (!q) return;

    setMessages(m => [...m, { role: "user", text: q }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/generate`, { prompt: q });
      const { response, domain, source } = res.data;
      setMessages(m => [...m, { role: "assistant", text: response, domain, source }]);
    } catch (e) {
      setMessages(m => [...m, {
        role: "assistant",
        text: "⚠ Could not reach the backend. Make sure the API is running at " + API_BASE,
        domain: "General",
        source: "error",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">⬡</span>
          <div>
            <div className="logo-name">DomainAI</div>
            <div className="logo-sub">Finance &amp; Tech LLM</div>
          </div>
        </div>

        {/* Model status pill */}
        {modelStatus && (
          <div className={`status-pill ${modelStatus.model_loaded ? "loaded" : "fallback"}`}>
            <span className="status-dot" />
            {modelStatus.model_loaded ? "Fine-tuned model" : "Knowledge base mode"}
          </div>
        )}

        {/* Sample questions */}
        <div className="sample-tabs">
          {["Finance", "Tech"].map(t => (
            <button
              key={t}
              className={`sample-tab ${activeTab === t ? "active" : ""}`}
              style={activeTab === t ? { color: DOMAIN_COLORS[t] } : {}}
              onClick={() => setActiveTab(t)}
            >{t}</button>
          ))}
        </div>

        <div className="sample-list">
          {SAMPLE_QUESTIONS[activeTab].map((q, i) => (
            <button key={i} className="sample-q" onClick={() => send(q)}>
              <span className="sample-icon" style={{ color: DOMAIN_COLORS[activeTab] }}>
                {DOMAIN_ICONS[activeTab]}
              </span>
              {q}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="stack-badge">FastAPI · LoRA · Mistral</div>
        </div>
      </aside>

      {/* ── Chat area ── */}
      <main className="chat-main">
        <div className="chat-header">
          <h1>Domain-Specific AI Assistant</h1>
          <p>Fine-tuned on Finance &amp; Tech vocabulary</p>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <h2>Ask a Finance or Tech question</h2>
              <p>Pick a sample from the sidebar or type your own below</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="msg-meta">
                  <span
                    className="domain-tag"
                    style={{ color: DOMAIN_COLORS[msg.domain] || DOMAIN_COLORS.General }}
                  >
                    {DOMAIN_ICONS[msg.domain] || "◈"} {msg.domain}
                  </span>
                  {msg.source && (
                    <span className="source-tag">{msg.source}</span>
                  )}
                </div>
              )}
              <div className="msg-bubble">
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="msg-bubble loading-bubble">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="input-bar">
          <textarea
            ref={textareaRef}
            className="input-box"
            placeholder="Ask about EBITDA, Kubernetes, P/E ratio, Docker…"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
          />
          <button
            className="send-btn"
            onClick={() => send()}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <span className="spinner" /> : "↑"}
          </button>
        </div>
        <div className="input-hint">Enter to send · Shift+Enter for new line</div>
      </main>
    </div>
  );
}
