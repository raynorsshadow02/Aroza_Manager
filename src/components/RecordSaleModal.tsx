'use client';

import React, { useState, useEffect } from 'react';
import { Product, Platform, Sale } from '@/types';
import { recordSale } from '@/lib/data-service';
import { formatCurrency } from '@/lib/calculations';
import { X, ShoppingBag, AlertTriangle, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

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
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [shippingCharged, setShippingCharged] = useState<number>(50);
  const [shippingCost, setShippingCost] = useState<number>(45);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [packagingCost, setPackagingCost] = useState<number>(12);
  const [discount, setDiscount] = useState<number>(0);
  const [otherExpense, setOtherExpense] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState<string>('');
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

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
      setUnitCost(selectedProduct.purchase_price_default || 0);

      // Auto-set selling price depending on platform choice
      let price = selectedProduct.selling_price_default || 0;
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

  const currentStock = selectedProduct?.current_stock || 0;
  const isStockInsufficient = quantity > currentStock;

  // Calculation formulas
  const itemsSubtotal = quantity * unitPrice;
  const totalRevenue = itemsSubtotal + Number(shippingCharged) - Number(discount);
  const cogs = quantity * unitCost;
  const totalSellingExpenses =
    Number(shippingCost) + Number(platformFee) + Number(packagingCost) + Number(otherExpense);
  const netProfit = totalRevenue - cogs - totalSellingExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (isStockInsufficient && !allowNegativeStock) {
      alert(`Cannot sell ${quantity} units! Only ${currentStock} units in stock. Check override checkbox to proceed.`);
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
              <p className="text-xs text-[#2E7D32]">Automatic Inventory & Profit Accounting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#2E7D32] hover:bg-white/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Product Selector */}
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-3">
            <label className="block text-[#2D241E] font-semibold text-sm">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl font-semibold text-sm text-[#2D241E]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stock: {p.current_stock}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E8E2D9]">
                <span className="text-[#6E6359]">
                  Available Stock:{' '}
                  <strong
                    className={
                      currentStock <= 0
                        ? 'text-[#DC2626]'
                        : currentStock <= 5
                        ? 'text-[#D97706]'
                        : 'text-[#2E7D32]'
                    }
                  >
                    {currentStock} units
                  </strong>
                </span>
                <span className="text-[#6E6359]">
                  Avg Purchase Cost: <strong>{formatCurrency(unitCost)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Insufficient Stock Alert */}
          {isStockInsufficient && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl flex items-start gap-2.5 text-[#B91C1C]">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs">Insufficient Stock Warning!</p>
                <p className="text-[11px]">
                  You are attempting to sell <strong>{quantity}</strong> units, but only{' '}
                  <strong>{currentStock}</strong> are in stock.
                </p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-xs cursor-pointer text-[#7F1D1D]">
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-4 h-4 rounded text-[#DC2626]"
                  />
                  Allow Stock Override / Backorder
                </label>
              </div>
            </div>
          )}

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
              <label className="block text-[#2D241E] font-semibold mb-1">Sale Date</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>
          </div>

          {/* Pricing & Quantity Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Quantity Sold *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Unit Selling Price (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#9E5827]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Shipping Charged (₹)</label>
              <input
                type="number"
                min="0"
                value={shippingCharged}
                onChange={(e) => setShippingCharged(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>
          </div>

          {/* Selling Expenses Breakdown */}
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-2">
            <span className="text-[11px] font-semibold text-[#6E6359] block uppercase tracking-wider">
              Selling Costs Paid by Aroza Collectibles
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-[#6E6359]">Courier Shipping Cost (₹)</span>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#6E6359]">Platform Comm. Fee (₹)</span>
                <input
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#6E6359]">Packaging Cost (₹)</span>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* REAL TIME PROFIT CALCULATION SUMMARY CARD */}
          <div className="p-4 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] space-y-3">
            <div className="flex items-center justify-between border-b border-[#A5D6A7] pb-2">
              <span className="font-semibold text-xs text-[#1B5E20]">Estimated Net Profit</span>
              <span className="text-xl font-extrabold text-[#2E7D32]">
                +{formatCurrency(netProfit)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-[#2E7D32] block">Total Revenue:</span>
                <span className="font-bold text-[#1B5E20]">{formatCurrency(totalRevenue)}</span>
              </div>
              <div>
                <span className="text-[#2E7D32] block">Product COGS:</span>
                <span className="font-bold text-[#1B5E20]">{formatCurrency(cogs)}</span>
              </div>
              <div>
                <span className="text-[#2E7D32] block">Profit Margin:</span>
                <span className="font-bold text-[#2E7D32]">{profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-[#6E6359] font-medium hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#2E7D32] text-white font-bold hover:bg-[#256628] shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
