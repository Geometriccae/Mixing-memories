/**
 * Detailed SMTP diagnostic — logs full server responses.
 * Usage: node scripts/test-email-debug.js [recipient]
 */
const env = require("../src/config/env");
const nodemailer = require("nodemailer");

const TO = (process.argv[2] || "dharaniveldeveloper@gmail.com").trim();

const configs = [
  { label: "Port 465 SSL", host: env.smtpHost, port: 465, secure: true },
  { label: "Port 587 STARTTLS", host: env.smtpHost, port: 587, secure: false },
  { label: "Port 465 smtp.titan.email (Hostinger alt)", host: "smtp.titan.email", port: 465, secure: true },
];

async function trySend(cfg) {
  console.log(`\n--- Trying: ${cfg.label} ---`);
  console.log(`  host=${cfg.host} port=${cfg.port} secure=${cfg.secure}`);
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: env.smtpUser, pass: env.smtpPass },
    logger: true,
    debug: true,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    ...(cfg.secure === false ? { requireTLS: true } : {}),
  });

  try {
    await transport.verify();
    console.log("  verify: OK");
  } catch (err) {
    console.error("  verify FAILED:", err.message);
    return { ok: false, error: err.message };
  }

  try {
    const info = await transport.sendMail({
      from: env.smtpFrom || env.smtpUser,
      to: TO,
      cc: env.adminNotifyEmail || env.smtpUser,
      subject: `SMTP Debug Test — ${cfg.label} — ${new Date().toISOString()}`,
      text: `Test email from Royal Oven backend.\nConfig: ${cfg.label}\nTime: ${new Date().toISOString()}`,
      html: `<p>Test email from Royal Oven backend.</p><p>Config: <b>${cfg.label}</b></p><p>Time: ${new Date().toISOString()}</p>`,
    });
    console.log("  send: OK");
    console.log("  messageId:", info.messageId);
    console.log("  response:", info.response);
    console.log("  accepted:", info.accepted);
    console.log("  rejected:", info.rejected);
    return { ok: true, info };
  } catch (err) {
    console.error("  send FAILED:", err.message);
    if (err.response) console.error("  server response:", err.response);
    return { ok: false, error: err.message };
  } finally {
    transport.close();
  }
}

async function main() {
  console.log("SMTP user:", env.smtpUser);
  console.log("SMTP from:", env.smtpFrom);
  console.log("To:", TO);
  console.log("CC (support):", env.adminNotifyEmail || env.smtpUser);

  const results = [];
  for (const cfg of configs) {
    results.push({ ...cfg, ...(await trySend(cfg)) });
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`${r.label}: ${r.ok ? "SUCCESS" : "FAILED" + (r.error ? " — " + r.error : "")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
