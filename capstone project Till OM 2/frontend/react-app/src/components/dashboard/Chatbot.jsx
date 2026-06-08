import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const SESSION_ID = uuidv4(); // unique session per page load

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            from: "bot",
            text: "Hello! I'm your shipment assistant. You can ask me \"Where is my shipment?\" or \"Track SHP-XXXXX\".",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg = { from: "user", text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/chatbot/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: trimmed, sessionId: SESSION_ID }),
            });

            const data = await res.json();
            const botMsg = {
                from: "bot",
                text: data.reply || "Sorry, something went wrong.",
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { from: "bot", text: "⚠️ Could not connect to the assistant. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                style={styles.fab}
                title="Chat with Assistant"
            >
                {isOpen ? "✕" : "💬"}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={styles.chatWindow}>
                    {/* Header */}
                    <div style={styles.header}>
                        <span>🚚 Shipment Assistant</span>
                        <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>✕</button>
                    </div>

                    {/* Messages */}
                    <div style={styles.messagesContainer}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.messageBubble,
                                    alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                                    backgroundColor: msg.from === "user" ? "#4f46e5" : "#f1f5f9",
                                    color: msg.from === "user" ? "#fff" : "#1e293b",
                                }}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ ...styles.messageBubble, alignSelf: "flex-start", backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
                                Typing...
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div style={styles.inputArea}>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={styles.input}
                            disabled={loading}
                        />
                        <button onClick={sendMessage} style={styles.sendBtn} disabled={loading}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const styles = {
    fab: {
        position: "fixed",
        bottom: "28px",
        right: "28px",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        backgroundColor: "#4f46e5",
        color: "#fff",
        fontSize: "22px",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(79,70,229,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    chatWindow: {
        position: "fixed",
        bottom: "96px",
        right: "28px",
        width: "340px",
        height: "460px",
        borderRadius: "16px",
        backgroundColor: "#fff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
        fontFamily: "sans-serif",
    },
    header: {
        backgroundColor: "#4f46e5",
        color: "#fff",
        padding: "14px 16px",
        fontWeight: "600",
        fontSize: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    closeBtn: {
        background: "none",
        border: "none",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer",
    },
    messagesContainer: {
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    messageBubble: {
        maxWidth: "80%",
        padding: "10px 14px",
        borderRadius: "12px",
        fontSize: "14px",
        lineHeight: "1.5",
        wordBreak: "break-word",
    },
    inputArea: {
        display: "flex",
        padding: "10px 12px",
        borderTop: "1px solid #e2e8f0",
        gap: "8px",
        backgroundColor: "#f8fafc",
    },
    input: {
        flex: 1,
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "14px",
        outline: "none",
    },
    sendBtn: {
        backgroundColor: "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "16px",
        cursor: "pointer",
    },
};

export default Chatbot;