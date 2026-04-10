const fs = require("fs");
const path = require("path");

const uploadDir = path.resolve(__dirname, "../../uploads");

function extFromMime(mimetype) {
  const m = (mimetype || "").toLowerCase();
  if (m.includes("png")) return ".png";
  if (m.includes("webp")) return ".webp";
  if (m.includes("gif")) return ".gif";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  return ".bin";
}

/**
 * Writes image bytes to uploads/ and returns web path e.g. /uploads/123.png
 */
function saveProductImageBuffer(buffer, mimetype) {
  if (!buffer || !buffer.length) {
    throw new Error("Empty image buffer.");
  }
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const ext = extFromMime(mimetype);
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const abs = path.join(uploadDir, fileName);
  fs.writeFileSync(abs, buffer);
  return `/uploads/${fileName}`;
}

function safeUnlinkWebPath(webPath) {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/uploads/")) return;
  const rel = webPath.replace(/^\/uploads\//, "");
  const abs = path.join(uploadDir, rel);
  if (abs.startsWith(uploadDir) && fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
    } catch {
      /* ignore */
    }
  }
}

module.exports = { saveProductImageBuffer, safeUnlinkWebPath, uploadDir };
