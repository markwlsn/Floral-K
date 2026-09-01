import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let dbInstance: Database.Database | null = null;

export function getDatabase(customPath?: string): Database.Database {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbFilePath = customPath || config.dbPath;

  // Ensure directory exists if not memory
  if (dbFilePath !== ':memory:') {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbFilePath);

  // Performance optimizations and constraints
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'owner', 'admin', 'customer')),
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      price REAL NOT NULL,
      compare_at_price REAL,
      cost_price REAL NOT NULL DEFAULT 0.0,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 5,
      description TEXT NOT NULL,
      short_description TEXT,
      images TEXT NOT NULL DEFAULT '[]',
      flower_types TEXT NOT NULL DEFAULT '[]',
      occasion_tags TEXT NOT NULL DEFAULT '[]',
      care_instructions TEXT,
      origin TEXT,
      scent_notes TEXT,
      dimensions TEXT,
      stem_recipe TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      barcode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      order_type TEXT NOT NULL CHECK(order_type IN ('online_delivery', 'online_pickup', 'pos_walkin')),
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'arranging', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled')),
      payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'paid', 'refunded', 'failed')),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'digital_wallet', 'cod')),
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0.0,
      delivery_fee REAL NOT NULL DEFAULT 0.0,
      tax REAL NOT NULL DEFAULT 0.0,
      total REAL NOT NULL,
      delivery_date TEXT,
      delivery_time_slot TEXT,
      recipient_name TEXT,
      recipient_phone TEXT,
      delivery_address TEXT,
      card_message TEXT,
      notes TEXT,
      source TEXT NOT NULL CHECK(source IN ('web', 'pos')),
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0.0,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_spend REAL NOT NULL DEFAULT 0.0,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pos_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cashier_id INTEGER NOT NULL REFERENCES users(id),
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      opening_cash REAL NOT NULL DEFAULT 0.0,
      closing_cash REAL,
      total_sales REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      status TEXT NOT NULL CHECK(status IN ('open', 'closed')) DEFAULT 'open'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  `);

  try {
    const columns = db.pragma('table_info(products)') as { name: string }[];
    const colNames = columns.map((c) => c.name);
    if (!colNames.includes('origin')) db.exec('ALTER TABLE products ADD COLUMN origin TEXT');
    if (!colNames.includes('scent_notes')) db.exec('ALTER TABLE products ADD COLUMN scent_notes TEXT');
    if (!colNames.includes('dimensions')) db.exec('ALTER TABLE products ADD COLUMN dimensions TEXT');
    if (!colNames.includes('stem_recipe')) db.exec('ALTER TABLE products ADD COLUMN stem_recipe TEXT');
  } catch (err) {
    // ignore if table doesn't exist yet
  }
}
