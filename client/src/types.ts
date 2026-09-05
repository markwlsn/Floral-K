export type UserRole = 'super_admin' | 'owner' | 'admin' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active?: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  product_count?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
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
  origin?: string;
  scent_notes?: string;
  dimensions?: string;
  stem_recipe?: string;
  is_featured: number;
  is_available: number;
  barcode?: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'arranging' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  order_type: 'online_delivery' | 'online_pickup' | 'pos_walkin';
  status: OrderStatus;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method: 'cash' | 'card' | 'digital_wallet' | 'cod' | 'qrph' | 'gcash' | 'maya';
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
  source: 'web' | 'pos';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
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

export interface POSReceipt {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  orderNumber: string;
  date: string;
  cashierName: string;
  customerName: string;
  items: {
    productId: number;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  changeDue: number;
  footer: string;
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

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
