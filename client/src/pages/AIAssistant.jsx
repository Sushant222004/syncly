import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

function AIAssistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmedMessage }]);

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to get an AI response.");
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Syncly AI</h1>
          <p className="text-sm text-gray-400">Your personal AI assistant</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setError("");
            setMessage("");
          }}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm transition hover:bg-gray-800"
        >
          + New Chat
        </button>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-lg text-center">
              <div className="mb-4 text-5xl">🤖</div>
              <h2 className="mb-2 text-2xl font-semibold">
                Welcome to Syncly AI
              </h2>
              <p className="text-gray-400">
                Ask me a question, explore an idea, or get help with your work.
              </p>
            </div>
          </div>
        )}

        {messages.map((item, index) => (
          <div
            key={index}
            className={`flex ${
              item.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 ${
                item.role === "user"
                  ? "bg-blue-600"
                  : "border border-gray-700 bg-gray-900"
              }`}
            >
              {item.role === "assistant" ? (
                <ReactMarkdown>{item.text}</ReactMarkdown>
              ) : (
                item.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-400">Syncly AI is thinking...</div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </main>

      <form className="border-t border-gray-800 p-4" onSubmit={handleSend}>
        <div className="mx-auto flex max-w-3xl gap-3">
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask Syncly AI anything..."
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIAssistant;
