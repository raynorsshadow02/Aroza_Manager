'use client';

import React, { useState } from 'react';
import { ExpenseCategory, Product } from '@/types';
import { recordExpense } from '@/lib/data-service';
import { X, Receipt, DollarSign, Upload } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveSuccess: () => void;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  products,
  onSaveSuccess,
}: AddExpenseModalProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Packaging');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const categoriesList: ExpenseCategory[] = [
    'Transportation',
    'Petrol',
    'Packaging',
    'Marketing',
    'Advertising',
    'Shipping',
    'Platform fees',
    'Printing',
    'Equipment',
    'Miscellaneous',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    const selectedProd = products.find((p) => p.id === productId);

    await recordExpense({
      date,
      category,
      amount: Number(amount),
      description,
      product_id: productId || undefined,
      product_name: selectedProd?.name,
      receipt_url: receiptUrl || undefined,
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FEE2E2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626] flex items-center justify-center text-white font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#991B1B]">Add Operating Expense</h2>
              <p className="text-xs text-[#B91C1C]">Track Business Expenses & Deductions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#991B1B] hover:bg-white/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Amount (₹) *</label>
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#DC2626]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Expense Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Description / Reason</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bubble wrap roll, IG ad campaign..."
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Related Product (Optional)</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
            >
              <option value="">None (General Business Expense)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Receipt / Bill Photo URL</label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://... photo link"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-[#6E6359]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C]"
            >
              {isSubmitting ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
