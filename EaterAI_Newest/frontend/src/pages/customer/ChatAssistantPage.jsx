import { useEffect } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import ChatBox from "../../components/customer/ChatBox";
import Button from "../../components/common/Button";
import { useCart } from "../../hooks/useCart";
import { QUICK_PROMPTS } from "../../utils/constants";
import { useChat } from "../../hooks/useChat";
import { useTable } from "../../hooks/useTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function ChatAssistantPage() {
  const { messages, loading, sendMessage, loadHistory } = useChat();
  const { addItem, updateNote } = useCart();
  const { restaurantId, sessionToken, tableNumber } = useTable();
  const { showToast } = useToast();

  useEffect(() => {
    if (!restaurantId || !sessionToken || !tableNumber) {
      return;
    }

    loadHistory({ restaurantId, sessionToken, tableNumber }).catch(() => {});
  }, [loadHistory, restaurantId, sessionToken, tableNumber]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Assistant"
        title="Ask for practical menu guidance"
        description="Get menu-aware suggestions for budget, calories, spice level, and drinks without leaving your table."
        actions={
          <Link to="/menu">
            <Button variant="secondary" className="w-full sm:w-auto">Back to Menu</Button>
          </Link>
        }
      />
      <div className="rounded-[24px] border border-amber-100 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-[0_16px_30px_rgba(125,59,12,0.05)]">
        Ask naturally, then tap the recommended dishes to add them straight into your cart.
      </div>
      <ChatBox
        messages={messages}
        loading={loading}
        quickPrompts={QUICK_PROMPTS}
        onSend={async (message) => {
          try {
            await sendMessage({ restaurantId, sessionToken, tableNumber, message });
          } catch (error) {
            showToast({
              title: "Assistant unavailable",
              message: getApiErrorMessage(error, "Unable to send that message right now."),
              variant: "error",
            });
          }
        }}
        onAddToCart={(item, quantity, note) => {
          addItem(item, quantity);
          if (note?.trim()) {
            updateNote(item._id, note.trim());
          }
          showToast({
            title: "Added to cart",
            message: `${item.name} x${quantity} has been added from the AI recommendation.`,
            variant: "success",
          });
        }}
      />
    </div>
  );
}
