export type UserRole = 'super_admin' | 'owner' | 'admin' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  phone?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category_id: number;
  category_name?: string;
  price: number;
  compare_at_price?: number;
  cost_price: number;
  stock: number;
  min_stock_alert: number;
  description: string;
  short_description?: string;
  images: string[];
  flower_types: string[];
  occasion_tags: string[];
  care_instructions?: string;
  is_featured: number;
  is_available: number;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export type OrderType = 'online_delivery' | 'online_pickup' | 'pos_walkin';
export type OrderStatus = 'pending' | 'confirmed' | 'arranging' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'cash' | 'card' | 'digital_wallet' | 'cod' | 'qrph' | 'gcash' | 'maya';
export type OrderSource = 'web' | 'pos';

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  delivery_date?: string;
  delivery_time_slot?: string;
  recipient_name?: string;
  recipient_phone?: string;
  delivery_address?: string;
  card_message?: string;
  notes?: string;
  source: OrderSource;
  created_by_user_id?: number | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Discount {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  min_spend: number;
  max_uses?: number;
  used_count: number;
  expires_at?: string;
  is_active: number;
}

export interface POSSession {
  id: number;
  cashier_id: number;
  cashier_name?: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash?: number;
  total_sales: number;
  notes?: string;
  status: 'open' | 'closed';
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string | number;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface StoreSetting {
  id: number;
  key: string;
  value: string;
}

// Request Augmentation
export interface AuthUserPayload {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
