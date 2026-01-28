// Tipos para el Sistema Punto de Venta

export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  purchase_price: number;
  sale_price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number | null;
  stock: number;
  min_stock: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  ticket_number: number;
  user_id: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_received: number;
  change_given: number;
  payment_method: 'cash' | 'credit' | 'card';
  is_credit: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items?: SaleItem[];
  customer?: Customer;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  created_at: string;
  product?: Product;
}

export interface TicketItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

export interface PendingTicket {
  id: string;
  user_id: string;
  customer_id: string | null;
  items: TicketItem[];
  notes: string | null;
  created_at: string;
  customer?: Customer;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  user_id: string;
  movement_type: 'entry' | 'exit' | 'adjustment' | 'sale';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  reference_id: string | null;
  created_at: string;
  product?: Product;
}

export interface CreditPayment {
  id: string;
  customer_id: string;
  sale_id: string | null;
  user_id: string;
  amount: number;
  notes: string | null;
  created_at: string;
  customer?: Customer;
  sale?: Sale;
}

export interface CashRegisterCut {
  id: string;
  user_id: string;
  opening_amount: number;
  expected_amount: number;
  actual_amount: number;
  difference: number;
  cash_sales: number;
  credit_sales: number;
  card_sales: number;
  credit_payments_received: number;
  total_transactions: number;
  notes: string | null;
  cut_date: string;
  created_at: string;
}

export interface BusinessConfig {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'cajero';
}
