'use client';

import React, { useState, useEffect } from 'react';
import { Product, Platform } from '@/types';
import { recordSale } from '@/lib/data-service';
import { formatCurrency } from '@/lib/calculations';
import { X, ShoppingBag, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

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
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(199);
  const [platform, setPlatform] = useState<Platform>('Instagram');

  // Advanced Collapsable
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shippingCharged, setShippingCharged] = useState<number>(50);
  const [shippingCost, setShippingCost] = useState<number>(45);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [packagingCost, setPackagingCost] = useState<number>(12);
  const [customerName, setCustomerName] = useState<string>('');
  const [allowBackorder, setAllowBackorder] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct?.current_stock || 0;
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
      let price = selectedProduct.selling_price_default || 199;
      if (platform === 'Instagram' && selectedProduct.instagram_price) price = selectedProduct.instagram_price;
      if (platform === 'Meesho') {
        if (selectedProduct.meesho_price) price = selectedProduct.meesho_price;
        setPlatformFee(Math.round(price * 0.12));
        setShippingCharged(0);
        setShippingCost(0);
      } else {
        setPlatformFee(0);
        setShippingCharged(50);
        setShippingCost(45);
      }
      if (platform === 'Direct' && selectedProduct.direct_price) {
        price = selectedProduct.direct_price;
        setShippingCharged(0);
        setShippingCost(0);
      }
      setUnitPrice(price);
    }
  }, [selectedProductId, platform]);

  if (!isOpen) return null;

  const unitCost = selectedProduct?.purchase_price_default || 40;
  const totalRevenue = (quantity * unitPrice) + (platform === 'Meesho' ? 0 : shippingCharged);
  const cogs = quantity * unitCost;
  const totalExpenses = shippingCost + platformFee + packagingCost;
  const netProfit = totalRevenue - cogs - totalExpenses;

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
      profit_margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
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
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#E8F5E9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#1B5E20]">Record Quick Sale</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#2E7D32] hover:bg-white/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Select Product */}
          <div>
            <label className="block text-[#2D241E] font-bold mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#2D241E]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.current_stock})
                </option>
              ))}
            </select>
          </div>

          {/* Insufficient Stock Warning */}
          {isStockLow && (
            <div className="p-2.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-[#B91C1C] space-y-1">
              <span className="font-bold block text-xs">
                ⚠️ Only {currentStock} left in stock!
              </span>
              <label className="flex items-center gap-2 font-semibold text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBackorder}
                  onChange={(e) => setAllowBackorder(e.target.checked)}
                  className="w-4 h-4 rounded text-[#DC2626]"
                />
                Allow Stock Backorder Override
              </label>
            </div>
          )}

          {/* 3 ESSENTIAL FIELDS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Quantity Sold *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-bold mb-1">Price / Piece (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#9E5827]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2D241E] font-bold mb-1">Platform *</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
            >
              <option value="Instagram">Instagram</option>
              <option value="Meesho">Meesho</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Direct">Direct / Walk-in</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* REAL TIME PROFIT CARD */}
          <div className="p-3.5 bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#1B5E20]">Estimated Profit</span>
              <p className="text-[10px] text-[#2E7D32]">Revenue: {formatCurrency(totalRevenue)}</p>
            </div>
            <span className="text-xl font-extrabold text-[#2E7D32]">
              +{formatCurrency(netProfit)}
            </span>
          </div>

          {/* ADVANCED DETAILS */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] hover:underline"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide options' : 'More details (Shipping, Customer handle)'}
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
                    <span>Shipping Charged (₹)</span>
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

          {/* LARGE BOLD CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-[#2E7D32] text-white font-extrabold text-sm hover:bg-[#256628] shadow-md transition-transform active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Recording...' : 'RECORD SALE'}
          </button>
        </form>
      </div>
    </div>
  );
}
