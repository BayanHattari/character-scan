// Memorial Wall Backend 

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// Settings (.env / Render Env Vars)
// ---------------------------
const PORT = parseInt(process.env.PORT || "3000", 10);
const ADMIN_KEY = process.env.ADMIN_KEY || "12345";
const MAX_PHOTOS = parseInt(process.env.MAX_PHOTOS || "10000", 10);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it in Render Environment variables.");
  process.exit(1);
}

// ---------------------------
// Cloudinary config
// ---------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------
// Postgres setup
// ---------------------------
const pool = new Pool({
  connectionString: DATABASE_URL,
  // Render Postgres commonly requires SSL; this setting is safe on Render
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_photos_created_at
    ON photos (created_at DESC);
  `);
}

// ---------------------------
// Multer (memory storage)  
// ---------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only images (jpeg/png/webp) are allowed"));
    }
    cb(null, true);
  },
});

// ---------------------------
// SSE (Server-Sent Events) for live wall updates
// ---------------------------
const sseClients = new Set();

function sseSend(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) res.write(payload);
}

// ---------------------------
// Helpers
// ---------------------------
function makeThumbnailUrl(publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: 250, height: 250, crop: "fill" },
      { fetch_format: "auto", quality: "auto" },
    ],
  });
}

async function enforceMaxPhotos() {
  // Delete anything beyond MAX_PHOTOS (oldest ones)
  const extra = await pool.query(
    `
    SELECT id, public_id
    FROM photos
    ORDER BY created_at DESC
    OFFSET $1
    `,
    [MAX_PHOTOS]
  );

  if (!extra.rows || extra.rows.length === 0) return;

  const ids = extra.rows.map((r) => r.id);
  const publicIds = extra.rows.map((r) => r.public_id);

  // Best-effort delete from Cloudinary
  for (const pid of publicIds) {
    try {
      await cloudinary.uploader.destroy(pid);
    } catch {}
  }

  // Delete from DB
  await pool.query(`DELETE FROM photos WHERE id = ANY($1::text[])`, [ids]);
}

// ---------------------------
// Routes
// ---------------------------
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/*
  GET /events (SSE)
*/
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "hello" })}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

/*
  GET /photos?limit=800
*/
app.get("/photos", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "800", 10), 2000);

    const result = await pool.query(
      `
      SELECT id,
             url,
             thumbnail_url AS "thumbnailUrl",
             created_at AS "createdAt"
      FROM photos
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: "DB error", error: err.message });
  }
});

/*
  POST /upload (field name must be "file")
*/
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const folder = "memorial_wall";

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: id, // stable id
          resource_type: "image",
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const publicId = uploadResult.public_id;
    const url = uploadResult.secure_url;
    const thumbnailUrl = makeThumbnailUrl(publicId);

    await pool.query(
      `
      INSERT INTO photos (id, public_id, url, thumbnail_url, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [id, publicId, url, thumbnailUrl, createdAt]
    );

    // keep DB size under control
    enforceMaxPhotos().catch(() => {});

    const photo = { id, url, thumbnailUrl, createdAt };

    // live update for wall
    sseSend({ type: "photo_uploaded", photo });

    return res.json({ message: "Uploaded successfully", photo });
  } catch (err) {
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

/*
  DELETE /photos/:id (Admin only)
  Header: x-admin-key: <ADMIN_KEY>
*/
app.delete("/photos/:id", async (req, res) => {
  try {
    const key = req.headers["x-admin-key"];
    if (key !== ADMIN_KEY) return res.status(403).json({ message: "Forbidden (Admin only)" });

    const { id } = req.params;

    const row = await pool.query(`SELECT public_id FROM photos WHERE id = $1`, [id]);
    if (!row.rows || row.rows.length === 0) return res.status(404).json({ message: "Photo not found" });

    const publicId = row.rows[0].public_id;

    // delete from Cloudinary 
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {}

    // delete from DB
    await pool.query(`DELETE FROM photos WHERE id = $1`, [id]);

    sseSend({ type: "photo_deleted", id });

    return res.json({ message: "Photo deleted successfully", id });
  } catch (err) {
    return res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// ---------------------------
// Start
// ---------------------------
initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on 0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB:", err.message);
    process.exit(1);
  });