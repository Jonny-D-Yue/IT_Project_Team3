import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import OrderTable from "../../components/staff/OrderTable";
import OrderStatusActions from "../../components/staff/OrderStatusActions";
import TableOverviewCard from "../../components/staff/TableOverviewCard";
import { getOrdersByTableRequest, getOrdersRequest, getTableOverviewRequest, updateOrderStatusRequest, updateTablePaymentStatusRequest } from "../../api/orderApi";
import { ORDER_STATUSES } from "../../utils/constants";
import { useSocket } from "../../hooks/useSocket";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";
import { printReceipt } from "../../utils/receiptPrinter";
import { formatDateTime } from "../../utils/formatters";

export default function StaffDashboardPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [tableOverview, setTableOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("tables");

  const loadDashboard = async () => {
    const [ordersResponse, overviewResponse] = await Promise.all([
      getOrdersRequest(),
      getTableOverviewRequest(),
    ]);
    setOrders(ordersResponse);
    setTableOverview(overviewResponse);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadDashboard();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useSocket({
    enabled: true,
    events: {
      new_order: () => loadDashboard(),
      order_updated: () => loadDashboard(),
      order_payment_updated: () => loadDashboard(),
      table_payment_updated: () => loadDashboard(),
      table_overview_updated: () => loadDashboard(),
    },
  });

  const filteredOrders = useMemo(
    () =>
      (statusFilter ? orders.filter((order) => order.status === statusFilter) : orders).filter(
        (order) => order.paymentStatus !== "PAID"
      ),
    [orders, statusFilter]
  );
  const firstEmptyTable = useMemo(
    () => tableOverview?.tables?.find((table) => table.tableStatus === "EMPTY") || null,
    [tableOverview]
  );

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

  const handleMarkTablePaid = async (tableNumber) => {
    try {
      await updateTablePaymentStatusRequest(tableNumber, { paymentStatus: "PAID" });
      await loadDashboard();
      showToast({
        title: "Table settled",
        message: `Table ${tableNumber} is now marked as paid and released.`,
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Payment update failed",
        message: getApiErrorMessage(error, "Unable to mark this table as paid."),
        variant: "error",
      });
    }
  };

  const handleQuickPrintTable = async (tableNumber) => {
    try {
      const tableOrders = await getOrdersByTableRequest(tableNumber);
      const printableItems = tableOrders
        .filter((order) => order.paymentStatus !== "PAID")
        .flatMap((order) =>
          order.items.map((item) => ({
            name: item.name,
            quantity: Math.max(0, Number(item.quantity) - Number(item.paidQuantity || 0)),
            total: Number(item.price || 0) * Math.max(0, Number(item.quantity) - Number(item.paidQuantity || 0)),
            note: item.note || "",
          }))
        )
        .filter((item) => item.quantity > 0);

      if (!printableItems.length) {
        showToast({
          title: "Nothing to print",
          message: `Table ${tableNumber} does not have an open bill right now.`,
          variant: "error",
        });
        return;
      }

      const total = printableItems.reduce((sum, item) => sum + item.total, 0);
      const paidReceiptOrder = tableOrders.find((order) => order.receiptNumber);
      const printed = printReceipt({
        title: `Table ${tableNumber} Bill`,
        subtitle: `Quick print ${formatDateTime(new Date())}`,
        items: printableItems,
        total,
        receiptNumber: paidReceiptOrder?.receiptNumber,
        receiptDate: paidReceiptOrder?.receiptDate,
        paymentMethod: paidReceiptOrder?.paymentMethod,
        cashReceived: paidReceiptOrder?.cashReceived,
        changeDue: paidReceiptOrder?.changeDue,
        footerNote: "Staff quick print receipt",
      });

      if (!printed) {
        showToast({
          title: "Print blocked",
          message: "Allow popups in the browser to print receipts.",
          variant: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "Print failed",
        message: getApiErrorMessage(error, "Unable to print this table bill."),
        variant: "error",
      });
    }
  };

  if (loading) {
    return <Loader label="Loading orders..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff Dashboard"
        title="Monitor tables, tickets, and open bills in real time"
        description="Use the table view to manage occupancy and payment. Switch to tickets when the kitchen needs order-level detail."
        actions={
          firstEmptyTable ? (
            <Link
              to={`/staff/tables/${firstEmptyTable.tableNumber}`}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Open Empty Table {firstEmptyTable.tableNumber}
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Occupied tables</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tableOverview?.summary?.occupiedTables || 0}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Awaiting payment</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tableOverview?.summary?.awaitingPaymentTables || 0}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Open bills</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tableOverview?.summary?.openBills || 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "tables" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => setViewMode("tables")}
        >
          Tables
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "orders" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => setViewMode("orders")}
        >
          Tickets
        </button>
      </div>

      {viewMode === "orders" ? (
        <>
          <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${!statusFilter ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => setStatusFilter("")}
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusFilter === status ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {!filteredOrders.length ? (
        <EmptyState title="No orders yet" description="New customer orders will appear here automatically." />
      ) : (
        <>
          <div className="grid gap-4 xl:hidden">
            {filteredOrders.map((order) => (
              <div key={order._id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Table {order.tableNumber}</h3>
                    <p className="text-sm text-slate-500">{order.items.length} items</p>
                  </div>
                  <StatusBadge status={order.source || "CUSTOMER"} />
                </div>
                <OrderStatusActions currentStatus={order.status} onChange={(status) => handleStatusUpdate(order._id, status)} compact />
              </div>
            ))}
          </div>
          <div className="hidden xl:block">
            <OrderTable orders={filteredOrders} />
          </div>
        </>
      )}
        </>
      ) : !tableOverview?.tables?.length ? (
        <EmptyState title="No table data yet" description="Open table sessions and orders will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {tableOverview.tables.map((table) => (
            <TableOverviewCard
              key={table.tableNumber}
              table={{ ...table, onQuickPrint: handleQuickPrintTable }}
              onMarkPaid={handleMarkTablePaid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
