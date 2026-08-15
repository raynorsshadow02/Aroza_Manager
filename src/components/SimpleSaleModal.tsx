'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Platform } from '@/types';
import { recordSale } from '@/lib/data-service';
import { formatCurrency, getStockStatus } from '@/lib/calculations';
import {
  X,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Search,
  Check,
  Package,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface SimpleSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
  onSaveSuccess: () => void;
}

export default function SimpleSaleModal({
  isOpen,
  onClose,
  products,
  initialProduct,
  onSaveSuccess,
}: SimpleSaleModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(199);
  const [platform, setPlatform] = useState<Platform>('Instagram');

  // Advanced Collapsible
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shippingCharged, setShippingCharged] = useState<number>(50);
  const [shippingCost, setShippingCost] = useState<number>(45);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [packagingCost, setPackagingCost] = useState<number>(12);
  const [customerName, setCustomerName] = useState<string>('');
  const [allowBackorder, setAllowBackorder] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category_name) cats.add(p.category_name);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || p.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = Number(selectedProduct?.current_stock ?? 0);
  const isStockLow = quantity > currentStock;

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [initialProduct, products, isOpen]);

  useEffect(() => {
    if (selectedProduct) {
      let price = Number(selectedProduct.selling_price_default || 199);
      if (platform === 'Instagram' && selectedProduct.instagram_price) {
        price = Number(selectedProduct.instagram_price);
      }
      if (platform === 'Meesho') {
        if (selectedProduct.meesho_price) price = Number(selectedProduct.meesho_price);
        setPlatformFee(Math.round(price * 0.12));
        setShippingCharged(0);
        setShippingCost(0);
      } else {
        setPlatformFee(0);
        setShippingCharged(50);
        setShippingCost(45);
      }
      if (platform === 'Direct' && selectedProduct.direct_price) {
        price = Number(selectedProduct.direct_price);
        setShippingCharged(0);
        setShippingCost(0);
      }
      setUnitPrice(price);
    }
  }, [selectedProductId, platform]);

  if (!isOpen) return null;

  const unitCost = Number(selectedProduct?.purchase_price_default || 40);
  const totalRevenue = (Number(quantity) * Number(unitPrice)) + (platform === 'Meesho' ? 0 : Number(shippingCharged));
  const cogs = Number(quantity) * unitCost;
  const totalExpenses = Number(shippingCost) + Number(platformFee) + Number(packagingCost);
  const netProfit = totalRevenue - cogs - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (isStockLow && !allowBackorder) {
      alert(`Only ${currentStock} in stock! Check backorder box to proceed.`);
      return;
    }

    setIsSubmitting(true);

    await recordSale({
      order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      sale_date: new Date().toISOString().split('T')[0],
      platform,
      customer_name: customerName || undefined,
      shipping_charged: platform === 'Meesho' ? 0 : Number(shippingCharged),
      shipping_cost: Number(shippingCost),
      platform_fee: Number(platformFee),
      packaging_cost: Number(packagingCost),
      discount: 0,
      other_expense: 0,
      payment_status: 'Paid',
      fulfillment_status: 'Completed',
      total_revenue: totalRevenue,
      total_cost: cogs,
      total_selling_expenses: totalExpenses,
      net_profit: netProfit,
      profit_margin: profitMargin,
      items: [
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          unit_cost: Number(unitCost),
        },
      ],
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#E8F5E9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1B5E20]">Record Sale & Catalog</h2>
              <p className="text-[11px] text-[#2E7D32]">Visual item catalog & instant profit calculation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#2E7D32] hover:bg-white/60 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* VISUAL PRODUCT CATALOG SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[#2D241E] font-bold">
                Select Product from Catalog *
              </label>
              <span className="text-[10px] text-[#6E6359]">
                {filteredProducts.length} collectible{filteredProducts.length === 1 ? '' : 's'} available
              </span>
            </div>

            {/* Catalog Search & Category Filters */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#6E6359] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search catalog by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs"
                />
              </div>
              {categories.length > 2 && (
                <div className="flex gap-1 overflow-x-auto py-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#FAF7F2] text-[#6E6359] hover:bg-[#F4EBE1]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-[#E8E2D9] rounded-2xl bg-[#FAF7F2]">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-6 text-center text-[#6E6359]">
                  <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span>No products found matching "{searchQuery}"</span>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  const stock = Number(p.current_stock ?? 0);
                  const img = p.images && p.images.length > 0 ? p.images[0].image_url : null;
                  const status = getStockStatus(stock, p.min_reorder_level || 5);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`cursor-pointer rounded-xl p-2 transition-all flex flex-col justify-between border ${
                        isSelected
                          ? 'bg-white border-[#2E7D32] shadow-sm ring-2 ring-[#2E7D32]/30'
                          : 'bg-white border-[#E8E2D9] hover:border-[#9E5827]/40 hover:shadow-xs'
                      }`}
                    >
                      <div className="relative aspect-square w-full rounded-lg bg-[#F4EBE1] overflow-hidden mb-1.5">
                        {img ? (
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#9E5827]">
                            <Package className="w-6 h-6 opacity-40" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#2E7D32] text-white p-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-[11px] text-[#2D241E] line-clamp-1">
                          {p.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-[#9E5827]">
                            {formatCurrency(p.selling_price_default || 0)}
                          </span>
                          <span
                            className={`font-semibold px-1.5 py-0.2 rounded-md ${
                              stock > 5
                                ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                : stock > 0
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : 'bg-[#FEE2E2] text-[#DC2626]'
                            }`}
                          >
                            {stock} in stock
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BACKORDER / STOCK NOTICE */}
          {isStockLow && (
            <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl text-[#92400E] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span>
                  Notice: Selling {quantity} units with only {currentStock} currently in stock.
                </span>
              </div>
              <label className="flex items-center gap-2 font-semibold text-[11px] cursor-pointer bg-white/70 px-2.5 py-1.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={allowBackorder}
                  onChange={(e) => setAllowBackorder(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                <span>Allow Stock Backorder Override (records sale & tracks negative stock)</span>
              </label>
            </div>
          )}

          {/* ESSENTIAL SALE FIELDS */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Price / Pc (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#9E5827]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Platform *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-2 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
              >
                <option value="Instagram">Instagram</option>
                <option value="Meesho">Meesho</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Direct">Direct</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* REAL TIME PROFIT BREAKDOWN CARD */}
          <div className="p-3.5 bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] border border-[#A5D6A7] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#1B5E20] uppercase tracking-wider block">
                  Estimated Net Profit
                </span>
                <span className="text-[10px] text-[#2E7D32]">
                  {quantity} × ₹{unitPrice} = {formatCurrency(quantity * unitPrice)} (Cost: -{formatCurrency(cogs)})
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#1B5E20]">
                  +{formatCurrency(netProfit)}
                </span>
                <span className="block text-[10px] font-bold text-[#2E7D32]">
                  {profitMargin.toFixed(1)}% Margin
                </span>
              </div>
            </div>

            {totalExpenses > 0 && (
              <div className="text-[10px] text-[#6E6359] border-t border-[#A5D6A7]/50 pt-1 flex justify-between">
                <span>Total Selling Expenses (Courier/Fee/Pack):</span>
                <span className="font-semibold text-[#D32F2F]">-{formatCurrency(totalExpenses)}</span>
              </div>
            )}
          </div>

          {/* ADVANCED DETAILS ACCORDION */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] hover:underline"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide additional details' : 'More options (Customer handle, Courier details)'}
            </button>

            {showAdvanced && (
              <div className="p-3 mt-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl space-y-2.5">
                <div>
                  <label className="block font-semibold mb-1">Customer / Handle</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="@handle / Customer name"
                    className="w-full px-3 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span>Shipping Charged to Customer (₹)</span>
                    <input
                      type="number"
                      value={shippingCharged}
                      onChange={(e) => setShippingCharged(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-[#E8E2D9] rounded-lg"
                    />
                  </div>
                  <div>
                    <span>Courier Cost Paid (₹)</span>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-[#E8E2D9] rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedProduct}
            className="w-full py-3.5 rounded-2xl bg-[#2E7D32] text-white font-extrabold text-sm hover:bg-[#256628] shadow-md transition-transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {isSubmitting ? 'Recording...' : `RECORD SALE (${formatCurrency(totalRevenue)})`}
          </button>
        </form>
      </div>
    </div>
  );
}
