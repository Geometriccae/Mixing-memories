const fs = require("fs");
const path = require("path");
const multer = require("multer");

/** Max upload size (product images). MongoDB document limit is ~16MB for embedded binaries; large files are stored on disk only. */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fileName);
  },
});

function fileFilter(_req, file, cb) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image files are allowed."));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

upload.uploadMemory = uploadMemory;
upload.MAX_FILE_SIZE = MAX_FILE_SIZE;
module.exports = upload;
