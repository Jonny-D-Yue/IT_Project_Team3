import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";
import ChatMessageBubble from "./ChatMessageBubble";

export default function ChatBox({ messages, loading, quickPrompts, onSend, onAddToCart }) {
  const [value, setValue] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, loading]);

  const submitMessage = async (message) => {
    if (!message.trim()) {
      return;
    }

    setValue("");
    await onSend(message);
  };

  return (
    <div className="panel rounded-[32px] p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            className="rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800"
            onClick={() => submitMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <div ref={messagesRef} className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-[24px] bg-amber-50/70 p-4">
        {messages.length ? (
          messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} onAddToCart={onAddToCart} />
          ))
        ) : (
          <div className="m-auto max-w-sm text-center text-sm text-slate-500">
            Ask about budget, calories, spice level, drinks, allergies, or ask for a waiter-style recommendation.
          </div>
        )}
        {loading ? <ChatMessageBubble message={{ role: "assistant", content: "Thinking..." }} /> : null}
      </div>
      <form
        className="mt-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(value);
        }}
      >
        <input
          className="flex-1 rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
          placeholder="Ask what fits your mood..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </div>
  );
}
