import {
  Product,
  Purchase,
  Sale,
  Expense,
  Supplier,
  Category,
  StockMovement,
  Settings,
  StockMovementType,
  Platform,
  ReconciliationRecord,
} from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  INITIAL_PRODUCTS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_SUPPLIERS,
  INITIAL_CATEGORIES,
  INITIAL_MOVEMENTS,
  INITIAL_SETTINGS,
} from './seed-data';

const STORAGE_KEYS = {
  PRODUCTS: 'aroza_products',
  PURCHASES: 'aroza_purchases',
  SALES: 'aroza_sales',
  EXPENSES: 'aroza_expenses',
  SUPPLIERS: 'aroza_suppliers',
  CATEGORIES: 'aroza_categories',
  MOVEMENTS: 'aroza_movements',
  RECONCILIATIONS: 'aroza_reconciliations',
  SETTINGS: 'aroza_settings',
};

// Storage helper functions
function getItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// Seed initializer
export function initLocalStorage(forceReset: boolean = false): void {
  if (typeof window === 'undefined') return;

  if (forceReset || !localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setItem(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    setItem(STORAGE_KEYS.SALES, INITIAL_SALES);
    setItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setItem(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    setItem(STORAGE_KEYS.RECONCILIATIONS, []);
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
}

// ==========================================
// CATEGORIES SERVICE
// ==========================================
export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) return data;
  }
  initLocalStorage();
  return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export async function addCategory(category: Partial<Category>): Promise<Category> {
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: category.name || 'New Category',
    slug: category.name?.toLowerCase().replace(/\s+/g, '-') || 'new-category',
    description: category.description || '',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('categories').insert([newCat]).select().single();
    if (!error && data) return data;
  }

  const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  categories.push(newCat);
  setItem(STORAGE_KEYS.CATEGORIES, categories);
  return newCat;
}

// ==========================================
// SUPPLIERS SERVICE
// ==========================================
export async function getSuppliers(): Promise<Supplier[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (!error && data) return data;
  }
  initLocalStorage();
  return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
}

export async function saveSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  if (isSupabaseConfigured() && supabase) {
    if (supplier.id) {
      const { data } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id).select().single();
      if (data) return data;
    } else {
      const { data } = await supabase.from('suppliers').insert([supplier]).select().single();
      if (data) return data;
    }
  }

  const suppliers = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  if (supplier.id) {
    const idx = suppliers.findIndex((s) => s.id === supplier.id);
    if (idx !== -1) {
      suppliers[idx] = { ...suppliers[idx], ...supplier };
      setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
      return suppliers[idx];
    }
  }

  const newSupplier: Supplier = {
    id: `sup-${Date.now()}`,
    name: supplier.name || 'Unnamed Supplier',
    contact_number: supplier.contact_number || '',
    location: supplier.location || '',
    notes: supplier.notes || '',
    products_supplied_count: 0,
    total_purchased_amount: 0,
    total_purchases_count: 0,
    created_at: new Date().toISOString(),
  };

  suppliers.push(newSupplier);
  setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  return newSupplier;
}

// ==========================================
// PRODUCTS SERVICE
// ==========================================
export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  initLocalStorage();
  return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function saveProduct(product: Partial<Product>): Promise<Product> {
  if (isSupabaseConfigured() && supabase) {
    if (product.id) {
      const { data } = await supabase.from('products').update(product).eq('id', product.id).select().single();
      if (data) return data;
    } else {
      const { data } = await supabase.from('products').insert([product]).select().single();
      if (data) return data;
    }
  }

  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

  if (product.id) {
    const idx = products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        ...product,
        updated_at: new Date().toISOString(),
      };
      setItem(STORAGE_KEYS.PRODUCTS, products);
      return products[idx];
    }
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: product.name || 'New Collectible Product',
    sku: product.sku || `ARO-${Math.floor(1000 + Math.random() * 9000)}`,
    category_id: product.category_id || 'cat-1',
    category_name: product.category_name || 'Keychains',
    subcategory: product.subcategory || '',
    description: product.description || '',
    brand: product.brand || 'Aroza Collectibles',
    tags: product.tags || [],
    supplier_id: product.supplier_id || '',
    supplier_name: product.supplier_name || '',
    purchase_price_default: product.purchase_price_default || 0,
    selling_price_default: product.selling_price_default || 0,
    instagram_price: product.instagram_price || product.selling_price_default || 0,
    meesho_price: product.meesho_price || product.selling_price_default || 0,
    direct_price: product.direct_price || product.selling_price_default || 0,
    other_platform_price: product.other_platform_price || product.selling_price_default || 0,
    min_reorder_level: product.min_reorder_level || 5,
    current_stock: product.current_stock || 0,
    damaged_qty: 0,
    returned_qty: 0,
    images: product.images || [
      {
        id: `img-${Date.now()}`,
        product_id: `prod-${Date.now()}`,
        image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80',
        is_main: true,
        display_order: 0,
      },
    ],
    created_at: new Date().toISOString(),
  };

  products.unshift(newProduct);
  setItem(STORAGE_KEYS.PRODUCTS, products);

  // Log initial stock movement if initial stock > 0
  if (newProduct.current_stock > 0) {
    await recordStockMovement({
      product_id: newProduct.id,
      product_name: newProduct.name,
      movement_type: 'ADJUSTMENT',
      quantity_changed: newProduct.current_stock,
      cost_per_unit: newProduct.purchase_price_default,
      resulting_stock: newProduct.current_stock,
      notes: 'Initial inventory stock entry',
    });
  }

  return newProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('products').delete().eq('id', id);
  }

  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const filtered = products.filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PRODUCTS, filtered);
  return true;
}

// ==========================================
// INVENTORY RECONCILIATION FEATURE
// ==========================================
export async function reconcileInventory(
  productId: string,
  physicalStock: number,
  reason: string
): Promise<Product | null> {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return null;

  const systemStock = product.current_stock || 0;
  const difference = physicalStock - systemStock;

  if (difference === 0) return product; // No change needed

  const updatedProduct: Product = {
    ...product,
    current_stock: physicalStock,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('products').update({ current_stock: physicalStock }).eq('id', productId);
    await supabase.from('reconciliations').insert([
      {
        product_id: productId,
        system_stock: systemStock,
        physical_stock: physicalStock,
        difference,
        reason,
      },
    ]);
  }

  // Update localStorage
  const allProds = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const pIdx = allProds.findIndex((p) => p.id === productId);
  if (pIdx !== -1) {
    allProds[pIdx] = updatedProduct;
    setItem(STORAGE_KEYS.PRODUCTS, allProds);
  }

  // Create audit stock movement
  await recordStockMovement({
    product_id: productId,
    product_name: product.name,
    movement_type: 'ADJUSTMENT',
    reference_type: 'RECONCILIATION',
    quantity_changed: difference,
    cost_per_unit: product.purchase_price_default || 0,
    resulting_stock: physicalStock,
    notes: `Reconciliation Audit: ${reason} (System: ${systemStock} -> Physical: ${physicalStock})`,
  });

  const reconciliations = getItem<ReconciliationRecord[]>(STORAGE_KEYS.RECONCILIATIONS, []);
  reconciliations.unshift({
    id: `rec-${Date.now()}`,
    product_id: productId,
    product_name: product.name,
    system_stock: systemStock,
    physical_stock: physicalStock,
    difference,
    reason,
    created_at: new Date().toISOString(),
  });
  setItem(STORAGE_KEYS.RECONCILIATIONS, reconciliations);

  return updatedProduct;
}

export async function getReconciliations(): Promise<ReconciliationRecord[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('reconciliations').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  return getItem<ReconciliationRecord[]>(STORAGE_KEYS.RECONCILIATIONS, []);
}

// ==========================================
// PURCHASES SERVICE
// ==========================================
export async function getPurchases(): Promise<Purchase[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('purchases').select('*, purchase_items(*)').order('purchase_date', { ascending: false });
    if (!error && data) return data;
  }
  initLocalStorage();
  return getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
}

export async function recordPurchase(purchaseData: Omit<Purchase, 'id' | 'created_at'>): Promise<Purchase> {
  const newPurchase: Purchase = {
    ...purchaseData,
    id: `pur-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('purchases').insert([newPurchase]).select().single();
    if (data) return data;
  }

  const purchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  purchases.unshift(newPurchase);
  setItem(STORAGE_KEYS.PURCHASES, purchases);

  // Update product stocks with Weighted Average Unit Cost recalculation
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  for (const item of newPurchase.items) {
    const pIdx = products.findIndex((p) => p.id === item.product_id);
    if (pIdx !== -1) {
      const prod = products[pIdx];
      const oldStock = prod.current_stock || 0;
      const oldAvgCost = prod.purchase_price_default || 0;
      const newQty = item.quantity;
      const newUnitCost = item.unit_cost;

      // Weighted Average Unit Cost formula
      const newStock = oldStock + newQty;
      const weightedAvgCost = newStock > 0
        ? Math.round((((oldStock * oldAvgCost) + (newQty * newUnitCost)) / newStock + Number.EPSILON) * 100) / 100
        : newUnitCost;

      products[pIdx].current_stock = newStock;
      products[pIdx].purchase_price_default = weightedAvgCost;

      await recordStockMovement({
        product_id: prod.id,
        product_name: prod.name,
        movement_type: 'PURCHASE',
        reference_id: newPurchase.id,
        reference_type: 'PURCHASE',
        quantity_changed: newQty,
        cost_per_unit: newUnitCost,
        resulting_stock: newStock,
        notes: `Purchase Order ${newPurchase.purchase_number} (New Weighted Avg Cost: ₹${weightedAvgCost})`,
      });
    }
  }
  setItem(STORAGE_KEYS.PRODUCTS, products);

  // Update supplier totals
  if (newPurchase.supplier_id) {
    const suppliers = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    const sIdx = suppliers.findIndex((s) => s.id === newPurchase.supplier_id);
    if (sIdx !== -1) {
      suppliers[sIdx].total_purchased_amount = (suppliers[sIdx].total_purchased_amount || 0) + newPurchase.total_amount;
      suppliers[sIdx].total_purchases_count = (suppliers[sIdx].total_purchases_count || 0) + 1;
      suppliers[sIdx].last_purchase_date = newPurchase.purchase_date;
      setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    }
  }

  return newPurchase;
}

export async function deletePurchase(id: string): Promise<boolean> {
  const purchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  const filtered = purchases.filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PURCHASES, filtered);
  return true;
}

// ==========================================
// SALES SERVICE & REFUNDS / RETURNS
// ==========================================
export async function getSales(): Promise<Sale[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('sales').select('*, sale_items(*)').order('sale_date', { ascending: false });
    if (!error && data) return data;
  }
  initLocalStorage();
  return getItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
}

export async function recordSale(saleData: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
  const newSale: Sale = {
    ...saleData,
    id: `sale-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('sales').insert([newSale]).select().single();
    if (data) return data;
  }

  const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  sales.unshift(newSale);
  setItem(STORAGE_KEYS.SALES, sales);

  // Decrement product inventory and record stock movements
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  for (const item of newSale.items) {
    const pIdx = products.findIndex((p) => p.id === item.product_id);
    if (pIdx !== -1) {
      const prod = products[pIdx];
      const newStock = Math.max(0, (prod.current_stock || 0) - item.quantity);
      products[pIdx].current_stock = newStock;

      await recordStockMovement({
        product_id: prod.id,
        product_name: prod.name,
        movement_type: 'SALE',
        reference_id: newSale.id,
        reference_type: 'SALE',
        quantity_changed: -item.quantity,
        cost_per_unit: item.unit_cost,
        resulting_stock: newStock,
        notes: `Sold via ${newSale.platform} (${newSale.order_number})`,
      });
    }
  }
  setItem(STORAGE_KEYS.PRODUCTS, products);

  return newSale;
}

export async function processSaleRefund(
  saleId: string,
  refundAmount: number,
  restockItems: boolean,
  reason: string
): Promise<Sale | null> {
  const sales = await getSales();
  const sIdx = sales.findIndex((s) => s.id === saleId);
  if (sIdx === -1) return null;

  const sale = sales[sIdx];
  const updatedRefund = Math.min(sale.total_revenue, (sale.refund_amount || 0) + refundAmount);

  const updatedSale: Sale = {
    ...sale,
    refund_amount: updatedRefund,
    payment_status: updatedRefund >= sale.total_revenue ? 'Refunded' : 'Paid',
    fulfillment_status: restockItems ? 'Returned' : 'Partial Return',
    notes: `${sale.notes || ''} [Refund ₹${refundAmount}: ${reason}]`,
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('sales').update(updatedSale).eq('id', saleId);
  }

  sales[sIdx] = updatedSale;
  setItem(STORAGE_KEYS.SALES, sales);

  // If physical product restock is confirmed, increase stock & log RETURN movement
  if (restockItems) {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    for (const item of sale.items) {
      const pIdx = products.findIndex((p) => p.id === item.product_id);
      if (pIdx !== -1) {
        const prod = products[pIdx];
        const newStock = (prod.current_stock || 0) + item.quantity;
        const newReturned = (prod.returned_qty || 0) + item.quantity;

        products[pIdx].current_stock = newStock;
        products[pIdx].returned_qty = newReturned;

        await recordStockMovement({
          product_id: prod.id,
          product_name: prod.name,
          movement_type: 'RETURN',
          reference_id: sale.id,
          reference_type: 'SALE',
          quantity_changed: item.quantity,
          cost_per_unit: item.unit_cost,
          resulting_stock: newStock,
          notes: `Physically Restocked from Sale Refund ${sale.order_number}: ${reason}`,
        });
      }
    }
    setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  return updatedSale;
}

export async function deleteSale(id: string): Promise<boolean> {
  const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  const filtered = sales.filter((s) => s.id !== id);
  setItem(STORAGE_KEYS.SALES, filtered);
  return true;
}

// ==========================================
// EXPENSES SERVICE
// ==========================================
export async function getExpenses(): Promise<Expense[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (!error && data) return data;
  }
  initLocalStorage();
  return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
}

export async function recordExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const newExpense: Expense = {
    ...expenseData,
    id: `exp-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('expenses').insert([newExpense]).select().single();
    if (data) return data;
  }

  const expenses = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  expenses.unshift(newExpense);
  setItem(STORAGE_KEYS.EXPENSES, expenses);
  return newExpense;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const expenses = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  const filtered = expenses.filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.EXPENSES, filtered);
  return true;
}

// ==========================================
// STOCK MOVEMENT SERVICE
// ==========================================
export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (!error && data) return data;
  }

  initLocalStorage();
  const movements = getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  if (productId) {
    return movements.filter((m) => m.product_id === productId);
  }
  return movements;
}

export async function recordStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
  const newMovement: StockMovement = {
    ...movement,
    id: `mov-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('stock_movements').insert([newMovement]);
  }

  const movements = getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  movements.unshift(newMovement);
  setItem(STORAGE_KEYS.MOVEMENTS, movements);
  return newMovement;
}

// ==========================================
// SETTINGS SERVICE
// ==========================================
export async function getSettings(): Promise<Settings> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) return data;
  }
  initLocalStorage();
  return getItem<Settings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('settings').upsert(updated);
  }

  setItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}
