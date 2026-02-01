// Core Types for ERP Template

// ============ USER & AUTH ============
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'cashier' | 'viewer';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============ SETTINGS ============
export interface Settings {
  // Business Info
  businessName: string;
  businessLogo?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  
  // Theme
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  
  // Database
  databaseMode: 'cloud' | 'local' | 'hybrid';
  tursoUrl?: string;
  tursoToken?: string;
  
  // AI
  aiProvider: 'groq' | 'openai' | 'gemini' | 'anthropic' | 'ollama';
  aiApiKey?: string;
  aiModel?: string;
  aiSystemPrompt?: string;
  aiEnabled: boolean;
  
  // Features
  language: 'id' | 'en';
  currency: string;
  timezone: string;
}

// ============ PRODUCTS ============
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  categoryId?: string;
  imageUrl?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
}

// ============ CUSTOMERS ============
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============ SUPPLIERS ============
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ TRANSACTIONS ============
export interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'return';
  customerId?: string;
  supplierId?: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// ============ EXPENSES ============
export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

// ============ MODULES ============
export interface Module {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  enabled: boolean;
  order: number;
}

export interface ModuleField {
  id: string;
  moduleId: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'checkbox' | 'textarea' | 'image';
  required: boolean;
  options?: string[];
  order: number;
}

// ============ TUTORIALS ============
export interface Tutorial {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  order: number;
}

// ============ AUDIT LOGS ============
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

// ============ AI ============
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  enabled: boolean;
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============ DASHBOARD STATS ============
export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  todaySales: number;
  todayRevenue: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  recentTransactions: Transaction[];
  topProducts: { product: Product; sold: number }[];
}
