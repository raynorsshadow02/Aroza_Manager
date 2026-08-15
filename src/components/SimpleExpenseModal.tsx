'use client';

import React, { useState } from 'react';
import { ExpenseCategory } from '@/types';
import { recordExpense } from '@/lib/data-service';
import CameraUploader from './CameraUploader';
import { X, Receipt } from 'lucide-react';

interface SimpleExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function SimpleExpenseModal({
  isOpen,
  onClose,
  onSaveSuccess,
}: SimpleExpenseModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategory>('Packaging');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);

    await recordExpense({
      date: new Date().toISOString().split('T')[0],
      category,
      amount: Number(amount),
      description: description.trim() || 'General Business Expense',
      receipt_url: imagePreview || undefined,
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FEE2E2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DC2626] text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#991B1B]">Add Expense</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#991B1B] hover:bg-white/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* RECEIPT PHOTO FIRST */}
          <CameraUploader
            label="Receipt / Bill Photo (Optional)"
            imagePreview={imagePreview}
            onImageSelected={(url) => setImagePreview(url)}
            onClearImage={() => setImagePreview(null)}
          />

          {/* 2 ESSENTIAL QUESTIONS */}
          <div>
            <label className="block text-[#2D241E] font-bold mb-1">What was this? *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Petrol for market, Packaging tape..."
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-sm text-[#2D241E]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-bold mb-1">How much? (₹) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 500"
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-base text-[#DC2626]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-medium text-xs"
            >
              <option value="Packaging">Packaging Supplies</option>
              <option value="Petrol">Petrol / Fuel</option>
              <option value="Transportation">Transportation / Courier</option>
              <option value="Marketing">Marketing / IG Ads</option>
              <option value="Equipment">Equipment / Tools</option>
              <option value="Printing">Printing & Tags</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-[#DC2626] text-white font-extrabold text-sm hover:bg-[#B91C1C] shadow-md transition-transform active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'ADD EXPENSE'}
          </button>
        </form>
      </div>
    </div>
  );
}
