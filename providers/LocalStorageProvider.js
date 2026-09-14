const fs = require("fs");
const path = require("path");

const UPLOAD_ROOT = path.join(__dirname, "..", "public", "uploads");

const ensureDir = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getExtensionFromMime = mime => {
  const mimeMap = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
    "audio/ogg": ".ogg"
  };
  return mimeMap[mime] || ".jpg";
};

const getAppUrl = () => {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const host = process.env.LOCAL_DEV_APP_HOST || "127.0.0.1";
  const port = process.env.LOCAL_DEV_APP_PORT || 8080;
  return `http://${host}:${port}`;
};

/**
 * Save an uploaded file (Buffer, temp path, or base64 Data URI) to local disk.
 *
 * @param {Object|string} file - Multer file object or base64 Data URI string
 * @param {Object} options - { folder: "services"|"avatars"|"chat", filename?: string }
 * @returns {Promise<{ public_id: string, url: string, secure_url: string }>}
 */
const upload = async (file, options = {}) => {
  const folder = options.folder || "general";
  const targetDir = path.join(UPLOAD_ROOT, folder);
  ensureDir(targetDir);

  let buffer = null;
  let ext = ".jpg";

  if (typeof file === "string" && file.startsWith("data:")) {
    // Base64 Data URI
    const matches = file.match(/^data:([A-Za-z0-9+/=.-]+);base64,(.+)$/);
    if (matches) {
      ext = getExtensionFromMime(matches[1]);
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(file.replace(/^data:[^;]+;base64,/, ""), "base64");
    }
  } else if (file && file.buffer) {
    // Multer memoryStorage
    buffer = file.buffer;
    if (file.originalname) {
      const parsedExt = path.extname(file.originalname);
      ext = parsedExt || getExtensionFromMime(file.mimetype);
    } else {
      ext = getExtensionFromMime(file.mimetype);
    }
  } else if (file && file.path) {
    // Multer diskStorage or temp file
    buffer = fs.readFileSync(file.path);
    const parsedExt = path.extname(file.path);
    ext = parsedExt || getExtensionFromMime(file.mimetype);
    // Cleanup temp file if needed
    try {
      fs.unlinkSync(file.path);
    } catch (_) {}
  } else {
    throw new Error("Invalid file provided for upload");
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const finalFileName = options.filename
    ? `${options.filename}${ext}`
    : `${folder}-${uniqueSuffix}${ext}`;
  const filePath = path.join(targetDir, finalFileName);

  fs.writeFileSync(filePath, buffer);

  const relativePath = `/uploads/${folder}/${finalFileName}`;
  const appUrl = getAppUrl();
  const fullUrl = `${appUrl}${relativePath}`;

  return {
    public_id: `${folder}/${finalFileName}`,
    url: fullUrl,
    secure_url: fullUrl,
    path: relativePath
  };
};

/**
 * Delete a file by its public_id or relative path
 *
 * @param {string} publicIdOrPath - e.g. "services/services-123.jpg" or "/uploads/services/..."
 * @returns {Promise<boolean>}
 */
const destroy = async publicIdOrPath => {
  if (!publicIdOrPath) return false;

  try {
    const cleanPath = publicIdOrPath
      .replace(/^\/?uploads\//, "")
      .replace(/\\/g, "/");

    const fullPath = path.join(UPLOAD_ROOT, cleanPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
  } catch (err) {
    console.warn("Error deleting local file:", err.message);
  }
  return false;
};

module.exports = {
  upload,
  destroy,
  UPLOAD_ROOT,
  getAppUrl
};
