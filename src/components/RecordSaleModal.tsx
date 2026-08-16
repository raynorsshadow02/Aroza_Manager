'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Platform, Sale } from '@/types';
import { recordSale } from '@/lib/data-service';
import { formatCurrency, getStockStatus } from '@/lib/calculations';
import {
  X,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Search,
  Package,
  Check,
} from 'lucide-react';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
  onSaveSuccess: () => void;
}

export default function RecordSaleModal({
  isOpen,
  onClose,
  products,
  initialProduct,
  onSaveSuccess,
}: RecordSaleModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [shippingCharged, setShippingCharged] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [packagingCost, setPackagingCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [otherExpense, setOtherExpense] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category_name) cats.add(p.category_name);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filter products
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
  const isStockInsufficient = quantity > currentStock;

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setOrderNumber(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [initialProduct, products, isOpen]);

  useEffect(() => {
    if (selectedProduct) {
      setUnitCost(Number(selectedProduct.purchase_price_default || 0));

      let price = Number(selectedProduct.selling_price_default || 0);
      if (platform === 'Instagram' && selectedProduct.instagram_price) {
        price = Number(selectedProduct.instagram_price);
      }
      if (platform === 'Meesho' && selectedProduct.meesho_price) {
        price = Number(selectedProduct.meesho_price);
      }
      if (platform === 'Direct' && selectedProduct.direct_price) {
        price = Number(selectedProduct.direct_price);
      }
      setUnitPrice(price);
    }
  }, [selectedProductId, platform]);

  if (!isOpen) return null;

  // Calculation formulas
  const itemsSubtotal = Number(quantity) * Number(unitPrice);
  const totalRevenue = itemsSubtotal + Number(shippingCharged) - Number(discount);
  const cogs = Number(quantity) * Number(unitCost);
  const totalSellingExpenses =
    Number(shippingCost) + Number(platformFee) + Number(packagingCost) + Number(otherExpense);
  const netProfit = totalRevenue - cogs - totalSellingExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (isStockInsufficient) {
      alert(`Cannot sell ${quantity} units! Only ${currentStock} units in stock.`);
      return;
    }

    setIsSubmitting(true);

    await recordSale({
      order_number: orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
      sale_date: saleDate,
      platform,
      customer_name: customerName,
      shipping_charged: Number(shippingCharged) || 0,
      shipping_cost: Number(shippingCost) || 0,
      platform_fee: Number(platformFee) || 0,
      packaging_cost: Number(packagingCost) || 0,
      discount: Number(discount) || 0,
      other_expense: Number(otherExpense) || 0,
      payment_status: paymentStatus,
      notes,
      total_revenue: totalRevenue,
      total_cost: cogs,
      total_selling_expenses: totalSellingExpenses,
      net_profit: netProfit,
      profit_margin: profitMargin,
      items: [
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          unit_cost: Number(unitCost),
          total_price: itemsSubtotal,
        },
      ],
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 lg:p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#E8F5E9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-[#1B5E20]">Record New Sale</h2>
              <p className="text-xs text-[#2E7D32]">Visual Product Catalog & Instant Financial Accounting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#2E7D32] hover:bg-white/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* VISUAL CATALOG PICKER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[#2D241E] font-bold text-sm">
                Select Product from Catalog *
              </label>
              <span className="text-[11px] text-[#6E6359]">
                {filteredProducts.length} items available
              </span>
            </div>

            {/* Catalog Search & Category Filter */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#6E6359] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by name, SKU or brand..."
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

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 border border-[#E8E2D9] rounded-2xl bg-[#FAF7F2]">
              {filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                const stock = Number(p.current_stock ?? 0);
                const img = p.images && p.images.length > 0 ? p.images[0].image_url : null;

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
                    <div className="relative aspect-square w-full rounded-lg bg-[#F4EBE1] overflow-hidden mb-1">
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#9E5827]">
                          <Package className="w-5 h-5 opacity-40" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-[#2E7D32] text-white p-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
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
                          className={`font-semibold px-1 rounded ${
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
              })}
            </div>
          </div>

          {/* Insufficient Stock Alert / Backorder notice */}


          {/* Platform & Order Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Selling Platform *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
              >
                <option value="Instagram">Instagram</option>
                <option value="Meesho">Meesho</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Direct">Direct / Walk-in</option>
                <option value="Other">Other Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Customer / Handle</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. @rahul_v / Rahul"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Order # / Date</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-mono text-[11px]"
                />
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Units Sold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Quantity Sold *</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Unit Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#9E5827]"
              />
            </div>

            <div>
              <label className="block text-[#6E6359] font-medium mb-1">Unit Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#6E6359]"
              />
            </div>
          </div>

          {/* Cost Deductions & Logistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[#6E6359] text-[11px] font-medium mb-1">Shipping Charged (₹)</label>
              <input
                type="number"
                value={shippingCharged}
                onChange={(e) => setShippingCharged(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[#6E6359] text-[11px] font-medium mb-1">Shipping Cost (₹)</label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[#6E6359] text-[11px] font-medium mb-1">Platform Fee (₹)</label>
              <input
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[#6E6359] text-[11px] font-medium mb-1">Packaging Cost (₹)</label>
              <input
                type="number"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg text-xs"
              />
            </div>
          </div>

          {/* REAL TIME PROFIT CALCULATION SUMMARY CARD */}
          <div className="p-4 bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] border border-[#A5D6A7] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#1B5E20]">Estimated Net Profit</span>
              <span className="text-xl font-black text-[#1B5E20]">
                +{formatCurrency(netProfit)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-2 border-t border-[#A5D6A7]/50">
              <div>
                <span className="text-[#6E6359] block">Revenue</span>
                <span className="font-bold text-[#2E7D32]">{formatCurrency(totalRevenue)}</span>
              </div>
              <div>
                <span className="text-[#6E6359] block">COGS</span>
                <span className="font-bold text-[#6E6359]">-{formatCurrency(cogs)}</span>
              </div>
              <div>
                <span className="text-[#6E6359] block">Margin</span>
                <span className="font-bold text-[#1B5E20]">{profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-[#6E6359] font-bold text-xs hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedProduct}
              className="px-6 py-2.5 rounded-xl bg-[#2E7D32] text-white font-extrabold text-xs hover:bg-[#256628] shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : `Record Sale (${formatCurrency(totalRevenue)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
