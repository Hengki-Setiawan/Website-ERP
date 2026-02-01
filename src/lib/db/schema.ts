// Database Schema for ERP Template
// Compatible with Turso (libSQL/SQLite)

export const DATABASE_SCHEMA = `
-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  encrypted INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('owner', 'admin', 'cashier', 'viewer')) DEFAULT 'viewer',
  avatar TEXT,
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_secret TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULES (DYNAMIC CONFIGURATION)
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'box',
  description TEXT,
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS module_fields (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT CHECK(type IN ('text', 'number', 'currency', 'date', 'select', 'checkbox', 'textarea', 'image')) DEFAULT 'text',
  required INTEGER DEFAULT 0,
  options TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- ============================================
-- PRODUCTS & CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  category_id TEXT,
  image_url TEXT,
  custom_fields TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  custom_fields TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPLIERS
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  bank_name TEXT,
  bank_account TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('sale', 'purchase', 'return')) DEFAULT 'sale',
  customer_id TEXT,
  supplier_id TEXT,
  subtotal REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'completed',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price REAL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL DEFAULT 0,
  category TEXT DEFAULT 'operasional',
  expense_date TEXT DEFAULT CURRENT_TIMESTAMP,
  payment_method TEXT DEFAULT 'cash',
  receipt TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- TUTORIALS
-- ============================================
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- AI CONFIGURATION
-- ============================================
CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  provider TEXT DEFAULT 'groq',
  api_key TEXT,
  model TEXT DEFAULT 'llama-3.3-70b-versatile',
  system_prompt TEXT,
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);
`;

// Default settings to insert
export const DEFAULT_SETTINGS = [
  { key: 'business_name', value: 'Toko UMKM', category: 'business' },
  { key: 'business_logo', value: '', category: 'business' },
  { key: 'business_address', value: '', category: 'business' },
  { key: 'business_phone', value: '', category: 'business' },
  { key: 'business_email', value: '', category: 'business' },
  { key: 'primary_color', value: '#3b82f6', category: 'theme' },
  { key: 'secondary_color', value: '#10b981', category: 'theme' },
  { key: 'accent_color', value: '#f59e0b', category: 'theme' },
  { key: 'dark_mode', value: 'false', category: 'theme' },
  { key: 'database_mode', value: 'local', category: 'database' },
  { key: 'ai_provider', value: 'groq', category: 'ai' },
  { key: 'ai_enabled', value: 'true', category: 'ai' },
  { key: 'language', value: 'id', category: 'general' },
  { key: 'currency', value: 'IDR', category: 'general' },
  { key: 'timezone', value: 'Asia/Jakarta', category: 'general' },
];

// Default modules
export const DEFAULT_MODULES = [
  { id: 'products', name: 'Produk', slug: 'products', icon: 'package', description: 'Kelola produk dan inventori', enabled: 1, sort_order: 1 },
  { id: 'pos', name: 'Kasir (POS)', slug: 'pos', icon: 'shopping-cart', description: 'Point of Sale - Penjualan', enabled: 1, sort_order: 2 },
  { id: 'customers', name: 'Pelanggan', slug: 'customers', icon: 'users', description: 'Kelola data pelanggan', enabled: 1, sort_order: 3 },
  { id: 'suppliers', name: 'Supplier', slug: 'suppliers', icon: 'truck', description: 'Kelola data supplier', enabled: 1, sort_order: 4 },
  { id: 'transactions', name: 'Transaksi', slug: 'transactions', icon: 'receipt', description: 'Riwayat transaksi', enabled: 1, sort_order: 5 },
  { id: 'expenses', name: 'Pengeluaran', slug: 'expenses', icon: 'credit-card', description: 'Catat pengeluaran', enabled: 1, sort_order: 6 },
  { id: 'reports', name: 'Laporan', slug: 'reports', icon: 'bar-chart-3', description: 'Laporan dan analitik', enabled: 1, sort_order: 7 },
];

// Generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
