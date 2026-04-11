import { jsPDF } from "jspdf";
import type { OrderDoc } from "@/lib/orderApi";
import logoUrl from "@/assets/royal-oven-logo.png";

/** Theme: matches site primary (teal) + secondary (gold) */
const C = {
  primary: [41, 150, 136] as [number, number, number],
  primaryDark: [26, 96, 87] as [number, number, number],
  secondary: [245, 197, 66] as [number, number, number],
  ink: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  stripe: [236, 253, 245] as [number, number, number],
};

/** Standard Helvetica lacks ₹; use "Rs." for reliable PDF output */
function formatMoney(n: number): string {
  return `Rs. ${Number(n).toFixed(2)}`;
}

async function loadLogoDataUrl(): Promise<string | null> {
  const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(new Error("logo read"));
      fr.readAsDataURL(blob);
    });

  const tryFetch = async (href: string): Promise<string | null> => {
    try {
      const res = await fetch(href);
      if (!res.ok) return null;
      return await toDataUrl(await res.blob());
    } catch {
      return null;
    }
  };

  // Prefer stable public URL so the PDF logo loads even if the bundled asset path fails.
  if (typeof window !== "undefined") {
    const fromPublic = await tryFetch(new URL("/royal-oven-logo.png", window.location.href).href);
    if (fromPublic) return fromPublic;
  }
  return tryFetch(logoUrl);
}

export function orderDisplayId(o: Pick<OrderDoc, "_id" | "orderNumber">): string {
  const n = o.orderNumber != null ? String(o.orderNumber).trim() : "";
  if (n) return n;
  const id = o._id || "";
  return id ? `RO-${id.slice(-8).toUpperCase()}` : "—";
}

export function orderStatusLabel(status: string): string {
  const v = String(status || "").toLowerCase();
  if (v === "placed") return "Ordered";
  if (v === "shipped") return "Shipped";
  if (v === "completed") return "Delivered";
  if (v === "cancelled") return "Cancelled";
  return status || "—";
}

/** Customer-facing payment label (matches My Orders UI) */
export function paymentStatusLabel(ps: string | undefined): string {
  const v = String(ps || "pending").toLowerCase();
  if (v === "paid") return "Successful";
  if (v === "failed") return "Failed";
  return "Pending";
}

function formatAddress(o: OrderDoc): string {
  const a = o.shippingAddress;
  if (!a) return "—";
  const parts = [a.line1, a.line2, a.city, a.state, a.pincode, a.country]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function paymentMethodLabel(pm: string | undefined): string {
  const p = String(pm || "").toLowerCase();
  if (p === "cod") return "Cash on delivery";
  if (p === "upi") return "UPI";
  if (p === "online") return "Online payment";
  return pm ? pm.toUpperCase() : "—";
}

/**
 * Branded PDF — logo in header, Rs. amounts, right-aligned numeric columns.
 * Reflects current order snapshot (refresh list after admin updates payment / fulfillment).
 */
export async function downloadOrderInvoicePdf(order: OrderDoc): Promise<void> {
  const logoData = await loadLogoDataUrl();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 16;
  const innerW = pageW - m * 2;
  const headerH = 40;

  const right = pageW - m;
  const gap = 5;
  const wAmount = 32;
  const wRate = 32;
  const wQty = 14;
  const xAmount = right - 1;
  const xRate = xAmount - wAmount - gap;
  const xQty = xRate - wRate - gap;
  const itemLeft = m + 2;
  const itemMaxW = Math.max(28, xQty - itemLeft - gap);

  // Header bar
  doc.setFillColor(...C.primaryDark);
  doc.rect(0, 0, pageW, headerH, "F");
  doc.setFillColor(...C.secondary);
  doc.rect(0, headerH, pageW, 1.2, "F");

  const textStartX = m + (logoData ? 22 : 0);

  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", m, 6, 18, 18);
    } catch {
      /* ignore bad image */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Royal Oven", textStartX, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Fresh groceries · Quality you can trust", textStartX, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", right, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(orderDisplayId(order), right, 19, { align: "right" });

  let y = headerH + 10;

  doc.setTextColor(...C.ink);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Order status", m, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text(orderStatusLabel(order.status), m + 38, y);
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`PDF generated: ${new Date().toLocaleString()}`, right, y, { align: "right" });

  y += 8;
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.35);
  doc.line(m, y, right, y);
  y += 6;

  doc.setTextColor(...C.ink);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bill to", m, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(order.customerName || "—", m, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(order.email || "—", m, y);
  y += 4;
  if (order.phone) {
    doc.text(order.phone, m, y);
    y += 4;
  }
  const addrLines = doc.splitTextToSize(formatAddress(order), innerW);
  doc.text(addrLines, m, y);
  y += Math.max(addrLines.length, 1) * 4 + 4;

  // Stacked lines — a single row was too narrow; "Payment status" overlapped right-aligned values.
  const detailLabelX = m;
  const detailValueX = m + 34;
  const lineGap = 5.2;

  doc.setTextColor(...C.ink);
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Order date", detailLabelX, y);
  doc.setFont("helvetica", "normal");
  doc.text(order.createdAt ? new Date(order.createdAt).toLocaleString() : "—", detailValueX, y);
  y += lineGap;

  doc.setFont("helvetica", "bold");
  doc.text("Payment method", detailLabelX, y);
  doc.setFont("helvetica", "normal");
  doc.text(paymentMethodLabel(order.paymentMethod), detailValueX, y);
  y += lineGap;

  doc.setFont("helvetica", "bold");
  doc.text("Payment status", detailLabelX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text(paymentStatusLabel(order.paymentStatus).toUpperCase(), detailValueX, y);
  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "normal");

  y += 8;

  const rowH = 8;
  const headerRowY = y;
  doc.setFillColor(...C.primary);
  doc.rect(m, headerRowY - 4, innerW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const headerBaseline = headerRowY + 1.2;
  doc.text("Item", itemLeft, headerBaseline);
  doc.text("Qty", xQty, headerBaseline, { align: "right" });
  doc.text("Rate", xRate, headerBaseline, { align: "right" });
  doc.text("Amount", xAmount, headerBaseline, { align: "right" });
  y = headerRowY + rowH + 2;

  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "normal");
  let row = 0;
  for (const it of order.items) {
    if (y > pageH - 42) {
      doc.addPage();
      y = m + 8;
    }
    if (row % 2 === 0) {
      doc.setFillColor(...C.stripe);
      doc.rect(m, y - 3, innerW, rowH, "F");
    }
    const name = (it.name || "Item").slice(0, 80);
    const nameLines = doc.splitTextToSize(name, itemMaxW);
    doc.setFontSize(8.5);
    doc.text(nameLines, itemLeft, y + 1.2);
    doc.text(String(it.quantity), xQty, y + 1.2, { align: "right" });
    doc.text(formatMoney(Number(it.price)), xRate, y + 1.2, { align: "right" });
    const lineTotal = Number(it.price) * Number(it.quantity);
    doc.text(formatMoney(lineTotal), xAmount, y + 1.2, { align: "right" });
    y += Math.max(rowH, nameLines.length * 3.6);
    row += 1;
  }

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(xRate - 25, y, right, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.primaryDark);
  doc.text("Total", xRate, y, { align: "right" });
  doc.setTextColor(...C.ink);
  doc.text(formatMoney(Number(order.totalAmount)), xAmount, y, { align: "right" });

  y += 14;
  doc.setFillColor(...C.secondary);
  doc.setDrawColor(...C.primary);
  doc.roundedRect(m, y, innerW, 14, 2, 2, "FD");
  doc.setTextColor(...C.primaryDark);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for shopping with Royal Oven", m + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.ink);
  doc.text("This document reflects the order and payment status at the time you generated this PDF.", m + 4, y + 11);

  y = pageH - 14;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  const footLines = doc.splitTextToSize(
    "Royal Oven · theroyaloven.com · For support, use the Contact page on our website.",
    innerW,
  );
  doc.text(footLines, m, y);

  const safeName = orderDisplayId(order).replace(/[^\w-]+/g, "_");
  doc.save(`RoyalOven-Invoice-${safeName}.pdf`);
}
