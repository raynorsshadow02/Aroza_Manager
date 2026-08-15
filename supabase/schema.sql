-- ==============================================================================
-- AROZA MANAGER - HARDENED PRODUCTION SUPABASE DATABASE SCHEMA
-- Business: Aroza Collectibles (Anime keychains, rubber/PVC keychains, accessories)
-- Strict RLS Policies (auth.uid() = user_id) & Hardened Constraints
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    business_name TEXT DEFAULT 'Aroza Collectibles',
    currency TEXT DEFAULT '₹',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_number TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory TEXT,
    description TEXT,
    brand TEXT DEFAULT 'Aroza Collectibles',
    tags TEXT[] DEFAULT '{}',
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    
    -- Pricing
    purchase_price_default NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (purchase_price_default >= 0),
    selling_price_default NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (selling_price_default >= 0),
    instagram_price NUMERIC(12,2) CHECK (instagram_price >= 0),
    meesho_price NUMERIC(12,2) CHECK (meesho_price >= 0),
    direct_price NUMERIC(12,2) CHECK (direct_price >= 0),
    other_platform_price NUMERIC(12,2) CHECK (other_platform_price >= 0),
    
    -- Stock Levels
    min_reorder_level INT NOT NULL DEFAULT 5 CHECK (min_reorder_level >= 0),
    current_stock INT NOT NULL DEFAULT 0,
    damaged_qty INT NOT NULL DEFAULT 0 CHECK (damaged_qty >= 0),
    returned_qty INT NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_sku UNIQUE (user_id, sku)
);

-- 5. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_number TEXT NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transport_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (transport_cost >= 0),
    packaging_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (packaging_cost >= 0),
    other_expenses NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (other_expenses >= 0),
    payment_method TEXT DEFAULT 'UPI',
    notes TEXT,
    invoice_url TEXT,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_purchase_num UNIQUE (user_id, purchase_number)
);

-- 7. PURCHASE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(12,2) NOT NULL CHECK (total_cost >= 0)
);

-- 8. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    platform TEXT NOT NULL CHECK (platform IN ('Instagram', 'Meesho', 'WhatsApp', 'Direct', 'Other')),
    customer_name TEXT,
    shipping_charged NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_charged >= 0),
    shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
    packaging_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (packaging_cost >= 0),
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    other_expense NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (other_expense >= 0),
    payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Pending', 'Refunded', 'Cancelled')),
    fulfillment_status TEXT NOT NULL DEFAULT 'Completed' CHECK (fulfillment_status IN ('Completed', 'Returned', 'Partial Return', 'Cancelled')),
    refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (refund_amount >= 0),
    notes TEXT,
    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_profit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_order_num UNIQUE (user_id, order_number)
);

-- 9. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0)
);

-- 10. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN (
        'Transportation', 'Petrol', 'Packaging', 'Marketing',
        'Advertising', 'Shipping', 'Platform fees', 'Printing',
        'Equipment', 'Miscellaneous'
    )),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STOCK MOVEMENTS TABLE (LEDGER)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('PURCHASE', 'SALE', 'RETURN', 'DAMAGED', 'ADJUSTMENT', 'REFUND')),
    reference_id UUID,
    reference_type TEXT,
    quantity_changed INT NOT NULL,
    cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    resulting_stock INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RECONCILIATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    system_stock INT NOT NULL,
    physical_stock INT NOT NULL,
    difference INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT DEFAULT 'Aroza Collectibles',
    currency TEXT DEFAULT '₹',
    default_platform TEXT DEFAULT 'Instagram',
    default_packaging_cost NUMERIC(12,2) DEFAULT 10.00,
    default_shipping_cost NUMERIC(12,2) DEFAULT 60.00,
    low_stock_threshold INT DEFAULT 5,
    theme_preference TEXT DEFAULT 'warm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY SPEED
CREATE INDEX IF NOT EXISTS idx_products_user_sku ON public.products(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON public.purchases(user_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON public.sales(user_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_prod ON public.stock_movements(user_id, product_id);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STRICT RLS POLICIES FOR AUTHENTICATED USERS (SELECT, INSERT, UPDATE, DELETE)
-- NO 'user_id IS NULL' ALLOWED
-- ==============================================================================

-- PROFILES
CREATE POLICY "Profiles SELECT" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles INSERT" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles UPDATE" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES
CREATE POLICY "Categories SELECT" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Categories INSERT" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Categories UPDATE" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Categories DELETE" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- SUPPLIERS
CREATE POLICY "Suppliers SELECT" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Suppliers INSERT" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Suppliers UPDATE" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppliers DELETE" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);

-- PRODUCTS
CREATE POLICY "Products SELECT" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Products INSERT" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Products UPDATE" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Products DELETE" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- PRODUCT IMAGES
CREATE POLICY "ProductImages SELECT" ON public.product_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ProductImages INSERT" ON public.product_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ProductImages UPDATE" ON public.product_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ProductImages DELETE" ON public.product_images FOR DELETE USING (auth.uid() = user_id);

-- PURCHASES
CREATE POLICY "Purchases SELECT" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Purchases INSERT" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Purchases UPDATE" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Purchases DELETE" ON public.purchases FOR DELETE USING (auth.uid() = user_id);

-- PURCHASE ITEMS
CREATE POLICY "PurchaseItems SELECT" ON public.purchase_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "PurchaseItems INSERT" ON public.purchase_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "PurchaseItems UPDATE" ON public.purchase_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "PurchaseItems DELETE" ON public.purchase_items FOR DELETE USING (auth.uid() = user_id);

-- SALES
CREATE POLICY "Sales SELECT" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sales INSERT" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sales UPDATE" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sales DELETE" ON public.sales FOR DELETE USING (auth.uid() = user_id);

-- SALE ITEMS
CREATE POLICY "SaleItems SELECT" ON public.sale_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "SaleItems INSERT" ON public.sale_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "SaleItems UPDATE" ON public.sale_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "SaleItems DELETE" ON public.sale_items FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES
CREATE POLICY "Expenses SELECT" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Expenses INSERT" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Expenses UPDATE" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Expenses DELETE" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- STOCK MOVEMENTS
CREATE POLICY "StockMovements SELECT" ON public.stock_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "StockMovements INSERT" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "StockMovements UPDATE" ON public.stock_movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "StockMovements DELETE" ON public.stock_movements FOR DELETE USING (auth.uid() = user_id);

-- RECONCILIATIONS
CREATE POLICY "Reconciliations SELECT" ON public.reconciliations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Reconciliations INSERT" ON public.reconciliations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SETTINGS
CREATE POLICY "Settings SELECT" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Settings INSERT" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Settings UPDATE" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
