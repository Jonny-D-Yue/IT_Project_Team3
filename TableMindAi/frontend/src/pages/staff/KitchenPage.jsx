import { useEffect, useMemo, useState } from "react";

import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import KitchenQueue from "../../components/staff/KitchenQueue";
import KitchenTableGroupCard from "../../components/staff/KitchenTableGroupCard";
import OrderStatusActions from "../../components/staff/OrderStatusActions";
import { getOrdersRequest, updateOrderStatusRequest } from "../../api/orderApi";
import { useSocket } from "../../hooks/useSocket";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function KitchenPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("tables");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await getOrdersRequest();
        setOrders(response);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  useSocket({
    enabled: true,
    events: {
      new_order: (order) => setOrders((current) => [order, ...current]),
      order_updated: (updatedOrder) =>
        setOrders((current) =>
          current.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
        ),
      table_moved: () =>
        getOrdersRequest().then(setOrders).catch(() => {}),
    },
  });

  const preparingOrders = useMemo(
    () =>
      orders
        .filter((order) => ["NEW", "PREPARING"].includes(order.status))
        .sort((left, right) => {
          if ((left.source || "CUSTOMER") !== (right.source || "CUSTOMER")) {
            return (left.source || "CUSTOMER") === "WAITER" ? -1 : 1;
          }

          return new Date(right.createdAt) - new Date(left.createdAt);
        }),
    [orders]
  );
  const readyOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === "READY")
        .sort((left, right) => {
          if ((left.source || "CUSTOMER") !== (right.source || "CUSTOMER")) {
            return (left.source || "CUSTOMER") === "WAITER" ? -1 : 1;
          }

          return new Date(right.createdAt) - new Date(left.createdAt);
        }),
    [orders]
  );
  const groupedKitchenTables = useMemo(() => {
    const activeOrders = orders.filter((order) => ["NEW", "PREPARING", "READY"].includes(order.status));
    const grouped = activeOrders.reduce((accumulator, order) => {
      const key = order.tableNumber;
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(order);
      return accumulator;
    }, {});

    return Object.values(grouped)
      .map((groupOrders) => {
        const mergedItemsMap = new Map();

        groupOrders.forEach((order) => {
          order.items.forEach((item) => {
            const current = mergedItemsMap.get(item.name) || {
              name: item.name,
              quantity: 0,
              notes: [],
              orderCount: 0,
            };

            current.quantity += item.quantity;
            current.orderCount += 1;
            if (item.note) {
              current.notes.push(item.note);
            }
            mergedItemsMap.set(item.name, current);
          });
        });

        return {
          tableNumber: groupOrders[0].tableNumber,
          latestCreatedAt: groupOrders[0].createdAt,
          statuses: [...new Set(groupOrders.map((order) => order.status))],
          mergedItems: [...mergedItemsMap.values()],
          orders: groupOrders.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
        };
      })
      .sort((left, right) => left.tableNumber - right.tableNumber);
  }, [orders]);

  const handleStatusUpdate = async (orderId, status) => {
    const previousOrders = orders;

    setOrders((current) =>
      current.map((order) => (order._id === orderId ? { ...order, status } : order))
    );

    try {
      const updatedOrder = await updateOrderStatusRequest(orderId, { status });
      setOrders((current) =>
        current.map((order) => (order._id === orderId ? updatedOrder : order))
      );
      showToast({
        title: "Status updated",
        message: `Order moved to ${status}.`,
        variant: "success",
      });
    } catch (error) {
      setOrders(previousOrders);
      showToast({
        title: "Update failed",
        message: getApiErrorMessage(error, "Unable to update order status."),
        variant: "error",
      });
    }
  };

  if (loading) {
    return <Loader label="Loading kitchen queue..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kitchen View"
        title="Focus on tables and kitchen tickets"
        description="Switch between classic ticket lanes and merged table tickets so the kitchen can cook by table when needed."
      />
      <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "tables" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => setViewMode("tables")}
        >
          By Table
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "tickets" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => setViewMode("tickets")}
        >
          By Ticket
        </button>
      </div>
      {viewMode === "tables" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {groupedKitchenTables.map((group) => (
            <KitchenTableGroupCard key={group.tableNumber} group={group} onUpdateOrderStatus={handleStatusUpdate} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <KitchenQueue
            title="Preparing Queue"
            orders={preparingOrders}
            footerRenderer={(order) => (
              <OrderStatusActions currentStatus={order.status} onChange={(status) => handleStatusUpdate(order._id, status)} compact />
            )}
          />
          <KitchenQueue
            title="Ready to Serve"
            orders={readyOrders}
            footerRenderer={(order) => (
              <OrderStatusActions currentStatus={order.status} onChange={(status) => handleStatusUpdate(order._id, status)} compact />
            )}
          />
        </div>
      )}
    </div>
  );
}
