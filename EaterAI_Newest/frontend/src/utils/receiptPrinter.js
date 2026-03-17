import { formatCurrency, formatDateTime } from "./formatters";

const buildRowsHtml = (items = []) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px dashed #cbd5e1;">
            <div style="font-weight:700;">${item.name}</div>
            ${item.note ? `<div style="margin-top:4px;font-size:12px;color:#64748b;">${item.note}</div>` : ""}
          </td>
          <td style="padding:10px 0;border-bottom:1px dashed #cbd5e1;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px dashed #cbd5e1;text-align:right;">${formatCurrency(item.total)}</td>
        </tr>
      `
    )
    .join("");

export const printReceipt = ({
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
}) => {
  const printWindow = window.open("", "_blank", "width=420,height=760");

  if (!printWindow) {
    return false;
  }

  const paymentSection =
    paymentMethod === "CASH"
      ? `
        <div style="margin-top:18px;border-top:1px dashed #cbd5e1;padding-top:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#64748b;">Payment method</span>
            <strong>Cash</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#64748b;">Cash received</span>
            <strong>${formatCurrency(cashReceived || 0)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;">Change due</span>
            <strong>${formatCurrency(changeDue || 0)}</strong>
          </div>
        </div>
      `
      : paymentMethod === "CARD"
        ? `
        <div style="margin-top:18px;border-top:1px dashed #cbd5e1;padding-top:14px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;">Payment method</span>
            <strong>Card</strong>
          </div>
        </div>
      `
      : "";

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body style="font-family:'Courier New',monospace;background:#fff;padding:18px;color:#0f172a;">
        <div style="max-width:360px;margin:0 auto;">
          <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
          <div style="font-size:28px;font-weight:700;letter-spacing:0.08em;">TableMind AI</div>
          <div style="margin-top:8px;font-size:18px;font-weight:700;">${title}</div>
          <div style="margin-top:6px;font-size:12px;color:#64748b;">${subtitle || formatDateTime(new Date())}</div>
          ${
            receiptNumber
              ? `<div style="margin-top:8px;font-size:13px;font-weight:700;">Bill No. ${String(receiptNumber).padStart(3, "0")}${receiptDate ? ` | ${receiptDate}` : ""}</div>`
              : ""
          }
        </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr>
                <th style="text-align:left;padding-bottom:10px;">Item</th>
                <th style="text-align:center;padding-bottom:10px;">Qty</th>
                <th style="text-align:right;padding-bottom:10px;">Total</th>
              </tr>
            </thead>
            <tbody>${buildRowsHtml(items)}</tbody>
          </table>
          <div style="margin-top:18px;border-top:2px solid #0f172a;padding-top:12px;">
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;">
              <span>Grand Total</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
          ${paymentSection}
          ${
            footerNote
              ? `<div style="margin-top:18px;font-size:12px;color:#64748b;text-align:center;">${footerNote}</div>`
              : ""
          }
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};
