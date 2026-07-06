/**
 * One-off SMTP test — sends sample order emails via Hostinger.
 * Usage: node scripts/test-email.js [recipient-email]
 */
const env = require("../src/config/env");
const nodemailer = require("nodemailer");
const { sendOrderConfirmationEmails, sendOrderStatusEmail } = require("../src/utils/emailService");

const TEST_EMAIL = (process.argv[2] || "dharaniveldeveloper@gmail.com").trim().toLowerCase();

const mockOrder = {
  _id: "test123456789abc",
  orderNumber: "MM-TEST-EMAIL-001",
  customerName: "Dharani (Test)",
  email: TEST_EMAIL,
  phone: "+91 98765 43210",
  paymentStatus: "paid",
  status: "placed",
  totalAmount: 499,
  shippingAddress: {
    line1: "12 Test Street",
    line2: "Near Royal Oven",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    country: "India",
    phone: "+91 98765 43210",
  },
  items: [
    { name: "Chocolate Truffle Cake", price: 299, quantity: 1 },
    { name: "Butter Cookies Box", price: 200, quantity: 1 },
  ],
};

async function main() {
  console.log("SMTP config:");
  console.log("  host:", env.smtpHost);
  console.log("  port:", env.smtpPort);
  console.log("  user:", env.smtpUser);
  console.log("  recipient:", TEST_EMAIL);
  console.log("");

  const transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });

  console.log("1/3 Verifying Hostinger SMTP connection...");
  await transport.verify();
  console.log("    Connection OK.\n");

  console.log("2/3 Sending test order confirmation...");
  await sendOrderConfirmationEmails(mockOrder);
  console.log("    Order confirmation sent.\n");

  console.log("3/3 Sending test shipped notification...");
  await sendOrderStatusEmail({ ...mockOrder, status: "shipped" }, "shipped");
  console.log("    Shipped email sent.\n");

  console.log("Success! Check inbox (and spam folder) for:", TEST_EMAIL);
}

main().catch((err) => {
  console.error("\nTest FAILED:", err.message || err);
  if (err.code) console.error("  code:", err.code);
  if (err.response) console.error("  response:", err.response);
  process.exit(1);
});
