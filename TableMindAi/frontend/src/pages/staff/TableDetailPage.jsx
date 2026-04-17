import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import CashCheckoutModal from "../../components/staff/CashCheckoutModal";
import { getMenuRequest } from "../../api/menuApi";
import {
  createSplitBillRequest,
  createStaffOrderRequest,
  getOrdersByTableRequest,
  getSplitBillsByTableRequest,
  getTableOverviewRequest,
  moveTableOrdersRequest,
  updateOrderPaymentStatusRequest,
  updateSplitBillStatusRequest,
  updateTablePaymentStatusRequest,
} from "../../api/orderApi";
import { useSocket } from "../../hooks/useSocket";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";
import { printReceipt } from "../../utils/receiptPrinter";

const roundItemTotal = (unitPrice, quantity) =>
  Number((Number(unitPrice || 0) * Number(quantity || 0)).toFixed(2));
const QUICK_ITEM_NOTES = ["Less spicy", "No onion", "No ice", "Extra sauce"];
const QUICK_ORDER_NOTES = ["Serve together", "Rush order", "Allergy check", "Birthday table"];

export default function TableDetailPage() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [overview, setOverview] = useState(null);
  const [allTables, setAllTables] = useState([]);
  const [splitBills, setSplitBills] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [creatingSplit, setCreatingSplit] = useState(false);
  const [submittingWaiterOrder, setSubmittingWaiterOrder] = useState(false);
  const [targetTableNumber, setTargetTableNumber] = useState("");
  const [selectedItemQuantities, setSelectedItemQuantities] = useState({});
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [waiterQuantity, setWaiterQuantity] = useState(1);
  const [waiterItemNote, setWaiterItemNote] = useState("");
  const [waiterOrderNote, setWaiterOrderNote] = useState("");
  const [waiterCartItems, setWaiterCartItems] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [activeMenuCategory, setActiveMenuCategory] = useState("All");
  const [cashCheckoutState, setCashCheckoutState] = useState({
    open: false,
    mode: null,
    orderId: null,
    splitBillId: null,
    title: "",
    amountDue: 0,
    busy: false,
  });

  const loadTable = async () => {
    const [ordersResponse, overviewResponse, splitBillsResponse, menuItemsResponse] = await Promise.all([
      getOrdersByTableRequest(tableNumber),
      getTableOverviewRequest(),
      getSplitBillsByTableRequest(tableNumber),
      getMenuRequest(),
    ]);
    setOrders(ordersResponse);
    setAllTables(overviewResponse.tables || []);
    setOverview(overviewResponse.tables.find((item) => String(item.tableNumber) === String(tableNumber)) || null);
    setSplitBills(splitBillsResponse);
    setMenuItems(menuItemsResponse.filter((item) => item.isAvailable));
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadTable();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [tableNumber]);

  useSocket({
    enabled: true,
    events: {
      new_order: () => loadTable(),
      order_updated: () => loadTable(),
      order_payment_updated: () => loadTable(),
      table_payment_updated: () => loadTable(),
      table_overview_updated: () => loadTable(),
      table_moved: () => loadTable(),
      split_bill_updated: () => loadTable(),
    },
  });

  const unpaidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus !== "PAID"),
    [orders]
  );
  const openSplitBills = useMemo(() => splitBills.filter((splitBill) => splitBill.status === "OPEN"), [splitBills]);
  const emptyTables = useMemo(
    () =>
      allTables.filter(
        (table) =>
          String(table.tableNumber) !== String(tableNumber) &&
          table.tableStatus === "EMPTY"
      ),
    [allTables, tableNumber]
  );
  const unpaidItemRows = useMemo(
    () =>
      unpaidOrders.flatMap((order) =>
        order.items
          .map((item, index) => ({
            key: `${order._id}-${index}`,
            orderId: order._id,
            itemIndex: index,
            createdAt: order.createdAt,
            name: item.name,
            quantity: Math.max(0, Number(item.quantity) - Number(item.paidQuantity || 0)),
            unitPrice: item.price,
            note: item.note || "",
          }))
          .filter((item) => item.quantity > 0)
      ),
    [unpaidOrders]
  );
  const totalOpenBill = useMemo(
    () => unpaidItemRows.reduce((sum, item) => sum + roundItemTotal(item.unitPrice, item.quantity), 0),
    [unpaidItemRows]
  );
  const splitSelectionTotal = useMemo(
    () =>
      unpaidItemRows.reduce(
        (sum, item) => sum + roundItemTotal(item.unitPrice, selectedItemQuantities[item.key] || 0),
        0
      ),
    [unpaidItemRows, selectedItemQuantities]
  );
  const splitRemainderTotal = Math.max(0, totalOpenBill - splitSelectionTotal);
  const waiterCartTotal = useMemo(
    () => waiterCartItems.reduce((sum, item) => sum + roundItemTotal(item.price, item.quantity), 0),
    [waiterCartItems]
  );
  const filteredMenuItems = useMemo(() => {
    const keyword = menuSearch.trim().toLowerCase();

    if (!keyword) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      const categoryName = item.category?.name || "";
      return [item.name, item.description, categoryName, ...(item.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [menuItems, menuSearch]);
  const groupedFilteredMenuItems = useMemo(() => {
    const groups = filteredMenuItems.reduce((accumulator, item) => {
      const key = item.category?.name || "Uncategorized";
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    return Object.entries(groups);
  }, [filteredMenuItems]);
  const menuCategories = useMemo(
    () => ["All", ...new Set(filteredMenuItems.map((item) => item.category?.name || "Uncategorized"))],
    [filteredMenuItems]
  );
  const visibleQuickPickGroups = useMemo(() => {
    if (activeMenuCategory === "All") {
      return groupedFilteredMenuItems;
    }

    return groupedFilteredMenuItems.filter(([categoryName]) => categoryName === activeMenuCategory);
  }, [activeMenuCategory, groupedFilteredMenuItems]);

  const handleSplitQuantityChange = (itemKey, value) =>
    setSelectedItemQuantities((current) => ({
      ...current,
      [itemKey]: value,
    }));

  const handleAddWaiterItem = () => {
    const menuItem = menuItems.find((item) => item._id === selectedMenuItemId);

    if (!menuItem) {
      showToast({
        title: "Choose a menu item",
        message: "Pick a dish from the menu before adding it to the table.",
        variant: "error",
      });
      return;
    }

    const quantity = Number(waiterQuantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast({
        title: "Invalid quantity",
        message: "Quantity must be at least 1.",
        variant: "error",
      });
      return;
    }

    setWaiterCartItems((current) => [
      ...current,
      {
        key: `${menuItem._id}-${Date.now()}`,
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        note: waiterItemNote.trim(),
      },
    ]);
    setSelectedMenuItemId("");
    setWaiterQuantity(1);
    setWaiterItemNote("");
  };

  const handleRemoveWaiterItem = (itemKey) =>
    setWaiterCartItems((current) => current.filter((item) => item.key !== itemKey));

  const handleChangeWaiterCartQuantity = (itemKey, delta) =>
    setWaiterCartItems((current) =>
      current
        .map((item) =>
          item.key === itemKey
            ? {
                ...item,
                quantity: Math.max(1, Number(item.quantity) + delta),
              }
            : item
        )
        .filter(Boolean)
    );

  const handleChangeWaiterCartNote = (itemKey, note) =>
    setWaiterCartItems((current) =>
      current.map((item) =>
        item.key === itemKey
          ? {
              ...item,
              note,
            }
          : item
      )
    );

  const applyQuickItemNote = (note) => setWaiterItemNote(note);

  const applyQuickOrderNote = (note) =>
    setWaiterOrderNote((current) => {
      if (!current.trim()) {
        return note;
      }

      return current.includes(note) ? current : `${current}; ${note}`;
    });

  const handleSubmitWaiterOrder = async () => {
    if (!waiterCartItems.length) {
      showToast({
        title: "No items added",
        message: "Add at least one menu item before sending the waiter order.",
        variant: "error",
      });
      return;
    }

    setSubmittingWaiterOrder(true);

    try {
      await createStaffOrderRequest({
        tableNumber: Number(tableNumber),
        items: waiterCartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note,
        })),
        notes: waiterOrderNote,
      });
      setWaiterCartItems([]);
      setWaiterOrderNote("");
      await loadTable();
      showToast({
        title: "Order sent to kitchen",
        message: `Waiter order added to table ${tableNumber}.`,
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Order failed",
        message: getApiErrorMessage(error, "Unable to add this waiter order."),
        variant: "error",
      });
    } finally {
      setSubmittingWaiterOrder(false);
    }
  };

  const printBill = ({
    title,
    items,
    total,
    subtitle,
    receiptNumber,
    receiptDate,
    paymentMethod,
    cashReceived,
    changeDue,
    footerNote,
  }) => {
    const printed = printReceipt({
      title,
      subtitle,
      items,
      total,
      receiptNumber,
      receiptDate,
      paymentMethod,
      cashReceived,
      changeDue,
      footerNote,
    });

    if (!printed) {
      showToast({
        title: "Print blocked",
        message: "Allow popups in the browser to print the bill.",
        variant: "error",
      });
    }
  };

  const handlePrintWholeBill = () => {
    const paidReceiptOrder = orders.find((order) => order.receiptNumber);

    printBill({
      title: `Table ${tableNumber} Bill`,
      subtitle: `Printed ${formatDateTime(new Date())}`,
      items: unpaidItemRows.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        total: roundItemTotal(item.unitPrice, item.quantity),
        note: item.note,
      })),
      total: totalOpenBill,
      receiptNumber: paidReceiptOrder?.receiptNumber,
      receiptDate: paidReceiptOrder?.receiptDate,
      paymentMethod: paidReceiptOrder?.paymentMethod,
      cashReceived: paidReceiptOrder?.cashReceived,
      changeDue: paidReceiptOrder?.changeDue,
      footerNote: "Whole table receipt",
    });
  };

  const handlePrintSelectedSplit = () => {
    const selectedItems = unpaidItemRows
      .filter((item) => Number(selectedItemQuantities[item.key] || 0) > 0)
      .map((item) => ({
        name: item.name,
        quantity: Number(selectedItemQuantities[item.key] || 0),
        total: roundItemTotal(item.unitPrice, selectedItemQuantities[item.key] || 0),
        note: item.note,
      }));

    if (!selectedItems.length) {
      showToast({
        title: "No split selected",
        message: "Choose at least one item to print a split bill.",
        variant: "error",
      });
      return;
    }

    printBill({
      title: `Table ${tableNumber} Split Bill`,
      subtitle: `Selected items only | Printed ${formatDateTime(new Date())}`,
      items: selectedItems,
      total: splitSelectionTotal,
      footerNote: "Temporary split receipt",
    });
  };

  const handleOrderPayment = async (orderId, paymentStatus, paymentPayload = {}) => {
    try {
      await updateOrderPaymentStatusRequest(orderId, { paymentStatus, ...paymentPayload });
      await loadTable();
      showToast({
        title: "Order payment updated",
        message: `Order marked as ${paymentStatus}.`,
        variant: "success",
      });
      return true;
    } catch (error) {
      showToast({
        title: "Payment update failed",
        message: getApiErrorMessage(error, "Unable to update order payment."),
        variant: "error",
      });
      return false;
    }
  };

  const openCashCheckout = ({ mode, orderId = null, splitBillId = null, title, amountDue }) =>
    setCashCheckoutState({
      open: true,
      mode,
      orderId,
      splitBillId,
      title,
      amountDue,
      busy: false,
    });

  const closeCashCheckout = () =>
    setCashCheckoutState({
      open: false,
      mode: null,
      orderId: null,
      splitBillId: null,
      title: "",
      amountDue: 0,
      busy: false,
    });

  const handleSettleTable = async (paymentPayload = {}) => {
    try {
      await updateTablePaymentStatusRequest(tableNumber, { paymentStatus: "PAID", ...paymentPayload });
      await loadTable();
      showToast({
        title: "Table settled",
        message: `Table ${tableNumber} has been marked as fully paid.`,
        variant: "success",
      });
      return true;
    } catch (error) {
      showToast({
        title: "Settle failed",
        message: getApiErrorMessage(error, "Unable to settle this table."),
        variant: "error",
      });
      return false;
    }
  };

  const handleConfirmCashCheckout = async (paymentPayload) => {
    setCashCheckoutState((current) => ({ ...current, busy: true }));

    try {
      if (cashCheckoutState.mode === "table") {
        const success = await handleSettleTable(paymentPayload);
        if (success) {
          closeCashCheckout();
        }
        return;
      }

      if (cashCheckoutState.mode === "order") {
        const success = await handleOrderPayment(cashCheckoutState.orderId, "PAID", paymentPayload);
        if (success) {
          closeCashCheckout();
        }
        return;
      }

      if (cashCheckoutState.mode === "split") {
        const success = await handleUpdateSplitBillStatus(cashCheckoutState.splitBillId, "PAID", paymentPayload);
        if (success) {
          closeCashCheckout();
        }
      }
    } finally {
      setCashCheckoutState((current) => ({ ...current, busy: false }));
    }
  };

  const handleMoveTable = async () => {
    if (!targetTableNumber) {
      showToast({
        title: "Target table required",
        message: "Choose an empty table before moving this bill.",
        variant: "error",
      });
      return;
    }

    setMoving(true);
    try {
      await moveTableOrdersRequest(tableNumber, { targetTableNumber: Number(targetTableNumber) });
      showToast({
        title: "Table moved",
        message: `Open bill moved from table ${tableNumber} to table ${targetTableNumber}.`,
        variant: "success",
      });
      navigate(`/staff/tables/${targetTableNumber}`);
    } catch (error) {
      showToast({
        title: "Move failed",
        message: getApiErrorMessage(error, "Unable to move this table bill."),
        variant: "error",
      });
    } finally {
      setMoving(false);
    }
  };

  const handleCreateSplitBill = async () => {
    const items = unpaidItemRows
      .filter((item) => Number(selectedItemQuantities[item.key] || 0) > 0)
      .map((item) => ({
        orderId: item.orderId,
        itemIndex: item.itemIndex,
        quantity: Number(selectedItemQuantities[item.key] || 0),
      }));

    if (!items.length) {
      showToast({
        title: "No split selected",
        message: "Choose at least one item quantity before creating a split bill.",
        variant: "error",
      });
      return;
    }

    setCreatingSplit(true);
    try {
      await createSplitBillRequest(tableNumber, { items });
      setSelectedItemQuantities({});
      await loadTable();
      showToast({
        title: "Split bill created",
        message: "The split bill is now saved and can be paid later.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Create split failed",
        message: getApiErrorMessage(error, "Unable to create this split bill."),
        variant: "error",
      });
    } finally {
      setCreatingSplit(false);
    }
  };

  const handleUpdateSplitBillStatus = async (splitBillId, status, paymentPayload = {}) => {
    try {
      await updateSplitBillStatusRequest(splitBillId, { status, ...paymentPayload });
      await loadTable();
      showToast({
        title: "Split bill updated",
        message: `Split bill marked as ${status}.`,
        variant: "success",
      });
      return true;
    } catch (error) {
      showToast({
        title: "Split update failed",
        message: getApiErrorMessage(error, "Unable to update this split bill."),
        variant: "error",
      });
      return false;
    }
  };

  const printSavedSplitBill = (splitBill) => {
    printBill({
      title: `Table ${tableNumber} Saved Split Bill`,
      subtitle: `${splitBill.status} | Created ${formatDateTime(splitBill.createdAt)}`,
      items: splitBill.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        total: item.lineTotal,
        note: item.note,
      })),
      total: splitBill.total,
      receiptNumber: splitBill.receiptNumber,
      receiptDate: splitBill.receiptDate,
      paymentMethod: splitBill.paymentMethod,
      cashReceived: splitBill.cashReceived,
      changeDue: splitBill.changeDue,
      footerNote: splitBill.status === "PAID" ? "Paid split receipt" : "Saved split receipt",
    });
  };

  if (loading) {
    return <Loader label="Loading table details..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Table Detail"
        title={`Table ${tableNumber}`}
        description="See the merged open bill, save split bills, or move the whole table to another empty table."
        actions={
          <div className="flex gap-2">
            <StatusBadge status={overview?.tableStatus || "EMPTY"} />
            <StatusBadge status={overview?.paymentStatus || "NO_BILL"} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Waiter order entry</h2>
            <p className="mt-2 text-sm text-slate-500">
              Open this table and add dishes directly from the menu when guests order through a waiter instead of their phones.
            </p>
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(event) => {
                    setMenuSearch(event.target.value);
                    setActiveMenuCategory("All");
                  }}
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 outline-none"
                  placeholder="Search dishes, categories, tags..."
                />
                <div className="flex flex-wrap gap-2">
                  {menuCategories.map((categoryName) => (
                    <button
                      key={categoryName}
                      type="button"
                      onClick={() => setActiveMenuCategory(categoryName)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        activeMenuCategory === categoryName
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {categoryName}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <select
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
                    value={selectedMenuItemId}
                    onChange={(event) => setSelectedMenuItemId(event.target.value)}
                  >
                    <option value="">Select a dish from the menu</option>
                    {visibleQuickPickGroups.map(([categoryName, items]) => (
                      <optgroup key={categoryName} label={categoryName}>
                        {items.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} - {formatCurrency(item.price)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={waiterQuantity}
                    onChange={(event) => setWaiterQuantity(event.target.value)}
                    className="w-full rounded-2xl border border-amber-200 px-4 py-3 outline-none"
                    placeholder="Qty"
                  />
                </div>
                <input
                  type="text"
                  value={waiterItemNote}
                  onChange={(event) => setWaiterItemNote(event.target.value)}
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 outline-none"
                  placeholder="Optional item note, e.g. no onions"
                />
                <div className="flex flex-wrap gap-2">
                  {QUICK_ITEM_NOTES.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => applyQuickItemNote(note)}
                      className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
                    >
                      {note}
                    </button>
                  ))}
                </div>
                <Button onClick={handleAddWaiterItem} className="w-full">
                  Add Item To Waiter Cart
                </Button>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">Quick pick menu</h3>
                    <span className="text-sm text-slate-500">
                      {visibleQuickPickGroups.reduce((sum, [, items]) => sum + items.length, 0)} dishes
                    </span>
                  </div>
                  <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
                    {visibleQuickPickGroups.map(([categoryName, items]) => (
                      <div key={categoryName}>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{categoryName}</p>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => setSelectedMenuItemId(item._id)}
                              className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left ${
                                selectedMenuItemId === item._id
                                  ? "border-amber-400 bg-amber-50"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                {item.description ? (
                                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>
                                ) : null}
                              </div>
                              <span className="whitespace-nowrap font-semibold text-slate-900">
                                {formatCurrency(item.price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!visibleQuickPickGroups.length ? <p className="text-sm text-slate-500">No menu items match this search.</p> : null}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Waiter cart</h3>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(waiterCartTotal)}</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {waiterCartItems.map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <input
                            type="text"
                            value={item.note}
                            onChange={(event) => handleChangeWaiterCartNote(item.key, event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                            placeholder="Edit item note"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleChangeWaiterCartQuantity(item.key, -1)}
                              className="h-8 w-8 rounded-full bg-white text-lg font-bold text-slate-700"
                            >
                              -
                            </button>
                            <span className="min-w-6 text-center font-semibold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleChangeWaiterCartQuantity(item.key, 1)}
                              className="h-8 w-8 rounded-full bg-slate-900 text-lg font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(roundItemTotal(item.price, item.quantity))}
                          </span>
                          <Button variant="secondary" onClick={() => handleRemoveWaiterItem(item.key)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!waiterCartItems.length ? (
                      <p className="text-sm text-slate-500">No waiter items added yet.</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Order note for kitchen</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Use this for whole-order notes like table pacing or allergy reminders.
                  </p>
                </div>
                <textarea
                  rows="8"
                  value={waiterOrderNote}
                  onChange={(event) => setWaiterOrderNote(event.target.value)}
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 outline-none"
                  placeholder="Optional order note"
                />
                <div className="flex flex-wrap gap-2">
                  {QUICK_ORDER_NOTES.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => applyQuickOrderNote(note)}
                      className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      {note}
                    </button>
                  ))}
                </div>
                <Button onClick={handleSubmitWaiterOrder} disabled={submittingWaiterOrder} className="w-full">
                  {submittingWaiterOrder ? "Sending..." : "Send Waiter Order To Table"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Split bill by order</h2>
            <p className="mt-2 text-sm text-slate-500">
              If 3 people use 3 phones at the same table, each order stays separate here but still belongs to one table bill.
            </p>
            <div className="mt-5 space-y-4">
              {unpaidOrders.map((order) => (
                <div key={order._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge status={order.source || "CUSTOMER"} />
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.paymentStatus || "UNPAID"} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Order total</p>
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    {order.items.map((item) => (
                      <div key={`${order._id}-${item.menuItemId}-${item.name}`} className="flex justify-between gap-3">
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        variant={order.paymentStatus === "PAID" ? "secondary" : "primary"}
                      onClick={() =>
                        order.paymentStatus === "PAID"
                          ? handleOrderPayment(order._id, "UNPAID")
                          : openCashCheckout({
                              mode: "order",
                              orderId: order._id,
                              title: `Payment for order at table ${tableNumber}`,
                              amountDue: order.total,
                            })
                      }
                      >
                      {order.paymentStatus === "PAID" ? "Mark Unpaid" : "Mark Paid"}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/staff/orders/${order._id}`)}>
                      Open Ticket
                    </Button>
                  </div>
                </div>
              ))}
              {!unpaidOrders.length ? <p className="text-sm text-slate-500">No open orders found for this table. Paid orders are now in History.</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Merged table bill</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Open bill total</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalOpenBill)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Open orders</span>
                <span className="font-semibold text-slate-900">{overview?.unpaidOrdersCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active sessions</span>
                <span className="font-semibold text-slate-900">{overview?.activeSessionCount || 0}</span>
              </div>
            </div>
            <div className="mt-5">
              <Button
                onClick={() =>
                  openCashCheckout({
                    mode: "table",
                    title: `Payment for table ${tableNumber}`,
                    amountDue: totalOpenBill,
                  })
                }
                disabled={!overview || !["UNPAID", "PARTIALLY_PAID"].includes(overview.paymentStatus)}
                className="w-full"
              >
                Mark Whole Table Paid
              </Button>
            </div>
            <div className="mt-3">
              <Button variant="secondary" onClick={handlePrintWholeBill} className="w-full">
                Print Whole Table Bill
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Move open bill to another table</h3>
            <p className="mt-2 text-sm text-slate-500">
              Use this when guests switch seats. Only open unpaid orders and active sessions are moved.
            </p>
            <div className="mt-4 space-y-3">
              <select
                className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
                value={targetTableNumber}
                onChange={(event) => setTargetTableNumber(event.target.value)}
              >
                <option value="">Select an empty table</option>
                {emptyTables.map((table) => (
                  <option key={table.tableNumber} value={table.tableNumber}>
                    Table {table.tableNumber}
                  </option>
                ))}
              </select>
              <Button onClick={handleMoveTable} disabled={moving} className="w-full">
                {moving ? "Moving..." : "Move Table Bill"}
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Split bill by item</h3>
            <p className="mt-2 text-sm text-slate-500">
              Save split bills and mark them paid later. This updates the remaining balance of the table.
            </p>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {unpaidItemRows.map((item) => (
                <label key={item.key} className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.name} x {item.quantity}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    {item.note ? <p className="text-xs text-slate-500">Note: {item.note}</p> : null}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={selectedItemQuantities[item.key] || 0}
                      onChange={(event) => handleSplitQuantityChange(item.key, event.target.value)}
                      className="w-full rounded-xl border border-amber-200 px-3 py-2 text-center outline-none"
                    />
                  </div>
                  <span className="w-24 text-right font-semibold text-slate-900">
                    {formatCurrency(roundItemTotal(item.unitPrice, selectedItemQuantities[item.key] || 0))}
                  </span>
                </label>
              ))}
              {!unpaidItemRows.length ? <p className="text-sm text-slate-500">No unpaid items to split.</p> : null}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected split</span>
                <span className="font-semibold text-slate-900">{formatCurrency(splitSelectionTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining table bill</span>
                <span className="font-semibold text-slate-900">{formatCurrency(splitRemainderTotal)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" onClick={() => setSelectedItemQuantities({})} className="flex-1">
                Clear
              </Button>
              <Button onClick={handleCreateSplitBill} disabled={creatingSplit} className="flex-1">
                {creatingSplit ? "Creating..." : "Save Split Bill"}
              </Button>
              <Button onClick={handlePrintSelectedSplit} className="flex-1">
                Print Split Bill
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Saved split bills</h3>
            <div className="mt-4 space-y-3">
              {openSplitBills.map((splitBill) => (
                <div key={splitBill._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{formatDateTime(splitBill.createdAt)}</p>
                      <div className="mt-2">
                        <StatusBadge status={splitBill.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Split total</p>
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(splitBill.total)}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    {splitBill.items.map((item, index) => (
                      <div key={`${splitBill._id}-${index}`} className="flex justify-between gap-3">
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => printSavedSplitBill(splitBill)}>
                      Print
                    </Button>
                    <Button
                      onClick={() =>
                        openCashCheckout({
                          mode: "split",
                          splitBillId: splitBill._id,
                          title: `Payment for split bill at table ${tableNumber}`,
                          amountDue: splitBill.total,
                        })
                      }
                      disabled={splitBill.status !== "OPEN"}
                    >
                      Mark Paid
                    </Button>
                    <Button variant="secondary" onClick={() => handleUpdateSplitBillStatus(splitBill._id, "VOID")} disabled={splitBill.status !== "OPEN"}>
                      Void
                    </Button>
                  </div>
                </div>
              ))}
              {!openSplitBills.length ? <p className="text-sm text-slate-500">No open split bills. Paid split bills are now in History.</p> : null}
            </div>
          </div>
        </div>
      </div>
      <CashCheckoutModal
        open={cashCheckoutState.open}
        title={cashCheckoutState.title}
        amountDue={cashCheckoutState.amountDue}
        confirmLabel="Confirm Payment"
        busy={cashCheckoutState.busy}
        onClose={closeCashCheckout}
        onConfirm={handleConfirmCashCheckout}
      />
    </div>
  );
}
