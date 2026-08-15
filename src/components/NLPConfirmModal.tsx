'use client';

import React, { useState, useEffect } from 'react';
import { ParsedCommand } from '@/lib/nlp-parser';
import { Product, Platform } from '@/types';
import { saveProduct, recordPurchase, recordSale, recordExpense } from '@/lib/data-service';
import { formatCurrency } from '@/lib/calculations';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface NLPConfirmModalProps {
  parsed: ParsedCommand | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveSuccess: () => void;
}

export default function NLPConfirmModal({
  parsed,
  isOpen,
  onClose,
  products,
  onSaveSuccess,
}: NLPConfirmModalProps) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [location, setLocation] = useState('Market');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (parsed) {
      setProductName(parsed.productName || 'Zoro Keychain');
      setQuantity(parsed.quantity || 1);
      setPrice(parsed.price || 0);
      setLocation(parsed.supplierOrLocation || 'Market');
      setPlatform(parsed.platform || 'Instagram');
      setExpenseDesc(parsed.expenseDescription || '');
      setExpenseAmount(parsed.expenseAmount || 0);
    }
  }, [parsed]);

  if (!isOpen || !parsed) return null;

  const handleConfirmSave = async () => {
    setIsSubmitting(true);

    if (parsed.type === 'PURCHASE') {
      const existing = products.find((p) => p.name.toLowerCase() === productName.toLowerCase());
      let prodId = existing?.id;

      if (!prodId) {
        const created = await saveProduct({
          name: productName,
          sku: `ARO-${Math.floor(1000 + Math.random() * 9000)}`,
          purchase_price_default: price,
          selling_price_default: Math.round(price * 4),
          current_stock: quantity,
          supplier_name: location,
        });
        prodId = created.id;
      }

      await recordPurchase({
        purchase_number: `PUR-#${Math.floor(100 + Math.random() * 900)}`,
        supplier_name: location,
        purchase_date: new Date().toISOString().split('T')[0],
        transport_cost: 0,
        packaging_cost: 0,
        other_expenses: 0,
        payment_method: 'UPI',
        notes: `AI Smart Input: "${parsed.rawText}"`,
        total_amount: quantity * price,
        items: [{ product_id: prodId, product_name: productName, quantity, unit_cost: price, total_cost: quantity * price }],
      });
    } else if (parsed.type === 'SALE') {
      const existing = products.find((p) => p.name.toLowerCase() === productName.toLowerCase()) || products[0];
      const cost = existing?.purchase_price_default || 40;
      const rev = quantity * price;

      await recordSale({
        order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        sale_date: new Date().toISOString().split('T')[0],
        platform,
        shipping_charged: 50,
        shipping_cost: 45,
        platform_fee: 0,
        packaging_cost: 12,
        discount: 0,
        other_expense: 0,
        payment_status: 'Paid',
        total_revenue: rev + 50,
        total_cost: quantity * cost,
        total_selling_expenses: 57,
        net_profit: (rev + 50) - (quantity * cost) - 57,
        profit_margin: rev > 0 ? (((rev + 50 - (quantity * cost) - 57) / (rev + 50)) * 100) : 0,
        items: [{ product_id: existing?.id || 'temp', product_name: productName, quantity, unit_price: price, unit_cost: cost }],
      });
    } else if (parsed.type === 'EXPENSE') {
      await recordExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'Miscellaneous',
        amount: expenseAmount,
        description: expenseDesc || parsed.rawText,
      });
    }

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#F4EBE1]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9E5827]" />
            <h3 className="font-bold text-sm text-[#2D241E]">AI Smart Quick Entry</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#6E6359] hover:bg-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div className="p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-[11px] text-[#6E6359]">
            Input: <span className="font-medium text-[#2D241E]">"{parsed.rawText}"</span>
          </div>

          {parsed.type === 'PURCHASE' && (
            <div className="space-y-3">
              <span className="font-bold text-[#9E5827] uppercase tracking-wider block text-[10px]">
                Confirm Purchase Details
              </span>
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Qty</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {parsed.type === 'SALE' && (
            <div className="space-y-3">
              <span className="font-bold text-[#2E7D32] uppercase tracking-wider block text-[10px]">
                Confirm Sale Details
              </span>
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Qty Sold</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#9E5827]"
                  />
                </div>
              </div>
            </div>
          )}

          {parsed.type === 'EXPENSE' && (
            <div className="space-y-3">
              <span className="font-bold text-[#DC2626] uppercase tracking-wider block text-[10px]">
                Confirm Expense Details
              </span>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#DC2626]"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmSave}
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-[#9E5827] text-white font-extrabold text-xs hover:bg-[#86481E] shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'CHECK & SAVE TO AROZA'}
          </button>
        </div>
      </div>
    </div>
  );
}
