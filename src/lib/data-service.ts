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

// Storage helper functions with in-memory fallback and quota protection
const memoryStorage: Record<string, any> = {};

function getItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      memoryStorage[key] = parsed;
      return parsed;
    }
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
  }
  return memoryStorage[key] !== undefined ? memoryStorage[key] : defaultVal;
}

function setItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  memoryStorage[key] = val;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err: any) {
    console.error(`Error writing ${key} to localStorage:`, err);
    // Handle QuotaExceededError by sanitizing oversized base64 images
    if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(val)) {
      try {
        const sanitized = (val as any[]).map((p) => ({
          ...p,
          images: (p.images || []).map((img: any) => ({
            ...img,
            image_url:
              img.image_url && img.image_url.startsWith('data:') && img.image_url.length > 80000
                ? 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80'
                : img.image_url,
          })),
        }));
        localStorage.setItem(key, JSON.stringify(sanitized));
      } catch (innerErr) {
        console.error('Failed fallback write to localStorage:', innerErr);
      }
    }
  }
}

const INIT_FLAG_KEY = 'aroza_app_initialized_v2';

// Seed initializer
export function initLocalStorage(forceReset: boolean = false): void {
  if (typeof window === 'undefined') return;

  const hasInitialized = localStorage.getItem(INIT_FLAG_KEY);

  if (forceReset) {
    setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setItem(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    setItem(STORAGE_KEYS.SALES, INITIAL_SALES);
    setItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setItem(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    setItem(STORAGE_KEYS.RECONCILIATIONS, []);
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    localStorage.setItem(INIT_FLAG_KEY, 'true');
    return;
  }

  // If already initialized once, DO NOT OVERWRITE user data with demo data
  if (hasInitialized) return;

  const allowSeed = process.env.NEXT_PUBLIC_ENABLE_SEED === 'true' || process.env.NODE_ENV === 'development';
  if (!allowSeed) {
    localStorage.setItem(INIT_FLAG_KEY, 'true');
    return;
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
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
  localStorage.setItem(INIT_FLAG_KEY, 'true');
}

// Clear all local data on reset
export function clearAllLocalStorage(): void {
  if (typeof window === 'undefined') return;
  setItem(STORAGE_KEYS.PRODUCTS, []);
  setItem(STORAGE_KEYS.PURCHASES, []);
  setItem(STORAGE_KEYS.SALES, []);
  setItem(STORAGE_KEYS.EXPENSES, []);
  setItem(STORAGE_KEYS.SUPPLIERS, []);
  setItem(STORAGE_KEYS.CATEGORIES, []);
  setItem(STORAGE_KEYS.MOVEMENTS, []);
  setItem(STORAGE_KEYS.RECONCILIATIONS, []);
  localStorage.setItem(INIT_FLAG_KEY, 'true');
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

export async function deleteCategory(idOrName: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('categories').delete().or(`id.eq.${idOrName},name.eq.${idOrName}`);
  }

  const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const filtered = categories.filter(
    (c) => c.id !== idOrName && c.name.toLowerCase() !== idOrName.toLowerCase()
  );
  setItem(STORAGE_KEYS.CATEGORIES, filtered);

  // Also update products using this category to default 'Collectible'
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  let updated = false;
  const newProducts = products.map((p) => {
    if (p.category_id === idOrName || p.category_name?.toLowerCase() === idOrName.toLowerCase()) {
      updated = true;
      return { ...p, category_id: undefined, category_name: 'Collectible' };
    }
    return p;
  });
  if (updated) {
    setItem(STORAGE_KEYS.PRODUCTS, newProducts);
  }

  return true;
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

export async function deleteSupplier(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('suppliers').delete().eq('id', id);
  }

  const suppliers = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  const filtered = suppliers.filter((s) => s.id !== id);
  setItem(STORAGE_KEYS.SUPPLIERS, filtered);
  return true;
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

    if (!error && data) {
      return data.map((p: any) => ({
        ...p,
        current_stock: Number(p.current_stock ?? 0),
        purchase_price_default: Number(p.purchase_price_default ?? 0),
        selling_price_default: Number(p.selling_price_default ?? 0),
        images: (p.product_images && p.product_images.length > 0) ? p.product_images : p.images || [],
      }));
    }
  }
  initLocalStorage();
  const raw = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  return raw.map((p) => ({
    ...p,
    current_stock: Number(p.current_stock ?? 0),
    purchase_price_default: Number(p.purchase_price_default ?? 0),
    selling_price_default: Number(p.selling_price_default ?? 0),
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function saveProduct(product: Partial<Product>): Promise<Product> {
  const cleanStock = Number(product.current_stock ?? 0);
  const cleanPurchasePrice = Number(product.purchase_price_default ?? 0);
  const cleanSellingPrice = Number(product.selling_price_default ?? 0);

  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

  if (product.id) {
    const idx = products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        ...product,
        current_stock: cleanStock,
        purchase_price_default: cleanPurchasePrice,
        selling_price_default: cleanSellingPrice,
        updated_at: new Date().toISOString(),
      };
      setItem(STORAGE_KEYS.PRODUCTS, products);

      if (isSupabaseConfigured() && supabase) {
        const { images, category_name, supplier_name, ...dbPayload } = products[idx] as any;
        await supabase.from('products').update(dbPayload).eq('id', product.id);
      }

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
    purchase_price_default: cleanPurchasePrice,
    selling_price_default: cleanSellingPrice,
    instagram_price: Number(product.instagram_price ?? cleanSellingPrice),
    meesho_price: Number(product.meesho_price ?? cleanSellingPrice),
    direct_price: Number(product.direct_price ?? cleanSellingPrice),
    other_platform_price: Number(product.other_platform_price ?? cleanSellingPrice),
    min_reorder_level: Number(product.min_reorder_level ?? 5),
    current_stock: cleanStock,
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

  if (isSupabaseConfigured() && supabase) {
    const { images, category_name, supplier_name, ...dbPayload } = newProduct as any;
    const { data } = await supabase.from('products').insert([dbPayload]).select().single();
    if (data && newProduct.images && newProduct.images.length > 0) {
      const imgPayloads = newProduct.images.map((img) => ({
        product_id: data.id,
        image_url: img.image_url,
        is_main: img.is_main,
        display_order: img.display_order,
      }));
      await supabase.from('product_images').insert(imgPayloads);
    }
  }

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

  const systemStock = Number(product.current_stock ?? 0);
  const difference = Number(physicalStock) - systemStock;

  if (difference === 0) return product;

  const updatedProduct: Product = {
    ...product,
    current_stock: Number(physicalStock),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('products').update({ current_stock: Number(physicalStock) }).eq('id', productId);
    await supabase.from('reconciliations').insert([
      {
        product_id: productId,
        system_stock: systemStock,
        physical_stock: Number(physicalStock),
        difference,
        reason,
      },
    ]);
  }

  const allProds = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const pIdx = allProds.findIndex((p) => p.id === productId);
  if (pIdx !== -1) {
    allProds[pIdx] = updatedProduct;
    setItem(STORAGE_KEYS.PRODUCTS, allProds);
  }

  await recordStockMovement({
    product_id: productId,
    product_name: product.name,
    movement_type: 'ADJUSTMENT',
    reference_type: 'RECONCILIATION',
    quantity_changed: difference,
    cost_per_unit: Number(product.purchase_price_default || 0),
    resulting_stock: Number(physicalStock),
    notes: `Reconciliation Audit: ${reason} (System: ${systemStock} -> Physical: ${physicalStock})`,
  });

  const reconciliations = getItem<ReconciliationRecord[]>(STORAGE_KEYS.RECONCILIATIONS, []);
  reconciliations.unshift({
    id: `rec-${Date.now()}`,
    product_id: productId,
    product_name: product.name,
    system_stock: systemStock,
    physical_stock: Number(physicalStock),
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
    const { data, error } = await supabase
      .from('purchases')
      .select('*, purchase_items(*)')
      .order('purchase_date', { ascending: false });

    if (!error && data) {
      return data.map((p: any) => ({
        ...p,
        total_amount: Number(p.total_amount || 0),
        items: (p.purchase_items || p.items || []).map((i: any) => ({
          ...i,
          quantity: Number(i.quantity || 0),
          unit_cost: Number(i.unit_cost || 0),
          total_cost: Number(i.total_cost || 0),
        })),
      }));
    }
  }
  initLocalStorage();
  const raw = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  return raw.map((p) => ({
    ...p,
    total_amount: Number(p.total_amount || 0),
    items: (p.items || []).map((i) => ({
      ...i,
      quantity: Number(i.quantity || 0),
      unit_cost: Number(i.unit_cost || 0),
      total_cost: Number(i.total_cost || 0),
    })),
  }));
}

export async function recordPurchase(purchaseData: Omit<Purchase, 'id' | 'created_at'>): Promise<Purchase> {
  const newPurchase: Purchase = {
    ...purchaseData,
    id: `pur-${Date.now()}`,
    total_amount: Number(purchaseData.total_amount || 0),
    created_at: new Date().toISOString(),
  };

  const purchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  purchases.unshift(newPurchase);
  setItem(STORAGE_KEYS.PURCHASES, purchases);

  // Update product stocks with Weighted Average Unit Cost recalculation
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  for (const item of newPurchase.items) {
    const pIdx = products.findIndex((p) => p.id === item.product_id);
    if (pIdx !== -1) {
      const prod = products[pIdx];
      const oldStock = Number(prod.current_stock ?? 0);
      const oldAvgCost = Number(prod.purchase_price_default ?? 0);
      const newQty = Number(item.quantity ?? 0);
      const newUnitCost = Number(item.unit_cost ?? 0);

      const newStock = oldStock + newQty;
      const weightedAvgCost = newStock > 0
        ? Math.round((((oldStock * oldAvgCost) + (newQty * newUnitCost)) / newStock + Number.EPSILON) * 100) / 100
        : newUnitCost;

      products[pIdx].current_stock = newStock;
      products[pIdx].purchase_price_default = weightedAvgCost;

      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('products')
          .update({ current_stock: newStock, purchase_price_default: weightedAvgCost })
          .eq('id', prod.id);
      }

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
      suppliers[sIdx].total_purchased_amount = (Number(suppliers[sIdx].total_purchased_amount) || 0) + newPurchase.total_amount;
      suppliers[sIdx].total_purchases_count = (Number(suppliers[sIdx].total_purchases_count) || 0) + 1;
      suppliers[sIdx].last_purchase_date = newPurchase.purchase_date;
      setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    }
  }

  if (isSupabaseConfigured() && supabase) {
    const { items, ...dbPurchase } = newPurchase as any;
    const { data } = await supabase.from('purchases').insert([dbPurchase]).select().single();
    if (data && newPurchase.items && newPurchase.items.length > 0) {
      const itemsPayload = newPurchase.items.map((i) => ({
        purchase_id: data.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        total_cost: i.total_cost,
      }));
      await supabase.from('purchase_items').insert(itemsPayload);
    }
  }

  return newPurchase;
}

export async function updatePurchase(purchase: Purchase): Promise<Purchase> {
  const purchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  const idx = purchases.findIndex((p) => p.id === purchase.id);
  if (idx !== -1) {
    const oldPurchase = purchases[idx];
    const updatedPurchase: Purchase = {
      ...oldPurchase,
      ...purchase,
      total_amount: Number(purchase.total_amount || 0),
    };
    purchases[idx] = updatedPurchase;
    setItem(STORAGE_KEYS.PURCHASES, purchases);

    // Update product current_stock with difference between old and new item quantities
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    for (const newItem of updatedPurchase.items || []) {
      const oldItem = (oldPurchase.items || []).find((i) => i.product_id === newItem.product_id);
      const oldQty = oldItem ? Number(oldItem.quantity || 0) : 0;
      const newQty = Number(newItem.quantity || 0);
      const deltaQty = newQty - oldQty;

      const pIdx = products.findIndex((p) => p.id === newItem.product_id);
      if (pIdx !== -1) {
        products[pIdx].current_stock = Math.max(0, Number(products[pIdx].current_stock || 0) + deltaQty);
        if (newItem.unit_cost) {
          products[pIdx].purchase_price_default = Number(newItem.unit_cost);
        }
      }
    }
    setItem(STORAGE_KEYS.PRODUCTS, products);

    if (isSupabaseConfigured() && supabase) {
      const { items, ...dbPurchase } = updatedPurchase as any;
      await supabase.from('purchases').update(dbPurchase).eq('id', purchase.id);
    }
    return updatedPurchase;
  }
  return purchase;
}

export async function deletePurchase(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('purchases').delete().eq('id', id);
  }
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
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('sale_date', { ascending: false });

    if (!error && data) {
      return data.map((s: any) => ({
        ...s,
        total_revenue: Number(s.total_revenue || 0),
        total_cost: Number(s.total_cost || 0),
        net_profit: Number(s.net_profit || 0),
        total_selling_expenses: Number(s.total_selling_expenses || 0),
        items: (s.sale_items || s.items || []).map((i: any) => ({
          ...i,
          quantity: Number(i.quantity || 0),
          unit_price: Number(i.unit_price || 0),
          unit_cost: Number(i.unit_cost || 0),
        })),
      }));
    }
  }
  initLocalStorage();
  const raw = getItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  return raw.map((s) => ({
    ...s,
    total_revenue: Number(s.total_revenue || 0),
    total_cost: Number(s.total_cost || 0),
    net_profit: Number(s.net_profit || 0),
    total_selling_expenses: Number(s.total_selling_expenses || 0),
    items: (s.items || []).map((i) => ({
      ...i,
      quantity: Number(i.quantity || 0),
      unit_price: Number(i.unit_price || 0),
      unit_cost: Number(i.unit_cost || 0),
    })),
  }));
}

export async function recordSale(saleData: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
  const newSale: Sale = {
    ...saleData,
    id: `sale-${Date.now()}`,
    total_revenue: Number(saleData.total_revenue || 0),
    total_cost: Number(saleData.total_cost || 0),
    net_profit: Number(saleData.net_profit || 0),
    total_selling_expenses: Number(saleData.total_selling_expenses || 0),
    created_at: new Date().toISOString(),
  };

  const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  sales.unshift(newSale);
  setItem(STORAGE_KEYS.SALES, sales);

  // Decrement product inventory (allows negative stock for backorders)
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  for (const item of newSale.items) {
    const pIdx = products.findIndex((p) => p.id === item.product_id);
    if (pIdx !== -1) {
      const prod = products[pIdx];
      const currentStock = Number(prod.current_stock ?? 0);
      const newStock = currentStock - Number(item.quantity || 0);
      products[pIdx].current_stock = newStock;

      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', prod.id);
      }

      await recordStockMovement({
        product_id: prod.id,
        product_name: prod.name,
        movement_type: 'SALE',
        reference_id: newSale.id,
        reference_type: 'SALE',
        quantity_changed: -Number(item.quantity || 0),
        cost_per_unit: Number(item.unit_cost || 0),
        resulting_stock: newStock,
        notes: `Sold via ${newSale.platform} (${newSale.order_number})`,
      });
    }
  }
  setItem(STORAGE_KEYS.PRODUCTS, products);

  if (isSupabaseConfigured() && supabase) {
    const { items, total_selling_expenses, ...dbSale } = newSale as any;
    const { data } = await supabase.from('sales').insert([dbSale]).select().single();
    if (data && newSale.items && newSale.items.length > 0) {
      const itemsPayload = newSale.items.map((i) => ({
        sale_id: data.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        unit_cost: i.unit_cost,
      }));
      await supabase.from('sale_items').insert(itemsPayload);
    }
  }

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
  const updatedRefund = Math.min(sale.total_revenue, (Number(sale.refund_amount) || 0) + Number(refundAmount));

  const updatedSale: Sale = {
    ...sale,
    refund_amount: updatedRefund,
    payment_status: updatedRefund >= sale.total_revenue ? 'Refunded' : 'Paid',
    fulfillment_status: restockItems ? 'Returned' : 'Partial Return',
    notes: `${sale.notes || ''} [Refund ₹${refundAmount}: ${reason}]`,
  };

  if (isSupabaseConfigured() && supabase) {
    const { items, total_selling_expenses, ...dbSale } = updatedSale as any;
    await supabase.from('sales').update(dbSale).eq('id', saleId);
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
        const newStock = Number(prod.current_stock ?? 0) + Number(item.quantity || 0);
        const newReturned = (Number(prod.returned_qty) || 0) + Number(item.quantity || 0);

        products[pIdx].current_stock = newStock;
        products[pIdx].returned_qty = newReturned;

        if (isSupabaseConfigured() && supabase) {
          await supabase
            .from('products')
            .update({ current_stock: newStock, returned_qty: newReturned })
            .eq('id', prod.id);
        }

        await recordStockMovement({
          product_id: prod.id,
          product_name: prod.name,
          movement_type: 'RETURN',
          reference_id: sale.id,
          reference_type: 'SALE',
          quantity_changed: Number(item.quantity || 0),
          cost_per_unit: Number(item.unit_cost || 0),
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
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('sales').delete().eq('id', id);
  }
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
    if (!error && data) {
      return data.map((e: any) => ({ ...e, amount: Number(e.amount || 0) }));
    }
  }
  initLocalStorage();
  const raw = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  return raw.map((e) => ({ ...e, amount: Number(e.amount || 0) }));
}

export async function recordExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const newExpense: Expense = {
    ...expenseData,
    amount: Number(expenseData.amount || 0),
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
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('expenses').delete().eq('id', id);
  }
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
