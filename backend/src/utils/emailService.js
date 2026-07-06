const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const env = require("../config/env");

const LOGO_CID = "royalOvenLogo@theroyaloven.com";
const LOGO_PATH = path.resolve(__dirname, "../assets/royal-oven-logo.png");

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
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;word-break:break-word;">${escapeHtml(item.name || "—")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${qty}</td>
        <td class="hide-mobile" style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">${formatMoney(price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">${formatMoney(lineTotal)}</td>
      </tr>`;
    })
    .join("");
  return `<div class="items-wrap" style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:12px 0;">
    <table role="presentation" class="items-table" width="100%" cellpadding="0" cellspacing="0" style="width:100%;min-width:280px;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#ecfdf5;">
        <th style="padding:8px 12px;text-align:left;">Item</th>
        <th style="padding:8px 12px;text-align:center;width:48px;">Qty</th>
        <th class="hide-mobile" style="padding:8px 12px;text-align:right;">Price</th>
        <th style="padding:8px 12px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  </div>`;
}

function getLogoAttachment() {
  if (!fs.existsSync(LOGO_PATH)) return null;
  return {
    filename: "royal-oven-logo.jpg",
    path: LOGO_PATH,
    cid: LOGO_CID,
    contentType: "image/jpeg",
    contentDisposition: "inline",
  };
}

function logoImgSrc() {
  if (getLogoAttachment()) return `cid:${LOGO_CID}`;
  return env.emailLogoUrl;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapHtml(title, bodyHtml) {
  const logoSrc = logoImgSrc();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
      .email-body { padding: 20px 16px !important; }
      .email-header { padding: 14px 16px !important; }
      .brand-title { font-size: 16px !important; }
      .brand-tagline { font-size: 11px !important; }
      .logo-cell { width: 60px !important; padding-right: 10px !important; }
      .logo-round { width: 52px !important; height: 52px !important; max-width: 52px !important; }
      .items-wrap { margin: 0 -4px !important; }
      .items-table th, .items-table td { padding: 6px 8px !important; font-size: 13px !important; }
      .hide-mobile { display: none !important; width: 0 !important; max-height: 0 !important; overflow: hidden !important; }
      .body-text { font-size: 14px !important; line-height: 1.55 !important; }
      .total-row { font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div class="email-container" style="max-width:600px;width:100%;margin:16px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div class="email-header" style="background:#29968c;padding:16px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="logo-cell" width="72" valign="middle" style="width:72px;padding-right:14px;">
            <img
              class="logo-round"
              src="${escapeHtml(logoSrc)}"
              alt="The Royal Oven"
              width="58"
              height="58"
              style="display:block;width:58px;height:58px;max-width:58px;border-radius:50%;border:3px solid #ffffff;background:#ffffff;"
            />
          </td>
          <td valign="middle" style="text-align:left;">
            <p class="brand-title" style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;line-height:1.3;">The Royal Oven</p>
            <p class="brand-tagline" style="margin:3px 0 0;color:#d1fae5;font-size:12px;line-height:1.3;">Mixing Memories</p>
          </td>
        </tr>
      </table>
    </div>
    <div class="email-body body-text" style="padding:24px 28px;font-size:15px;line-height:1.6;">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
        Questions? Reply to this email or contact us at
        <a href="mailto:${escapeHtml(env.smtpFromEmail)}" style="color:#29968c;text-decoration:none;">${escapeHtml(env.smtpFromEmail)}</a>
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
  const logoAttachment = getLogoAttachment();
  await transport.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
    attachments: logoAttachment ? [logoAttachment] : [],
  });
}

function orderSummaryBlock(order) {
  const id = orderDisplayId(order);
  return `
    <p style="font-size:15px;line-height:1.6;">Hi <strong>${escapeHtml(order.customerName || "Customer")}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;"><strong>Order ID:</strong> ${escapeHtml(id)}</p>
    <p style="font-size:15px;line-height:1.6;"><strong>Delivery address:</strong><br/>${escapeHtml(formatAddress(order.shippingAddress))}</p>
    ${itemsTableHtml(order.items)}
    <p class="total-row" style="font-size:16px;font-weight:bold;text-align:right;margin-top:16px;">Total: ${formatMoney(order.totalAmount)}</p>
  `;
}

/** Customer confirmation + support/admin alert when payment succeeds. */
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
  console.log(`[email] order confirmation sent to customer: ${customerEmail}`);

  const supportEmail = String(env.adminNotifyEmail || env.smtpUser || "").trim().toLowerCase();
  if (supportEmail) {
    const adminHtml = wrapHtml(
      "New Order",
      `<p style="font-size:15px;line-height:1.6;"><strong>New paid order received.</strong></p>
      <p style="font-size:15px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(customerEmail)})</p>
      <p style="font-size:15px;line-height:1.6;"><strong>Phone:</strong> ${escapeHtml(order.phone || "—")}</p>
      ${orderSummaryBlock(order)}`,
    );
    await sendMail({
      to: supportEmail,
      subject: `[New Order] ${id} — ${escapeHtml(order.customerName || "Customer")}`,
      html: adminHtml,
    });
    console.log(`[email] new order alert sent to support: ${supportEmail}`);
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
  sendOrderConfirmationEmails,
  sendOrderStatusEmail,
  isEmailConfigured,
};
