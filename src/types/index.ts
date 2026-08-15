export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type Platform = 'Instagram' | 'Meesho' | 'WhatsApp' | 'Direct' | 'Other';

export type ExpenseCategory =
  | 'Transportation'
  | 'Petrol'
  | 'Packaging'
  | 'Marketing'
  | 'Advertising'
  | 'Shipping'
  | 'Platform fees'
  | 'Printing'
  | 'Equipment'
  | 'Miscellaneous';

export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'DAMAGED'
  | 'ADJUSTMENT'
  | 'REFUND';

export type FulfillmentStatus = 'Completed' | 'Returned' | 'Partial Return' | 'Cancelled';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_number?: string;
  location?: string;
  notes?: string;
  products_supplied_count?: number;
  total_purchased_amount?: number;
  total_purchases_count?: number;
  last_purchase_date?: string;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_main: boolean;
  display_order: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id?: string;
  category_name?: string;
  subcategory?: string;
  description?: string;
  brand?: string;
  tags?: string[];
  supplier_id?: string;
  supplier_name?: string;
  
  // Prices
  purchase_price_default: number; // Cost price per unit
  selling_price_default: number;  // Default selling price
  instagram_price?: number;
  meesho_price?: number;
  direct_price?: number;
  other_platform_price?: number;
  
  // Stock levels
  min_reorder_level: number;
  current_stock: number;
  damaged_qty: number;
  returned_qty: number;
  total_purchased?: number;
  total_sold?: number;
  
  // Calculated financial metrics per product
  avg_purchase_cost?: number;
  revenue_generated?: number;
  gross_profit?: number;
  net_profit?: number;
  profit_margin?: number;
  potential_remaining_profit?: number;
  inventory_value?: number;
  
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_date: string;
  transport_cost: number;
  packaging_cost: number;
  other_expenses: number;
  payment_method: string;
  notes?: string;
  invoice_url?: string;
  total_amount: number;
  items: PurchaseItem[];
  created_at?: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price?: number;
}

export interface Sale {
  id: string;
  order_number: string;
  sale_date: string;
  platform: Platform;
  customer_name?: string;
  shipping_charged: number;
  shipping_cost: number;
  platform_fee: number;
  packaging_cost: number;
  discount: number;
  other_expense: number;
  payment_status: 'Paid' | 'Pending' | 'Refunded' | 'Cancelled';
  fulfillment_status?: FulfillmentStatus;
  refund_amount?: number;
  notes?: string;
  total_revenue: number; // Items subtotal + shipping charged - discount - refunds
  total_cost: number;    // COGS
  total_selling_expenses: number; // shipping cost + platform fee + packaging cost + other
  net_profit: number;
  profit_margin: number;
  items: SaleItem[];
  created_at?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  product_id?: string;
  product_name?: string;
  receipt_url?: string;
  created_at?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  movement_type: StockMovementType;
  reference_id?: string;
  reference_type?: 'PURCHASE' | 'SALE' | 'EXPENSE' | 'RECONCILIATION' | 'MANUAL';
  quantity_changed: number;
  cost_per_unit: number;
  resulting_stock: number;
  notes?: string;
  created_at: string;
}

export interface ReconciliationRecord {
  id: string;
  product_id: string;
  product_name?: string;
  system_stock: number;
  physical_stock: number;
  difference: number;
  reason: string;
  created_at: string;
}

export interface Settings {
  business_name: string;
  currency: string;
  default_platform: Platform;
  default_packaging_cost: number;
  default_shipping_cost: number;
  low_stock_threshold: number;
  theme_preference: 'warm' | 'dark' | 'light';
}

export type DateFilterOption = 'Today' | 'This week' | 'This month' | 'Last month' | 'This year' | 'Custom';

export interface DashboardStats {
  total_revenue: number;
  total_profit: number;
  total_investment: number;
  current_inventory_value: number;
  total_products: number;
  total_units_in_stock: number;
  units_sold: number;
  total_expenses: number;
  gross_profit: number;
  overall_profit_margin: number;
}

export interface CashFlowStats {
  cashReceived: number;
  cashSpent: number;
  netCashFlow: number;
  outstandingPayments: number;
  totalRefunds: number;
}
