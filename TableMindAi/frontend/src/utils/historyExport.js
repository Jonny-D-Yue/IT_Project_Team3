import { formatCurrency, formatDateTime } from "./formatters";

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const exportHistoryEntriesToCsv = ({ periodLabel, entries = [] }) => {
  const rows = [
    ["Period", periodLabel],
    [],
    ["Type", "Table", "Paid At", "Payment Method", "Receipt", "Status", "Item Count", "Total", "Notes"],
    ...entries.map((entry) => [
      entry.sourceType,
      entry.tableNumber,
      formatDateTime(entry.paidAt),
      entry.paymentMethod || "",
      entry.receiptNumber ? String(entry.receiptNumber).padStart(3, "0") : "",
      entry.status || "",
      entry.itemCount || 0,
      Number(entry.total || 0).toFixed(2),
      entry.notes || "",
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(periodLabel || "history").replace(/[^\w-]+/g, "_").toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printHistoryReport = ({ periodLabel, summary, entries = [] }) => {
  const printWindow = window.open("", "_blank", "width=960,height=720");

  if (!printWindow) {
    return false;
  }

  const rowsHtml = entries
    .map(
      (entry) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.sourceType}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">Table ${entry.tableNumber}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${formatDateTime(entry.paidAt)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.paymentMethod || "-"}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.receiptNumber ? String(entry.receiptNumber).padStart(3, "0") : "-"}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.itemCount || 0}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(entry.total || 0)}</td>
        </tr>
      `
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>${periodLabel} Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; color:#0f172a; padding:24px;">
        <div style="max-width:980px; margin:0 auto;">
          <h1 style="margin:0 0 8px;">TableMind Billing Report</h1>
          <p style="margin:0 0 20px; color:#475569;">${periodLabel}</p>
          <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; margin-bottom:20px;">
            <div style="background:#f8fafc; padding:16px; border-radius:16px;">
              <div style="font-size:12px; color:#64748b;">Revenue</div>
              <div style="font-size:24px; font-weight:700;">${formatCurrency(summary?.revenue || 0)}</div>
            </div>
            <div style="background:#f8fafc; padding:16px; border-radius:16px;">
              <div style="font-size:12px; color:#64748b;">Entries</div>
              <div style="font-size:24px; font-weight:700;">${summary?.entriesCount || 0}</div>
            </div>
            <div style="background:#f8fafc; padding:16px; border-radius:16px;">
              <div style="font-size:12px; color:#64748b;">Orders</div>
              <div style="font-size:24px; font-weight:700;">${summary?.orderCount || 0}</div>
            </div>
            <div style="background:#f8fafc; padding:16px; border-radius:16px;">
              <div style="font-size:12px; color:#64748b;">Split Bills</div>
              <div style="font-size:24px; font-weight:700;">${summary?.splitBillCount || 0}</div>
            </div>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px; text-align:left;">Type</th>
                <th style="padding:10px; text-align:left;">Table</th>
                <th style="padding:10px; text-align:left;">Paid At</th>
                <th style="padding:10px; text-align:left;">Method</th>
                <th style="padding:10px; text-align:left;">Receipt</th>
                <th style="padding:10px; text-align:right;">Items</th>
                <th style="padding:10px; text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};
