const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  /** Comma-separated DNS servers for MongoDB SRV resolution (e.g. 8.8.8.8,8.8.4.4). */
  dnsServers: process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean)
    : [],
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: process.env.SMTP_SECURE !== "false",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  smtpFromEmail: process.env.SMTP_USER || "",
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || "",
  emailLogoUrl: process.env.EMAIL_LOGO_URL || "https://theroyaloven.com/royal-oven-logo.png",
};
