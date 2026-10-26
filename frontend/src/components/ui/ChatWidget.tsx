import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Leaf, ArrowRight } from "lucide-react";
import { useWorkspace } from "../../hooks/useWorkspace";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: number;
  suggestions?: string[];
  cropCard?: { id: string; name: string } | null;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Hello! 🌾 I'm **KisanBot**, your agricultural assistant. Ask me about crops, growing conditions, or regional farming advice!",
  timestamp: Date.now(),
  suggestions: [
    "Tell me about rice",
    "Best crops for Maharashtra",
    "How to test soil",
  ],
  cropCard: null,
};

function parseBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: ChatMessage;
  onSuggestionClick: (text: string) => void;
}) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      className={`chat-message ${isBot ? "chat-message--bot" : "chat-message--user"}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {isBot && (
        <div className="chat-avatar">
          <Leaf size={16} />
        </div>
      )}
      <div className={`chat-bubble ${isBot ? "chat-bubble--bot" : "chat-bubble--user"}`}>
        {message.text.split("\n").map((line, i) => (
          <span key={i}>
            {line.startsWith("•") || line.startsWith("  •") ? (
              <span className="chat-list-item">{parseBold(line)}</span>
            ) : (
              parseBold(line)
            )}
            {i < message.text.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
      {isBot && message.suggestions && message.suggestions.length > 0 && (
        <div className="chat-suggestions">
          {message.suggestions.map((s, i) => (
            <button
              key={i}
              className="chat-chip"
              onClick={() => onSuggestionClick(s)}
              type="button"
            >
              {s}
              <ArrowRight size={12} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      className="chat-message chat-message--bot"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="chat-avatar">
        <Leaf size={16} />
      </div>
      <div className="chat-bubble chat-bubble--bot chat-typing">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  );
}

export function ChatWidget() {
  const { connection } = useWorkspace();
  const reduced = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const rawBase = connection.baseUrl.replace(/\/+$/, "");
        const base =
          import.meta.env.DEV &&
          (rawBase === "http://127.0.0.1:8000" || rawBase === "http://localhost:8000")
            ? "/api"
            : rawBase;

        const response = await fetch(`${base}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": connection.apiKey,
          },
          body: JSON.stringify({ message: text.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: data.reply || "I couldn't process that. Please try again.",
            timestamp: Date.now(),
            suggestions: data.suggestions || [],
            cropCard: data.crop_card || null,
          };
          setMessages((prev) => [...prev, botMsg]);
          if (!isOpen) setHasNewMessage(true);
        } else {
          console.warn("KisanBot backend returned non-OK status:", response.status);
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: "I'm having trouble connecting to the server right now. Please check your connection settings or try again later. 🌾",
            timestamp: Date.now(),
            suggestions: ["Try again", "Tell me about rice"],
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      } catch (err) {
        console.warn("KisanBot fetch failed:", err);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: "I'm having trouble connecting to the server right now. You can still explore the **Crop Library** and **Crop Advisory** pages directly! 🌾",
          timestamp: Date.now(),
          suggestions: ["Tell me about rice", "Go to Crop Advisory"],
        };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [connection, isLoading, isOpen],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleSuggestionClick = (text: string) => {
    void sendMessage(text);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chat-fab"
            id="chat-fab"
            onClick={() => setIsOpen(true)}
            aria-label="Open chat assistant"
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={24} />
            {hasNewMessage && <span className="chat-fab-badge" />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            id="chat-panel"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            role="dialog"
            aria-label="KisanBot chat assistant"
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="chat-header-title">KisanBot</div>
                  <div className="chat-header-subtitle">Agricultural Assistant</div>
                </div>
              </div>
              <button
                className="chat-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-area" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about crops, soil, regions..."
                disabled={isLoading}
                id="chat-input"
                autoComplete="off"
              />
              <button
                className="chat-send"
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
