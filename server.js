import express from "express";
import session from "express-session";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import dotenv from "dotenv";
import { curatedFoodItems, curatedProducts } from "./data/catalog.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === "production";
const PRODUCT_CATEGORY_COUNT = 8;
const FOOD_HOTEL_COUNT = 5;
const SEAT_LOCK_MINUTES = 5;
const ORDER_STATUSES = ["Placed", "Preparing", "Out for delivery", "Completed", "Cancelled"];
const TICKET_STATUSES = ["Confirmed", "Checked in", "Cancelled"];
const DEFAULT_MOVIES = [
  {
    name: "Leo",
    image_url: "Assests/movies/LEO.jpg",
    rating: 4,
    trailer_url: "https://www.youtube.com/embed/Po3jStA673E"
  },
  {
    name: "Jailer",
    image_url: "Assests/movies/JAiler.jpg",
    rating: 5,
    trailer_url: "https://www.youtube.com/embed/Y5BeWdODPqo"
  },
  {
    name: "Vikram",
    image_url: "Assests/movies/Vikram.jpg",
    rating: 5,
    trailer_url: "https://www.youtube.com/embed/OKBMCL-frPU"
  },
  {
    name: "Salaar",
    image_url: "Assests/movies/SALAR.jpg",
    rating: 4,
    trailer_url: "https://www.youtube.com/embed/4GPvYMKtrtI"
  },
  {
    name: "Dune 2",
    image_url: "Assests/movies/DUNE2.jpg",
    rating: 5,
    trailer_url: "https://www.youtube.com/embed/U2Qp5pL3ovA"
  }
];

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || "trendcart",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "trendcart-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please login first." });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please login first." });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
}

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role || "user"
  };
}

function normalizeJsonField(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (typeof value === "object") {
    return value;
  }

  return [];
}

function getNetworkBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return `http://${entry.address}:${port}`;
      }
    }
  }

  return `http://localhost:${port}`;
}

function hasPlaceholder(value = "") {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return ["your_", "placeholder", "example", "test_sid", "token_here"].some((fragment) =>
    normalized.includes(fragment)
  );
}

function isRazorpayConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  return !hasPlaceholder(keyId) && !hasPlaceholder(keySecret);
}

function validateName(name) {
  const value = String(name || "").trim();
  if (!value) {
    return "TrendCart Member";
  }

  return value.slice(0, 100);
}

function slugify(value, fallback = "asset") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function sanitizeImageExtension(mimeType, originalName = "") {
  const mime = String(mimeType || "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return "jpg";
  }
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }

  const ext = path.extname(String(originalName || "")).replace(".", "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }

  return "";
}

function getLockExpiry(lockRows, sessionId) {
  const mine = lockRows
    .filter((row) => row.session_id === sessionId)
    .map((row) => new Date(row.expires_at));

  if (!mine.length) {
    return null;
  }

  return new Date(Math.max(...mine.map((value) => value.getTime()))).toISOString();
}

async function backfillCatalogImageAssignments() {
  for (const product of curatedProducts) {
    await pool.query(
      `UPDATE products
       SET image_url = ?, description = ?
       WHERE name = ?`,
      [product.image_url, product.description, product.name]
    );
  }

  for (const foodItem of curatedFoodItems) {
    await pool.query(
      `UPDATE food_items
       SET image_url = ?
       WHERE name = ?
         AND restaurant = ?`,
      [foodItem.image_url, foodItem.name, foodItem.restaurant]
    );
  }
}

async function ensureDefaultMovies() {
  const [rows] = await pool.query(
    "SELECT id, name, is_active FROM movies"
  );
  const movieMap = new Map(rows.map((row) => [String(row.name).toLowerCase(), row]));

  for (const movie of DEFAULT_MOVIES) {
    const existing = movieMap.get(movie.name.toLowerCase());

    if (!existing) {
      await pool.query(
        `INSERT INTO movies (name, image_url, trailer_url, rating, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [movie.name, movie.image_url, movie.trailer_url, movie.rating]
      );
      continue;
    }

    await pool.query(
      `UPDATE movies
       SET image_url = ?, trailer_url = ?, rating = ?
       WHERE id = ?`,
      [movie.image_url, movie.trailer_url, movie.rating, existing.id]
    );
  }

  const [[activeCount]] = await pool.query("SELECT COUNT(*) AS total FROM movies WHERE is_active = 1");
  if (Number(activeCount.total) === 0) {
    await pool.query(
      `UPDATE movies
       SET is_active = 1
       WHERE LOWER(name) IN (${DEFAULT_MOVIES.map(() => "?").join(", ")})`,
      DEFAULT_MOVIES.map((movie) => movie.name.toLowerCase())
    );
  }
}

async function ensureDefaultAdmin() {
  const adminName = validateName(process.env.ADMIN_NAME || "TrendCart Admin");
  const adminEmail = String(process.env.ADMIN_EMAIL || "admin@trendcart.com").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "Admin@123").trim();

  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminPassword.length < 6) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [existingUser] = await pool.query("SELECT id, role FROM users WHERE email = ? LIMIT 1", [adminEmail]);

  if (existingUser.length > 0) {
    if (existingUser[0].role !== "admin") {
      await pool.query(
        "UPDATE users SET name = ?, role = 'admin', password_hash = ? WHERE id = ?",
        [adminName, passwordHash, existingUser[0].id]
      );
    }
    return;
  }

  await pool.query(
    "INSERT INTO users (name, email, password_hash, mobile, role) VALUES (?, ?, ?, NULL, 'admin')",
    [adminName, adminEmail, passwordHash]
  );
}

function normalizeStatus(value, allowedValues, fallback) {
  const incoming = String(value || "").trim().toLowerCase();
  const match = allowedValues.find((item) => item.toLowerCase() === incoming);
  return match || fallback;
}

function normalizeMoviePayload(payload = {}) {
  return {
    name: validateName(payload.name).slice(0, 120),
    image_url: String(payload.image_url || "").trim(),
    rating: Math.min(5, Math.max(1, Number(payload.rating || 4))),
    trailer_url: String(payload.trailer_url || "").trim(),
    is_active: payload.is_active === false || payload.is_active === "false" ? 0 : 1
  };
}

function normalizeProductPayload(payload = {}) {
  return {
    name: String(payload.name || "").trim().slice(0, 120),
    category: String(payload.category || "").trim().slice(0, 80),
    description: String(payload.description || "").trim(),
    image_url: String(payload.image_url || "").trim(),
    price: Number(payload.price || 0),
    rating: Math.min(5, Math.max(1, Number(payload.rating || 4)))
  };
}

function normalizeFoodPayload(payload = {}) {
  return {
    name: String(payload.name || "").trim().slice(0, 120),
    restaurant: String(payload.restaurant || "").trim().slice(0, 120),
    cuisine: String(payload.cuisine || "").trim().slice(0, 120),
    description: String(payload.description || "").trim(),
    delivery_time: String(payload.delivery_time || "").trim().slice(0, 40),
    image_url: String(payload.image_url || "").trim(),
    price: Number(payload.price || 0),
    rating: Math.min(5, Math.max(1, Number(payload.rating || 4)))
  };
}

function validateCatalogPayload(item, requiredKeys) {
  for (const key of requiredKeys) {
    if (!item[key] && item[key] !== 0) {
      return `${key.replace("_", " ")} is required.`;
    }
  }

  if (!Number.isFinite(item.price) || item.price < 0) {
    return "Enter a valid price.";
  }

  return null;
}

function normalizeSeatList(input) {
  const values = Array.isArray(input) ? input : [];
  return [...new Set(
    values
      .map((seat) => String(seat || "").trim().toUpperCase())
      .filter((seat) => /^S([1-9]|1\d|2[0-4])$/.test(seat))
  )].sort((left, right) => Number(left.slice(1)) - Number(right.slice(1)));
}

async function createDatabaseIfMissing() {
  if (process.env.MYSQLHOST && process.env.MYSQLDATABASE) {
    return;
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ""
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || process.env.MYSQLDATABASE || "trendcart"}\``
  );
  await connection.end();
}

async function initializeDatabase() {
  await createDatabaseIfMissing();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      mobile VARCHAR(20) NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      phone_verified_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [mobileColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'mobile'");
  if (mobileColumns.length === 0) {
    await pool.query("ALTER TABLE users ADD COLUMN mobile VARCHAR(20) NULL AFTER password_hash");
  }

  const [roleColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
  if (roleColumns.length === 0) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER mobile"
    );
  }

  const [verifiedColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'phone_verified_at'");
  if (verifiedColumns.length === 0) {
    await pool.query("ALTER TABLE users ADD COLUMN phone_verified_at DATETIME NULL AFTER role");
  }

  const [mobileIndex] = await pool.query("SHOW INDEX FROM users WHERE Key_name = 'unique_mobile'");
  if (mobileIndex.length === 0) {
    await pool.query("ALTER TABLE users ADD UNIQUE KEY unique_mobile (mobile)");
  }

  await pool.query("UPDATE users SET mobile = NULL WHERE mobile = ''");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      category VARCHAR(80) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      rating INT NOT NULL DEFAULT 4,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS food_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      restaurant VARCHAR(120) NOT NULL,
      cuisine VARCHAR(120) NULL,
      description TEXT NULL,
      delivery_time VARCHAR(40) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      rating INT NOT NULL DEFAULT 4,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [descriptionColumns] = await pool.query("SHOW COLUMNS FROM food_items LIKE 'description'");
  if (descriptionColumns.length === 0) {
    await pool.query("ALTER TABLE food_items ADD COLUMN description TEXT NULL AFTER restaurant");
  }

  const [cuisineColumns] = await pool.query("SHOW COLUMNS FROM food_items LIKE 'cuisine'");
  if (cuisineColumns.length === 0) {
    await pool.query("ALTER TABLE food_items ADD COLUMN cuisine VARCHAR(120) NULL AFTER restaurant");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_cart_item (user_id, product_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      order_type ENUM('product', 'food') NOT NULL DEFAULT 'product',
      total_amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'Razorpay',
      payment_reference VARCHAR(120) NULL,
      payment_status VARCHAR(40) NOT NULL DEFAULT 'PAID',
      order_status VARCHAR(40) NOT NULL DEFAULT 'Placed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const [orderPaymentColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_reference'");
  if (orderPaymentColumns.length === 0) {
    await pool.query(
      "ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(120) NULL AFTER payment_method"
    );
  }

  const [orderStatusColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'order_status'");
  if (orderStatusColumns.length === 0) {
    await pool.query("ALTER TABLE orders ADD COLUMN order_status VARCHAR(40) NOT NULL DEFAULT 'Placed' AFTER payment_status");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NULL,
      food_item_id INT NULL,
      item_name VARCHAR(120) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      trailer_url VARCHAR(255) NOT NULL,
      rating INT NOT NULL DEFAULT 4,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movie_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      movie_id INT NULL,
      movie_name VARCHAR(120) NOT NULL,
      theatre VARCHAR(120) NOT NULL,
      show_time VARCHAR(50) NOT NULL,
      seats_json JSON NOT NULL,
      snacks_json JSON NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      payment_reference VARCHAR(120) NULL,
      booking_status VARCHAR(40) NOT NULL DEFAULT 'Confirmed',
      booked_at VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL
    )
  `);

  const [ticketPaymentColumns] = await pool.query("SHOW COLUMNS FROM movie_tickets LIKE 'payment_reference'");
  if (ticketPaymentColumns.length === 0) {
    await pool.query(
      "ALTER TABLE movie_tickets ADD COLUMN payment_reference VARCHAR(120) NULL AFTER total_price"
    );
  }

  const [ticketMovieColumns] = await pool.query("SHOW COLUMNS FROM movie_tickets LIKE 'movie_id'");
  if (ticketMovieColumns.length === 0) {
    await pool.query("ALTER TABLE movie_tickets ADD COLUMN movie_id INT NULL AFTER user_id");
  }

  const [ticketStatusColumns] = await pool.query("SHOW COLUMNS FROM movie_tickets LIKE 'booking_status'");
  if (ticketStatusColumns.length === 0) {
    await pool.query(
      "ALTER TABLE movie_tickets ADD COLUMN booking_status VARCHAR(40) NOT NULL DEFAULT 'Confirmed' AFTER payment_reference"
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movie_seat_locks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      movie_id INT NOT NULL,
      theatre VARCHAR(120) NOT NULL,
      show_time VARCHAR(50) NOT NULL,
      seat_number VARCHAR(10) NOT NULL,
      session_id VARCHAR(255) NOT NULL,
      user_id INT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_locked_seat (movie_id, theatre, show_time, seat_number),
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const [[productCounts]] = await pool.query("SELECT COUNT(*) AS total FROM products");
  const [existingProductCategories] = await pool.query("SELECT DISTINCT category FROM products");
  const allowedProductCategories = new Set(curatedProducts.map((item) => item.category));
  const hasLegacyProductCategories = existingProductCategories.some(
    (row) => !allowedProductCategories.has(row.category)
  );

  if (productCounts.total === 0 || hasLegacyProductCategories) {
    if (hasLegacyProductCategories) {
      await pool.query("DELETE FROM products");
    }

    for (let index = 0; index < curatedProducts.length; index += 40) {
      const batch = curatedProducts.slice(index, index + 40);
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
      const values = batch.flatMap((item) => [
        item.name,
        item.category,
        item.description,
        item.image_url,
        item.price,
        item.rating
      ]);
      await pool.query(
        `INSERT INTO products (name, category, description, image_url, price, rating) VALUES ${placeholders}`,
        values
      );
    }
  }

  const [[foodCounts]] = await pool.query("SELECT COUNT(*) AS total FROM food_items");
  if (foodCounts.total === 0) {
    for (let index = 0; index < curatedFoodItems.length; index += 40) {
      const batch = curatedFoodItems.slice(index, index + 40);
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const values = batch.flatMap((item) => [
        item.name,
        item.restaurant,
        item.cuisine,
        item.description,
        item.delivery_time,
        item.image_url,
        item.price,
        item.rating
      ]);
      await pool.query(
        `INSERT INTO food_items (name, restaurant, cuisine, description, delivery_time, image_url, price, rating) VALUES ${placeholders}`,
        values
      );
    }
  }

  await ensureDefaultMovies();
  await backfillCatalogImageAssignments();
  await ensureDefaultAdmin();
}

async function clearExpiredSeatLocks() {
  await pool.query("DELETE FROM movie_seat_locks WHERE expires_at <= NOW()");
}

async function getSeatAvailability(movieId, theatre, showTime) {
  await clearExpiredSeatLocks();

  const [ticketRows] = await pool.query(
    `SELECT seats_json
     FROM movie_tickets
     WHERE movie_id = ?
       AND theatre = ?
       AND show_time = ?
       AND booking_status <> 'Cancelled'`,
    [movieId, theatre, showTime]
  );

  const bookedSeats = ticketRows.flatMap((row) => normalizeSeatList(normalizeJsonField(row.seats_json)));

  const [lockRows] = await pool.query(
    `SELECT seat_number, session_id, expires_at
     FROM movie_seat_locks
     WHERE movie_id = ?
       AND theatre = ?
       AND show_time = ?
       AND expires_at > NOW()`,
    [movieId, theatre, showTime]
  );

  return {
    bookedSeats,
    lockRows
  };
}

function mapMovieRow(row) {
  return {
    id: row.id,
    name: row.name,
    image: row.image_url,
    rating: Number(row.rating),
    trailer: row.trailer_url,
    isActive: Boolean(row.is_active)
  };
}

app.post("/api/auth/register", async (req, res) => {
  const name = validateName(req.body.name);
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, mobile, role) VALUES (?, ?, ?, NULL, 'user')",
      [name, email, passwordHash]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    req.session.user = formatUser(rows[0]);
    res.status(201).json({ message: "Registration successful.", user: req.session.user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Unable to register right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = formatUser(user);
    res.json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to login right now." });
  }
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get("/api/server-info", (_req, res) => {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
  res.json({
    baseUrl: getNetworkBaseUrl(),
    localhostUrl: `http://localhost:${port}`,
    razorpayKeyId,
    razorpayEnabled: isRazorpayConfigured(),
    razorpayMode: razorpayKeyId.startsWith("rzp_live_") ? "live" : "test"
  });
});

app.post("/api/payments/razorpay/order", requireAuth, async (req, res) => {
  try {
    const { amount, type } = req.body;

    if (!isRazorpayConfigured()) {
      return res.status(400).json({ message: "Razorpay keys are not configured yet." });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }

    const payload = {
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `tc_${type || "pay"}_${Date.now()}`,
      notes: {
        userId: String(req.session.user.id),
        paymentType: String(type || "general")
      }
    };

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return res.status(400).json({
        message: data.error?.description || "Unable to create Razorpay order."
      });
    }

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ message: "Unable to create Razorpay order." });
  }
});

app.post("/api/payments/razorpay/verify", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!isRazorpayConfigured()) {
      return res.status(400).json({ message: "Razorpay secret is not configured yet." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment signature verification failed." });
    }

    res.json({
      verified: true,
      paymentReference: razorpay_payment_id,
      orderReference: razorpay_order_id
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    res.status(500).json({ message: "Unable to verify payment." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully." });
  });
});

app.get("/api/profile/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [[cartCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM cart_items WHERE user_id = ?",
      [userId]
    );
    const [[productOrderCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND order_type = 'product'",
      [userId]
    );
    const [[foodOrderCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND order_type = 'food'",
      [userId]
    );
    const [[ticketCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM movie_tickets WHERE user_id = ?",
      [userId]
    );

    res.json({
      user: req.session.user,
      stats: {
        cartItems: cartCount.total,
        productOrders: productOrderCount.total,
        foodOrders: foodOrderCount.total,
        movieTickets: ticketCount.total
      }
    });
  } catch (error) {
    console.error("Profile summary error:", error);
    res.status(500).json({ message: "Unable to load profile summary." });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, mobile, role, created_at FROM users ORDER BY created_at DESC LIMIT 6"
    );
    res.json(rows);
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ message: "Unable to load users." });
  }
});

app.get("/api/products", async (req, res) => {
  const { category, search } = req.query;
  const clauses = [];
  const values = [];

  if (category && category !== "All") {
    clauses.push("category = ?");
    values.push(category);
  }

  if (search) {
    clauses.push("LOWER(name) LIKE ?");
    values.push(`%${String(search).toLowerCase()}%`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `SELECT id, name, category, description, image_url AS image, price, rating
       FROM products ${where} ORDER BY id`,
      values
    );
    res.json(rows);
  } catch (error) {
    console.error("Products error:", error);
    res.status(500).json({ message: "Unable to load products." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, category, description, image_url AS image, price, rating
       FROM products WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Product detail error:", error);
    res.status(500).json({ message: "Unable to load product." });
  }
});

app.get("/api/food-items", async (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  try {
    const [rows] = await pool.query(
      `SELECT id, name, restaurant, cuisine, description, delivery_time AS time, image_url AS image, price, rating
       FROM food_items
       WHERE ? = ''
          OR LOWER(name) LIKE ?
          OR LOWER(restaurant) LIKE ?
          OR LOWER(COALESCE(cuisine, '')) LIKE ?
       ORDER BY id`,
      [search, `%${search}%`, `%${search}%`, `%${search}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error("Food items error:", error);
    res.status(500).json({ message: "Unable to load food items." });
  }
});

app.get("/api/movies", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, image_url, trailer_url, rating, is_active
       FROM movies
       WHERE is_active = 1
       ORDER BY id`
    );
    res.json(rows.map(mapMovieRow));
  } catch (error) {
    console.error("Movies error:", error);
    res.status(500).json({ message: "Unable to load movies." });
  }
});

app.get("/api/movies/:id/seats", requireAuth, async (req, res) => {
  const movieId = Number(req.params.id);
  const theatre = String(req.query.theatre || "").trim();
  const showTime = String(req.query.time || "").trim();

  if (!movieId || !theatre || !showTime) {
    return res.status(400).json({ message: "Movie, theatre, and show time are required." });
  }

  try {
    const availability = await getSeatAvailability(movieId, theatre, showTime);
    const lockedSeats = availability.lockRows
      .filter((row) => row.session_id !== req.sessionID)
      .map((row) => row.seat_number);
    const mine = availability.lockRows
      .filter((row) => row.session_id === req.sessionID)
      .map((row) => row.seat_number);

    res.json({
      bookedSeats: availability.bookedSeats,
      lockedSeats,
      mine,
      expiresAt: getLockExpiry(availability.lockRows, req.sessionID)
    });
  } catch (error) {
    console.error("Seat availability error:", error);
    res.status(500).json({ message: "Unable to load seat availability." });
  }
});

app.post("/api/movie-seat-locks", requireAuth, async (req, res) => {
  const movieId = Number(req.body.movieId);
  const theatre = String(req.body.theatre || "").trim();
  const showTime = String(req.body.time || "").trim();
  const seats = normalizeSeatList(req.body.seats);

  if (!movieId || !theatre || !showTime) {
    return res.status(400).json({ message: "Movie, theatre, and show time are required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM movie_seat_locks WHERE expires_at <= NOW()");

    const [movieRows] = await connection.query("SELECT id FROM movies WHERE id = ? AND is_active = 1", [movieId]);
    if (!movieRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Movie not found." });
    }

    const [ticketRows] = await connection.query(
      `SELECT seats_json
       FROM movie_tickets
       WHERE movie_id = ?
         AND theatre = ?
         AND show_time = ?
         AND booking_status <> 'Cancelled'`,
      [movieId, theatre, showTime]
    );
    const bookedSeats = ticketRows.flatMap((row) => normalizeSeatList(normalizeJsonField(row.seats_json)));
    const unavailableFromBooking = seats.filter((seat) => bookedSeats.includes(seat));
    if (unavailableFromBooking.length) {
      await connection.rollback();
      return res.status(409).json({
        message: "Some seats have already been booked.",
        unavailableSeats: unavailableFromBooking
      });
    }

    const [lockRows] = await connection.query(
      `SELECT seat_number, session_id
       FROM movie_seat_locks
       WHERE movie_id = ?
         AND theatre = ?
         AND show_time = ?
         AND expires_at > NOW()`,
      [movieId, theatre, showTime]
    );

    const unavailableFromLocks = seats.filter((seat) =>
      lockRows.some((row) => row.seat_number === seat && row.session_id !== req.sessionID)
    );
    if (unavailableFromLocks.length) {
      await connection.rollback();
      return res.status(409).json({
        message: "Some seats were locked by another user.",
        unavailableSeats: unavailableFromLocks
      });
    }

    await connection.query(
      `DELETE FROM movie_seat_locks
       WHERE movie_id = ?
         AND theatre = ?
         AND show_time = ?
         AND session_id = ?`,
      [movieId, theatre, showTime, req.sessionID]
    );

    if (seats.length) {
      const placeholders = seats.map(() => "(?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))").join(", ");
      const values = seats.flatMap((seat) => [
        movieId,
        theatre,
        showTime,
        seat,
        req.sessionID,
        req.session.user.id,
        SEAT_LOCK_MINUTES
      ]);
      await connection.query(
        `INSERT INTO movie_seat_locks (movie_id, theatre, show_time, seat_number, session_id, user_id, expires_at)
         VALUES ${placeholders}`,
        values
      );
    }

    await connection.commit();

    const updated = await getSeatAvailability(movieId, theatre, showTime);
    res.json({
      message: seats.length ? "Seats locked for your session." : "Seat lock released.",
      bookedSeats: updated.bookedSeats,
      lockedSeats: updated.lockRows
        .filter((row) => row.session_id !== req.sessionID)
        .map((row) => row.seat_number),
      mine: updated.lockRows
        .filter((row) => row.session_id === req.sessionID)
        .map((row) => row.seat_number),
      expiresAt: getLockExpiry(updated.lockRows, req.sessionID)
    });
  } catch (error) {
    await connection.rollback();
    console.error("Seat lock error:", error);
    res.status(500).json({ message: "Unable to lock selected seats." });
  } finally {
    connection.release();
  }
});

app.get("/api/cart", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        cart_items.id,
        cart_items.quantity,
        products.id AS product_id,
        products.name,
        products.price,
        products.image_url AS image,
        products.category
      FROM cart_items
      JOIN products ON products.id = cart_items.product_id
      WHERE cart_items.user_id = ?
      ORDER BY cart_items.created_at DESC`,
      [req.session.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Cart load error:", error);
    res.status(500).json({ message: "Unable to load cart." });
  }
});

app.post("/api/cart", requireAuth, async (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Math.max(1, Number(req.body.quantity || 1));

  if (!productId) {
    return res.status(400).json({ message: "Product id is required." });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
      [req.session.user.id, productId]
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
        [quantity, existing[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [req.session.user.id, productId, quantity]
      );
    }

    res.status(201).json({ message: "Item added to cart." });
  } catch (error) {
    console.error("Cart save error:", error);
    res.status(500).json({ message: "Unable to add item to cart." });
  }
});

app.delete("/api/cart/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.session.user.id
    ]);
    res.json({ message: "Item removed from cart." });
  } catch (error) {
    console.error("Cart delete error:", error);
    res.status(500).json({ message: "Unable to remove item." });
  }
});

app.post("/api/orders", requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [cartRows] = await connection.query(
      `SELECT cart_items.product_id, cart_items.quantity, products.name, products.price
       FROM cart_items
       JOIN products ON products.id = cart_items.product_id
       WHERE cart_items.user_id = ?`,
      [req.session.user.id]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const totalAmount = cartRows.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, order_type, total_amount, payment_method, payment_reference, payment_status, order_status)
      VALUES (?, 'product', ?, ?, ?, 'PAID', 'Placed')`,
      [
        req.session.user.id,
        totalAmount,
        req.body.paymentMethod || "Razorpay",
        req.body.paymentReference || null
      ]
    );

    for (const item of cartRows) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, item_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.name, item.price, item.quantity]
      );
    }

    await connection.query("DELETE FROM cart_items WHERE user_id = ?", [req.session.user.id]);
    await connection.commit();

    res.status(201).json({
      message: "Order placed successfully.",
      orderId: orderResult.insertId,
      totalAmount
    });
  } catch (error) {
    await connection.rollback();
    console.error("Order error:", error);
    res.status(500).json({ message: "Unable to place order." });
  } finally {
    connection.release();
  }
});

app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, order_type, total_amount, payment_method, payment_reference, payment_status, order_status, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({ message: "Unable to load orders." });
  }
});

app.get("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT id, order_type, total_amount, payment_method, payment_reference, payment_status, order_status, created_at
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const [items] = await pool.query(
      `SELECT item_name, unit_price, quantity
       FROM order_items
       WHERE order_id = ?
       ORDER BY id`,
      [req.params.id]
    );

    res.json({
      ...orders[0],
      items
    });
  } catch (error) {
    console.error("Order detail error:", error);
    res.status(500).json({ message: "Unable to load order details." });
  }
});

app.get("/api/history/orders", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         orders.id,
         orders.order_type,
         orders.total_amount,
         orders.payment_method,
         orders.payment_reference,
         orders.payment_status,
         orders.order_status,
         orders.created_at,
         order_items.item_name,
         order_items.unit_price,
         order_items.quantity
       FROM orders
       LEFT JOIN order_items ON order_items.order_id = orders.id
       WHERE orders.user_id = ?
       ORDER BY orders.created_at DESC, order_items.id ASC`,
      [req.session.user.id]
    );

    const historyMap = new Map();
    for (const row of rows) {
      if (!historyMap.has(row.id)) {
        historyMap.set(row.id, {
          id: row.id,
          orderType: row.order_type,
          totalAmount: Number(row.total_amount),
          paymentMethod: row.payment_method,
          paymentReference: row.payment_reference,
          paymentStatus: row.payment_status,
          orderStatus: row.order_status,
          createdAt: row.created_at,
          items: []
        });
      }

      if (row.item_name) {
        historyMap.get(row.id).items.push({
          itemName: row.item_name,
          unitPrice: Number(row.unit_price),
          quantity: row.quantity
        });
      }
    }

    res.json(Array.from(historyMap.values()));
  } catch (error) {
    console.error("Order history error:", error);
    res.status(500).json({ message: "Unable to load order history." });
  }
});

app.post("/api/food-orders", requireAuth, async (req, res) => {
  const foodItemId = Number(req.body.foodItemId);
  const quantity = Math.max(1, Number(req.body.quantity || 1));

  if (!foodItemId) {
    return res.status(400).json({ message: "Food item id is required." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, name, price FROM food_items WHERE id = ?`,
      [foodItemId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Food item not found." });
    }

    const item = rows[0];
    const total = Number(item.price) * quantity;
    const [orderResult] = await pool.query(
      `INSERT INTO orders (user_id, order_type, total_amount, payment_method, payment_reference, payment_status, order_status)
      VALUES (?, 'food', ?, ?, ?, 'PAID', 'Placed')`,
      [
        req.session.user.id,
        total,
        req.body.paymentMethod || "Razorpay",
        req.body.paymentReference || null
      ]
    );

    await pool.query(
      `INSERT INTO order_items (order_id, food_item_id, item_name, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?)`,
      [orderResult.insertId, item.id, item.name, item.price, quantity]
    );

    res.status(201).json({ message: "Food order placed.", orderId: orderResult.insertId });
  } catch (error) {
    console.error("Food order error:", error);
    res.status(500).json({ message: "Unable to place food order." });
  }
});

app.post("/api/movie-tickets", requireAuth, async (req, res) => {
  const movieId = Number(req.body.movieId);
  const movie = String(req.body.movie || "").trim();
  const theatre = String(req.body.theatre || "").trim();
  const time = String(req.body.time || "").trim();
  const seats = normalizeSeatList(req.body.seats);
  const snacks = Array.isArray(req.body.snacks) ? req.body.snacks : [];
  const price = Number(req.body.price) || 0;
  const date = req.body.date;
  const paymentReference = req.body.paymentReference;

  if (!movieId || !movie || !theatre || !time || seats.length === 0) {
    return res.status(400).json({ message: "Movie, theatre, time, and seats are required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM movie_seat_locks WHERE expires_at <= NOW()");

    const [lockRows] = await connection.query(
      `SELECT seat_number
       FROM movie_seat_locks
       WHERE movie_id = ?
         AND theatre = ?
         AND show_time = ?
         AND session_id = ?
         AND expires_at > NOW()`,
      [movieId, theatre, time, req.sessionID]
    );
    const lockedSeats = lockRows.map((row) => row.seat_number).sort();

    if (lockedSeats.length !== seats.length || lockedSeats.some((seat, index) => seat !== seats[index])) {
      await connection.rollback();
      return res.status(409).json({ message: "Seat lock expired. Please reselect your seats." });
    }

    const [result] = await connection.query(
      `INSERT INTO movie_tickets
       (user_id, movie_id, movie_name, theatre, show_time, seats_json, snacks_json, total_price, payment_reference, booking_status, booked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)`,
      [
        req.session.user.id,
        movieId,
        movie,
        theatre,
        time,
        JSON.stringify(seats),
        JSON.stringify(snacks),
        price,
        paymentReference || null,
        date || new Date().toLocaleString()
      ]
    );

    await connection.query(
      `DELETE FROM movie_seat_locks
       WHERE movie_id = ?
         AND theatre = ?
         AND show_time = ?
         AND session_id = ?`,
      [movieId, theatre, time, req.sessionID]
    );

    await connection.commit();
    res.status(201).json({ message: "Ticket booked successfully.", ticketId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error("Movie ticket error:", error);
    res.status(500).json({ message: "Unable to save ticket booking." });
  } finally {
    connection.release();
  }
});

app.get("/api/movie-tickets", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, movie_id, movie_name AS movie, theatre, show_time AS time, seats_json, snacks_json, total_price AS price, payment_reference, booking_status, booked_at AS date
       FROM movie_tickets
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );

    const tickets = rows.map((row) => ({
      id: row.id,
      movieId: row.movie_id,
      movie: row.movie,
      theatre: row.theatre,
      time: row.time,
      seats: normalizeJsonField(row.seats_json),
      snacks: normalizeJsonField(row.snacks_json),
      price: Number(row.price),
      date: row.date,
      paymentReference: row.payment_reference,
      bookingStatus: row.booking_status
    }));

    res.json(tickets);
  } catch (error) {
    console.error("Movie ticket fetch error:", error);
    res.status(500).json({ message: "Unable to load ticket history." });
  }
});

app.get("/api/movie-tickets/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, movie_id, movie_name AS movie, theatre, show_time AS time, seats_json, snacks_json, total_price AS price, payment_reference, booking_status, booked_at AS date
       FROM movie_tickets
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      movieId: row.movie_id,
      movie: row.movie,
      theatre: row.theatre,
      time: row.time,
      seats: normalizeJsonField(row.seats_json),
      snacks: normalizeJsonField(row.snacks_json),
      price: Number(row.price),
      date: row.date,
      paymentReference: row.payment_reference,
      bookingStatus: row.booking_status
    });
  } catch (error) {
    console.error("Movie ticket detail error:", error);
    res.status(500).json({ message: "Unable to load ticket." });
  }
});

app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
  try {
    const [[usersCount]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[productsCount]] = await pool.query("SELECT COUNT(*) AS total FROM products");
    const [[foodCount]] = await pool.query("SELECT COUNT(*) AS total FROM food_items");
    const [[moviesCount]] = await pool.query("SELECT COUNT(*) AS total FROM movies WHERE is_active = 1");
    const [[ordersCount]] = await pool.query("SELECT COUNT(*) AS total FROM orders");
    const [[ticketsCount]] = await pool.query("SELECT COUNT(*) AS total FROM movie_tickets");
    const [[seatLockCount]] = await pool.query("SELECT COUNT(*) AS total FROM movie_seat_locks WHERE expires_at > NOW()");
    const [[ordersRevenue]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders");
    const [[ticketsRevenue]] = await pool.query("SELECT COALESCE(SUM(total_price), 0) AS total FROM movie_tickets");

    const [recentUsers] = await pool.query(
      "SELECT id, name, email, mobile, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    );
    const [recentOrders] = await pool.query(
      `SELECT id, order_type, total_amount, payment_status, payment_reference, order_status, created_at
       FROM orders ORDER BY created_at DESC LIMIT 6`
    );
    const [recentTickets] = await pool.query(
      `SELECT id, movie_name, theatre, total_price, payment_reference, booking_status, booked_at
       FROM movie_tickets ORDER BY created_at DESC LIMIT 6`
    );
    const [orderStatusBreakdown] = await pool.query(
      `SELECT order_status AS label, COUNT(*) AS total
       FROM orders
       GROUP BY order_status
       ORDER BY total DESC, label ASC`
    );
    const [ticketStatusBreakdown] = await pool.query(
      `SELECT booking_status AS label, COUNT(*) AS total
       FROM movie_tickets
       GROUP BY booking_status
       ORDER BY total DESC, label ASC`
    );
    const [topCategories] = await pool.query(
      `SELECT products.category AS label, COUNT(*) AS total
       FROM order_items
       JOIN products ON products.id = order_items.product_id
       GROUP BY products.category
       ORDER BY total DESC, label ASC
       LIMIT 5`
    );
    const [topRestaurants] = await pool.query(
      `SELECT food_items.restaurant AS label, COUNT(*) AS total
       FROM order_items
       JOIN food_items ON food_items.id = order_items.food_item_id
       GROUP BY food_items.restaurant
       ORDER BY total DESC, label ASC
       LIMIT 5`
    );
    const [salesTrend] = await pool.query(
      `SELECT label, ROUND(SUM(amount), 2) AS total
       FROM (
         SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS label, total_amount AS amount FROM orders
         UNION ALL
         SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS label, total_price AS amount FROM movie_tickets
       ) revenue
       GROUP BY label
       ORDER BY label DESC
       LIMIT 7`
    );

    res.json({
      stats: {
        users: usersCount.total,
        products: productsCount.total,
        foodItems: foodCount.total,
        movies: moviesCount.total,
        orders: ordersCount.total,
        tickets: ticketsCount.total,
        activeSeatLocks: seatLockCount.total,
        revenue: Number(ordersRevenue.total) + Number(ticketsRevenue.total)
      },
      analytics: {
        orderStatusBreakdown: orderStatusBreakdown.map((row) => ({ ...row, total: Number(row.total) })),
        ticketStatusBreakdown: ticketStatusBreakdown.map((row) => ({ ...row, total: Number(row.total) })),
        topCategories: topCategories.map((row) => ({ ...row, total: Number(row.total) })),
        topRestaurants: topRestaurants.map((row) => ({ ...row, total: Number(row.total) })),
        salesTrend: salesTrend
          .map((row) => ({ ...row, total: Number(row.total) }))
          .reverse()
      },
      recentUsers,
      recentOrders: recentOrders.map((row) => ({
        ...row,
        total_amount: Number(row.total_amount)
      })),
      recentTickets: recentTickets.map((row) => ({
        ...row,
        total_price: Number(row.total_price)
      }))
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({ message: "Unable to load admin dashboard." });
  }
});

app.get("/api/admin/catalog", requireAdmin, async (_req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT id, name, category, description, image_url AS image_url, price, rating
       FROM products
       ORDER BY category, id`
    );
    const [foodItems] = await pool.query(
      `SELECT id, name, restaurant, cuisine, description, delivery_time, image_url, price, rating
       FROM food_items
       ORDER BY restaurant, id`
    );
    const [movies] = await pool.query(
      `SELECT id, name, image_url, trailer_url, rating, is_active
       FROM movies
       ORDER BY id`
    );
    const [orders] = await pool.query(
      `SELECT id, order_type, total_amount, payment_status, order_status, payment_reference, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 40`
    );
    const [tickets] = await pool.query(
      `SELECT id, movie_name, theatre, show_time, total_price, booking_status, payment_reference, booked_at
       FROM movie_tickets
       ORDER BY created_at DESC
       LIMIT 40`
    );

    res.json({
      products,
      foodItems,
      movies: movies.map(mapMovieRow),
      orders: orders.map((order) => ({ ...order, total_amount: Number(order.total_amount) })),
      tickets: tickets.map((ticket) => ({ ...ticket, total_price: Number(ticket.total_price) })),
      orderStatuses: ORDER_STATUSES,
      ticketStatuses: TICKET_STATUSES
    });
  } catch (error) {
    console.error("Admin catalog error:", error);
    res.status(500).json({ message: "Unable to load admin catalog." });
  }
});

app.post("/api/admin/uploads", requireAdmin, async (req, res) => {
  const folder = slugify(req.body.folder || "general", "general");
  const originalName = String(req.body.fileName || "asset").trim();
  const mimeType = String(req.body.mimeType || "").trim();
  const rawData = String(req.body.data || "").trim();

  if (!rawData) {
    return res.status(400).json({ message: "Image data is required." });
  }

  const extension = sanitizeImageExtension(mimeType, originalName);
  if (!extension) {
    return res.status(400).json({ message: "Upload a JPG, PNG, or WEBP image." });
  }

  try {
    const base64 = rawData.includes(",") ? rawData.split(",").pop() : rawData;
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length) {
      return res.status(400).json({ message: "Invalid image payload." });
    }
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ message: "Image must be 8 MB or smaller." });
    }

    const targetDir = path.join(uploadsDir, folder);
    fs.mkdirSync(targetDir, { recursive: true });

    const fileName = `${slugify(path.basename(originalName, path.extname(originalName)), folder)}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const absolutePath = path.join(targetDir, fileName);
    fs.writeFileSync(absolutePath, buffer);

    res.status(201).json({
      message: "Image uploaded successfully.",
      imageUrl: path.relative(__dirname, absolutePath).replace(/\\/g, "/")
    });
  } catch (error) {
    console.error("Admin upload error:", error);
    res.status(500).json({ message: "Unable to upload image right now." });
  }
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const product = normalizeProductPayload(req.body);
  const errorMessage = validateCatalogPayload(product, ["name", "category", "description", "image_url"]);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, category, description, image_url, price, rating)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product.name, product.category, product.description, product.image_url, product.price, product.rating]
    );
    res.status(201).json({ message: "Product created.", id: result.insertId });
  } catch (error) {
    console.error("Admin product create error:", error);
    res.status(500).json({ message: "Unable to create product." });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const product = normalizeProductPayload(req.body);
  const errorMessage = validateCatalogPayload(product, ["name", "category", "description", "image_url"]);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    await pool.query(
      `UPDATE products
       SET name = ?, category = ?, description = ?, image_url = ?, price = ?, rating = ?
       WHERE id = ?`,
      [product.name, product.category, product.description, product.image_url, product.price, product.rating, req.params.id]
    );
    res.json({ message: "Product updated." });
  } catch (error) {
    console.error("Admin product update error:", error);
    res.status(500).json({ message: "Unable to update product." });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product removed." });
  } catch (error) {
    console.error("Admin product delete error:", error);
    res.status(500).json({ message: "Unable to remove product." });
  }
});

app.post("/api/admin/food-items", requireAdmin, async (req, res) => {
  const item = normalizeFoodPayload(req.body);
  const errorMessage = validateCatalogPayload(item, ["name", "restaurant", "delivery_time", "image_url"]);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO food_items (name, restaurant, cuisine, description, delivery_time, image_url, price, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.restaurant, item.cuisine, item.description, item.delivery_time, item.image_url, item.price, item.rating]
    );
    res.status(201).json({ message: "Food item created.", id: result.insertId });
  } catch (error) {
    console.error("Admin food create error:", error);
    res.status(500).json({ message: "Unable to create food item." });
  }
});

app.put("/api/admin/food-items/:id", requireAdmin, async (req, res) => {
  const item = normalizeFoodPayload(req.body);
  const errorMessage = validateCatalogPayload(item, ["name", "restaurant", "delivery_time", "image_url"]);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    await pool.query(
      `UPDATE food_items
       SET name = ?, restaurant = ?, cuisine = ?, description = ?, delivery_time = ?, image_url = ?, price = ?, rating = ?
       WHERE id = ?`,
      [item.name, item.restaurant, item.cuisine, item.description, item.delivery_time, item.image_url, item.price, item.rating, req.params.id]
    );
    res.json({ message: "Food item updated." });
  } catch (error) {
    console.error("Admin food update error:", error);
    res.status(500).json({ message: "Unable to update food item." });
  }
});

app.delete("/api/admin/food-items/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM food_items WHERE id = ?", [req.params.id]);
    res.json({ message: "Food item removed." });
  } catch (error) {
    console.error("Admin food delete error:", error);
    res.status(500).json({ message: "Unable to remove food item." });
  }
});

app.post("/api/admin/movies", requireAdmin, async (req, res) => {
  const movie = normalizeMoviePayload(req.body);
  const errorMessage = validateCatalogPayload({ ...movie, price: 0 }, ["name", "image_url", "trailer_url"]);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO movies (name, image_url, trailer_url, rating, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [movie.name, movie.image_url, movie.trailer_url, movie.rating, movie.is_active]
    );
    res.status(201).json({ message: "Movie created.", id: result.insertId });
  } catch (error) {
    console.error("Admin movie create error:", error);
    res.status(500).json({ message: "Unable to create movie." });
  }
});

app.put("/api/admin/movies/:id", requireAdmin, async (req, res) => {
  const movie = normalizeMoviePayload(req.body);
  const errorMessage = validateCatalogPayload({ ...movie, price: 0 }, ["name", "image_url", "trailer_url"]);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    await pool.query(
      `UPDATE movies
       SET name = ?, image_url = ?, trailer_url = ?, rating = ?, is_active = ?
       WHERE id = ?`,
      [movie.name, movie.image_url, movie.trailer_url, movie.rating, movie.is_active, req.params.id]
    );
    res.json({ message: "Movie updated." });
  } catch (error) {
    console.error("Admin movie update error:", error);
    res.status(500).json({ message: "Unable to update movie." });
  }
});

app.delete("/api/admin/movies/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE movies SET is_active = 0 WHERE id = ?", [req.params.id]);
    res.json({ message: "Movie archived." });
  } catch (error) {
    console.error("Admin movie archive error:", error);
    res.status(500).json({ message: "Unable to archive movie." });
  }
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const orderStatus = normalizeStatus(req.body.orderStatus, ORDER_STATUSES, "");
  if (!orderStatus) {
    return res.status(400).json({ message: "Choose a valid order status." });
  }

  try {
    await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [orderStatus, req.params.id]);
    res.json({ message: "Order status updated." });
  } catch (error) {
    console.error("Admin order status error:", error);
    res.status(500).json({ message: "Unable to update order status." });
  }
});

app.patch("/api/admin/movie-tickets/:id/status", requireAdmin, async (req, res) => {
  const bookingStatus = normalizeStatus(req.body.bookingStatus, TICKET_STATUSES, "");
  if (!bookingStatus) {
    return res.status(400).json({ message: "Choose a valid ticket status." });
  }

  try {
    await pool.query("UPDATE movie_tickets SET booking_status = ? WHERE id = ?", [bookingStatus, req.params.id]);
    res.json({ message: "Ticket status updated." });
  } catch (error) {
    console.error("Admin ticket status error:", error);
    res.status(500).json({ message: "Unable to update ticket status." });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, message: "API and MySQL are connected." });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Database connection failed." });
  }
});

app.use(express.static(__dirname));

app.get("*", (req, res) => {
  const requestedPath = path.join(__dirname, req.path);
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    res.sendFile(requestedPath);
    return;
  }

  res.sendFile(path.join(__dirname, "index.html"));
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`TrendCart server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
