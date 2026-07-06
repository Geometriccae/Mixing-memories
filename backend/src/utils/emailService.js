const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function isEmailConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
}

function orderDisplayId(order) {
  const n = order.orderNumber != null ? String(order.orderNumber).trim() : "";
  if (n) return n;
  const id = order._id ? String(order._id) : "";
  return id ? `MM-${id.slice(-8).toUpperCase()}` : "—";
}

function formatMoney(n) {
  return `₹${Number(n).toFixed(2)}`;
}

function formatAddress(addr) {
  if (!addr) return "—";
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const p = String(addr.phone || "").trim();
  const p2 = String(addr.phoneAlt || "").trim();
  if (p) parts.push(`Mob: ${p}`);
  if (p2) parts.push(`Alt: ${p2}`);
  return parts.join(", ") || "—";
}

function itemsTableHtml(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<p>No items listed.</p>";
  }
  const rows = items
    .map((item) => {
      const qty = Math.floor(Number(item.quantity) || 0);
      const price = Number(item.price) || 0;
      const lineTotal = qty * price;
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.name || "—")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(lineTotal)}</td>
      </tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#ecfdf5;">
        <th style="padding:8px 12px;text-align:left;">Item</th>
        <th style="padding:8px 12px;text-align:center;">Qty</th>
        <th style="padding:8px 12px;text-align:right;">Price</th>
        <th style="padding:8px 12px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="background:#29968c;padding:24px 28px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;">The Royal Oven</h1>
      <p style="margin:6px 0 0;color:#d1fae5;font-size:14px;">Mixing Memories</p>
    </div>
    <div style="padding:28px;">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#64748b;">
        Questions? Reply to this email or contact us at
        <a href="mailto:${escapeHtml(env.smtpFromEmail)}" style="color:#29968c;">${escapeHtml(env.smtpFromEmail)}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendMail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP not configured — skipping:", subject);
    return;
  }
  await transport.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
  });
}

function orderSummaryBlock(order) {
  const id = orderDisplayId(order);
  return `
    <p style="font-size:15px;line-height:1.6;">Hi <strong>${escapeHtml(order.customerName || "Customer")}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;"><strong>Order ID:</strong> ${escapeHtml(id)}</p>
    <p style="font-size:15px;line-height:1.6;"><strong>Delivery address:</strong><br/>${escapeHtml(formatAddress(order.shippingAddress))}</p>
    ${itemsTableHtml(order.items)}
    <p style="font-size:16px;font-weight:bold;text-align:right;margin-top:16px;">Total: ${formatMoney(order.totalAmount)}</p>
  `;
}

/** Customer confirmation + admin alert when payment succeeds. */
async function sendOrderConfirmationEmails(order) {
  if (!order || String(order.paymentStatus) !== "paid") return;

  const id = orderDisplayId(order);
  const customerEmail = String(order.email || "").trim().toLowerCase();
  if (!customerEmail) return;

  const customerHtml = wrapHtml(
    "Order Confirmed",
    `${orderSummaryBlock(order)}
    <p style="font-size:15px;line-height:1.6;">Thank you for your order! We've received your payment and will start preparing it soon.</p>
    <p style="font-size:15px;line-height:1.6;">You'll receive another email when your order is shipped and delivered.</p>`,
  );

  await sendMail({
    to: customerEmail,
    subject: `Order Confirmed — ${id} | The Royal Oven`,
    html: customerHtml,
  });

  const adminEmail = env.adminNotifyEmail || env.smtpUser;
  if (adminEmail && adminEmail.toLowerCase() !== customerEmail) {
    const adminHtml = wrapHtml(
      "New Order",
      `<p style="font-size:15px;line-height:1.6;"><strong>New paid order received.</strong></p>
      <p style="font-size:15px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(customerEmail)})</p>
      <p style="font-size:15px;line-height:1.6;"><strong>Phone:</strong> ${escapeHtml(order.phone || "—")}</p>
      ${orderSummaryBlock(order)}`,
    );
    await sendMail({
      to: adminEmail,
      subject: `[New Order] ${id} — ${escapeHtml(order.customerName || "Customer")}`,
      html: adminHtml,
    });
  }
}

/** Shipped or delivered status update to customer. */
async function sendOrderStatusEmail(order, status) {
  const customerEmail = String(order.email || "").trim().toLowerCase();
  if (!customerEmail) return;

  const id = orderDisplayId(order);
  const name = escapeHtml(order.customerName || "Customer");

  if (status === "shipped") {
    const html = wrapHtml(
      "Order Shipped",
      `<p style="font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:15px;line-height:1.6;">Great news! Your order <strong>${escapeHtml(id)}</strong> has been shipped and is on its way to you.</p>
      <p style="font-size:15px;line-height:1.6;"><strong>Delivery address:</strong><br/>${escapeHtml(formatAddress(order.shippingAddress))}</p>
      ${itemsTableHtml(order.items)}
      <p style="font-size:15px;line-height:1.6;">We'll notify you once it's delivered. Thank you for shopping with The Royal Oven!</p>`,
    );
    await sendMail({
      to: customerEmail,
      subject: `Order Shipped — ${id} | The Royal Oven`,
      html,
    });
    return;
  }

  if (status === "completed") {
    const html = wrapHtml(
      "Order Delivered",
      `<p style="font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:15px;line-height:1.6;">Your order <strong>${escapeHtml(id)}</strong> has been delivered. We hope you enjoy your treats!</p>
      ${itemsTableHtml(order.items)}
      <p style="font-size:15px;line-height:1.6;">Thank you for choosing The Royal Oven. We'd love to see you again soon!</p>`,
    );
    await sendMail({
      to: customerEmail,
      subject: `Order Delivered — ${id} | The Royal Oven`,
      html,
    });
  }
}

function notifyOrderPaid(order) {
  sendOrderConfirmationEmails(order).catch((err) => {
    console.error("[email] order confirmation failed:", err.message || err);
  });
}

function notifyOrderStatusChange(order, previousStatus) {
  const next = String(order.status || "");
  const prev = String(previousStatus || "");
  if (next === prev) return;
  if (next !== "shipped" && next !== "completed") return;
  if (String(order.paymentStatus) !== "paid") return;

  sendOrderStatusEmail(order, next).catch((err) => {
    console.error("[email] status update failed:", err.message || err);
  });
}

module.exports = {
  notifyOrderPaid,
  notifyOrderStatusChange,
  isEmailConfigured,
};
