import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import OrderSummary from "../../components/customer/OrderSummary";
import { getRestaurantRequest } from "../../api/restaurantApi";
import { createOrderRequest } from "../../api/orderApi";
import { useCart } from "../../hooks/useCart";
import { useTable } from "../../hooks/useTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { restaurantId, tableNumber, sessionToken } = useTable();
  const { showToast } = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await getRestaurantRequest();
        setRestaurant(response);
      } catch (requestError) {
        setError("Unable to load restaurant settings.");
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      await createOrderRequest({
        restaurantId,
        tableNumber,
        sessionToken,
        items: items.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
          note: item.note,
        })),
        notes,
      });

      clearCart();
      showToast({
        title: "Order placed",
        message: "Your order has been sent to the kitchen.",
        variant: "success",
      });
      navigate("/order-success");
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Unable to place your order.");
      setError(message);
      showToast({
        title: "Order failed",
        message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Preparing checkout..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Checkout"
        title="Send your order to the kitchen"
        description="Double-check your order and include any table-level notes for the staff."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel rounded-[28px] p-6">
          <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Final check</p>
            <p className="mt-2">Your order will be sent for <span className="font-bold text-slate-900">Table {tableNumber}</span>.</p>
          </div>
          <div className="mt-5">
            <Input
              label="Order note"
              placeholder="Example: Bring extra napkins"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <Button className="mt-6 w-full" onClick={handleSubmit} disabled={submitting || !items.length || !restaurant}>
            {submitting ? "Placing order..." : "Place Order"}
          </Button>
        </div>
        <OrderSummary items={items} subtotal={subtotal} taxRate={restaurant?.taxRate || 0.05} />
      </div>
    </div>
  );
}
