import { createContext, useCallback, useState } from "react";

import { getChatHistoryRequest, sendChatRequest } from "../api/chatApi";

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async ({ restaurantId, sessionToken, tableNumber, message }) => {
    const nextUserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((currentMessages) => [...currentMessages, nextUserMessage]);
    setLoading(true);

    try {
      const response = await sendChatRequest({
        restaurantId,
        sessionToken,
        tableNumber,
        message,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          recommendedItems: response.recommendedItems || [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async ({ restaurantId, sessionToken, tableNumber }) => {
    const history = await getChatHistoryRequest({ restaurantId, sessionToken, tableNumber });
    setMessages(history);
    return history;
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        sendMessage,
        loadHistory,
        clearMessages,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
