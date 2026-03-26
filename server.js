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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 5000);

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "trendcart-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
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
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [roleColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
  if (roleColumns.length === 0) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER password_hash"
    );
  }

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
      delivery_time VARCHAR(40) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      rating INT NOT NULL DEFAULT 4,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI',
      payment_reference VARCHAR(120) NULL,
      payment_status VARCHAR(40) NOT NULL DEFAULT 'PAID',
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
    CREATE TABLE IF NOT EXISTS movie_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      movie_name VARCHAR(120) NOT NULL,
      theatre VARCHAR(120) NOT NULL,
      show_time VARCHAR(50) NOT NULL,
      seats_json JSON NOT NULL,
      snacks_json JSON NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      payment_reference VARCHAR(120) NULL,
      booked_at VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const [ticketPaymentColumns] = await pool.query("SHOW COLUMNS FROM movie_tickets LIKE 'payment_reference'");
  if (ticketPaymentColumns.length === 0) {
    await pool.query(
      "ALTER TABLE movie_tickets ADD COLUMN payment_reference VARCHAR(120) NULL AFTER total_price"
    );
  }

  const [productRows] = await pool.query("SELECT COUNT(*) AS count FROM products");
  if (productRows[0].count === 0) {
    await pool.query(
      `
      INSERT INTO products (name, category, description, image_url, price, rating)
      VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)
      `,
      [
        "iPhone 14", "Mobiles", "Premium Apple smartphone with sharp display and great camera.", "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?auto=format&fit=crop&w=600&q=80", 70000, 5,
        "Samsung S23", "Mobiles", "Flagship Android phone with vibrant screen and strong battery life.", "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80", 65000, 4,
        "HP Laptop", "Laptops", "Reliable work laptop for coding, browsing, and college projects.", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80", 50000, 5,
        "Dell Laptop", "Laptops", "Slim and powerful laptop for office tasks and entertainment.", "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=600&q=80", 55000, 4,
        "Nike Shoes", "Shoes", "Lightweight sports shoes with all-day comfort.", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", 4000, 4,
        "Adidas Shoes", "Shoes", "Stylish running shoes built for comfort and grip.", "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=600&q=80", 3500, 3,
        "Boat Headphones", "Headphones", "Affordable wireless headphones with punchy bass.", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", 2000, 4,
        "Sony Headphones", "Headphones", "Premium over-ear headphones with rich sound.", "https://images.unsplash.com/photo-1505740106531-4243f3831c78?auto=format&fit=crop&w=600&q=80", 5000, 5
      ]
    );
  }

  const [foodRows] = await pool.query("SELECT COUNT(*) AS count FROM food_items");
  if (foodRows[0].count === 0) {
    await pool.query(
      `
      INSERT INTO food_items (name, restaurant, delivery_time, image_url, price, rating)
      VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)
      `,
      [
        "Burger", "KFC", "30 mins", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", 150, 4,
        "Pizza", "Dominos", "40 mins", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", 300, 5,
        "Biryani", "A2B", "35 mins", "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80", 200, 5,
        "Chicken", "Grill House", "45 mins", "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80", 250, 4
      ]
    );
  }

  const [userRows] = await pool.query("SELECT COUNT(*) AS count FROM users");
  if (userRows[0].count === 0) {
    const hash = await bcrypt.hash("123456", 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ["Demo User", "demo@trendcart.com", hash, "admin"]
    );
  }

  await pool.query("UPDATE users SET role = 'admin' WHERE email = 'demo@trendcart.com'");
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email, role: "user" };
    req.session.user = user;

    res.status(201).json({ message: "Registration successful.", user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Unable to register user right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
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
  res.json({
    baseUrl: getNetworkBaseUrl(),
    localhostUrl: `http://localhost:${port}`,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

app.post("/api/payments/razorpay/order", requireAuth, async (req, res) => {
  try {
    const { amount, type } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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

    if (!process.env.RAZORPAY_KEY_SECRET) {
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
      "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 6"
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
      `SELECT id, name, restaurant, delivery_time AS time, image_url AS image, price, rating
       FROM food_items
       WHERE ? = '' OR LOWER(name) LIKE ?
       ORDER BY id`,
      [search, `%${search}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error("Food items error:", error);
    res.status(500).json({ message: "Unable to load food items." });
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
      `INSERT INTO orders (user_id, order_type, total_amount, payment_method, payment_reference, payment_status)
       VALUES (?, 'product', ?, ?, ?, 'PAID')`,
      [
        req.session.user.id,
        totalAmount,
        req.body.paymentMethod || "UPI",
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
      `SELECT id, order_type, total_amount, payment_method, payment_reference, payment_status, created_at
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
      `SELECT id, order_type, total_amount, payment_method, payment_reference, payment_status, created_at
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
      `INSERT INTO orders (user_id, order_type, total_amount, payment_method, payment_reference, payment_status)
       VALUES (?, 'food', ?, ?, ?, 'PAID')`,
      [
        req.session.user.id,
        total,
        req.body.paymentMethod || "UPI",
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
  const { movie, theatre, time, seats, snacks, price, date, paymentReference } = req.body;

  if (!movie || !theatre || !time || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Movie, theatre, time, and seats are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO movie_tickets
       (user_id, movie_name, theatre, show_time, seats_json, snacks_json, total_price, payment_reference, booked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        movie,
        theatre,
        time,
        JSON.stringify(seats),
        JSON.stringify(Array.isArray(snacks) ? snacks : []),
        Number(price) || 0,
        paymentReference || null,
        date || new Date().toLocaleString()
      ]
    );

    res.status(201).json({ message: "Ticket booked successfully.", ticketId: result.insertId });
  } catch (error) {
    console.error("Movie ticket error:", error);
    res.status(500).json({ message: "Unable to save ticket booking." });
  }
});

app.get("/api/movie-tickets", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, movie_name AS movie, theatre, show_time AS time, seats_json, snacks_json, total_price AS price, payment_reference, booked_at AS date
       FROM movie_tickets
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );

    const tickets = rows.map((row) => ({
      id: row.id,
      movie: row.movie,
      theatre: row.theatre,
      time: row.time,
      seats: normalizeJsonField(row.seats_json),
      snacks: normalizeJsonField(row.snacks_json),
      price: Number(row.price),
      date: row.date,
      paymentReference: row.payment_reference
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
      `SELECT id, movie_name AS movie, theatre, show_time AS time, seats_json, snacks_json, total_price AS price, payment_reference, booked_at AS date
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
      movie: row.movie,
      theatre: row.theatre,
      time: row.time,
      seats: normalizeJsonField(row.seats_json),
      snacks: normalizeJsonField(row.snacks_json),
      price: Number(row.price),
      date: row.date,
      paymentReference: row.payment_reference
    });
  } catch (error) {
    console.error("Movie ticket detail error:", error);
    res.status(500).json({ message: "Unable to load ticket." });
  }
});

app.get("/api/public/movie-tickets/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, movie_name AS movie, theatre, show_time AS time, seats_json, snacks_json, total_price AS price, payment_reference, booked_at AS date
       FROM movie_tickets
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      movie: row.movie,
      theatre: row.theatre,
      time: row.time,
      seats: normalizeJsonField(row.seats_json),
      snacks: normalizeJsonField(row.snacks_json),
      price: Number(row.price),
      date: row.date,
      paymentReference: row.payment_reference,
      paymentStatus: "PAID",
      bookingStatus: "CONFIRMED"
    });
  } catch (error) {
    console.error("Public movie ticket detail error:", error);
    res.status(500).json({ message: "Unable to load ticket." });
  }
});

app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
  try {
    const [[usersCount]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[productsCount]] = await pool.query("SELECT COUNT(*) AS total FROM products");
    const [[foodCount]] = await pool.query("SELECT COUNT(*) AS total FROM food_items");
    const [[ordersCount]] = await pool.query("SELECT COUNT(*) AS total FROM orders");
    const [[ticketsCount]] = await pool.query("SELECT COUNT(*) AS total FROM movie_tickets");
    const [[ordersRevenue]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders");
    const [[ticketsRevenue]] = await pool.query("SELECT COALESCE(SUM(total_price), 0) AS total FROM movie_tickets");

    const [recentUsers] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    );
    const [recentOrders] = await pool.query(
      `SELECT id, order_type, total_amount, payment_status, payment_reference, created_at
       FROM orders ORDER BY created_at DESC LIMIT 6`
    );
    const [recentTickets] = await pool.query(
      `SELECT id, movie_name, theatre, total_price, payment_reference, booked_at
       FROM movie_tickets ORDER BY created_at DESC LIMIT 6`
    );

    res.json({
      stats: {
        users: usersCount.total,
        products: productsCount.total,
        foodItems: foodCount.total,
        orders: ordersCount.total,
        tickets: ticketsCount.total,
        revenue: Number(ordersRevenue.total) + Number(ticketsRevenue.total)
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
