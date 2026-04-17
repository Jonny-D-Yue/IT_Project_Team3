import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import CashCheckoutModal from "../../components/staff/CashCheckoutModal";
import OrderStatusActions from "../../components/staff/OrderStatusActions";
import { getOrderRequest, updateOrderPaymentStatusRequest, updateOrderStatusRequest } from "../../api/orderApi";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await getOrderRequest(id);
        setOrder(response);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    const previousOrder = order;

    setOrder((current) => ({ ...current, status }));

    try {
      const updatedOrder = await updateOrderStatusRequest(id, { status });
      setOrder(updatedOrder);
      showToast({
        title: "Status updated",
        message: `Order moved to ${status}.`,
        variant: "success",
      });
    } catch (error) {
      setOrder(previousOrder);
      showToast({
        title: "Update failed",
        message: getApiErrorMessage(error, "Unable to update order status."),
        variant: "error",
      });
    }
  };

  const handlePaymentUpdate = async (paymentStatus, paymentPayload = {}) => {
    const previousOrder = order;
    setOrder((current) => ({ ...current, paymentStatus }));

    try {
      const updatedOrder = await updateOrderPaymentStatusRequest(id, { paymentStatus, ...paymentPayload });
      setOrder(updatedOrder);
      showToast({
        title: "Payment updated",
        message: `Order marked as ${paymentStatus}.`,
        variant: "success",
      });
      return true;
    } catch (error) {
      setOrder(previousOrder);
      showToast({
        title: "Payment update failed",
        message: getApiErrorMessage(error, "Unable to update payment status."),
        variant: "error",
      });
      return false;
    }
  };

  const handleCashCheckout = async (paymentPayload) => {
    setPaymentBusy(true);
    try {
      const success = await handlePaymentUpdate("PAID", paymentPayload);
      if (success) {
        setCashModalOpen(false);
      }
    } finally {
      setPaymentBusy(false);
    }
  };

  if (loading) {
    return <Loader label="Loading order details..." />;
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order Detail"
        title={`Table ${order.tableNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={order.source || "CUSTOMER"} />
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus || "UNPAID"} />
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Items</h2>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div key={`${order._id}-${item.menuItemId}`} className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {item.name} x {item.quantity}
                  </p>
                  {item.note ? <p className="mt-1 text-sm text-slate-500">Note: {item.note}</p> : null}
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          {order.notes ? <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-slate-700">Order note: {order.notes}</p> : null}
        </div>
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Totals</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-semibold">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Update Status</h3>
            <div className="mt-4">
              <OrderStatusActions currentStatus={order.status} onChange={handleStatusUpdate} />
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Payment</h3>
            <div className="mt-4 flex gap-3">
              <button
                className={`rounded-2xl px-4 py-3 font-semibold ${order.paymentStatus === "UNPAID" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                onClick={() => handlePaymentUpdate("UNPAID")}
              >
                Unpaid
              </button>
              <button
                className={`rounded-2xl px-4 py-3 font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
                onClick={() => setCashModalOpen(true)}
              >
                Paid
              </button>
            </div>
            {order.paidAt ? <p className="mt-3 text-sm text-slate-500">Paid at {formatDateTime(order.paidAt)}</p> : null}
          </div>
        </div>
      </div>
      <CashCheckoutModal
        open={cashModalOpen}
        title={`Payment for table ${order.tableNumber}`}
        amountDue={order.total}
        confirmLabel="Confirm Order Paid"
        busy={paymentBusy}
        onClose={() => setCashModalOpen(false)}
        onConfirm={handleCashCheckout}
      />
    </div>
  );
}
