'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { reconcileInventory } from '@/lib/data-service';
import { X, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
  onSaveSuccess: () => void;
}

export default function ReconciliationModal({
  isOpen,
  onClose,
  products,
  initialProduct,
  onSaveSuccess,
}: ReconciliationModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [physicalStock, setPhysicalStock] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const systemStock = selectedProduct?.current_stock || 0;
  const difference = physicalStock - systemStock;

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setPhysicalStock(initialProduct.current_stock);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setPhysicalStock(products[0].current_stock);
    }
  }, [initialProduct, products, isOpen]);

  useEffect(() => {
    if (selectedProduct) {
      setPhysicalStock(selectedProduct.current_stock);
    }
  }, [selectedProductId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!reason.trim()) {
      alert('Please provide a reason for the inventory count difference (e.g. Physical audit count mismatch).');
      return;
    }

    setIsSubmitting(true);
    await reconcileInventory(selectedProductId, Number(physicalStock), reason.trim());
    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#F4EBE1]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9E5827] flex items-center justify-center text-white font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D241E]">Inventory Reconciliation Audit</h2>
              <p className="text-xs text-[#6E6359]">Reconcile physical stock with system count</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6E6359] hover:bg-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D9]">
            <div>
              <span className="text-[10px] text-[#6E6359] block uppercase">System Stock</span>
              <span className="text-lg font-bold text-[#2D241E]">{systemStock}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6E6359] block uppercase">Variance (Diff)</span>
              <span
                className={`text-lg font-extrabold ${
                  difference > 0 ? 'text-[#2E7D32]' : difference < 0 ? 'text-[#DC2626]' : 'text-[#6E6359]'
                }`}
              >
                {difference > 0 ? `+${difference}` : difference}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Actual Physical Count *</label>
            <input
              type="number"
              min="0"
              required
              value={physicalStock}
              onChange={(e) => setPhysicalStock(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#9E5827]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Reconciliation Audit Reason *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Physical inventory count audit on 15 Aug, found 2 extra unrecorded items"
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
              className="px-5 py-2 rounded-xl bg-[#9E5827] text-white font-bold hover:bg-[#86481E]"
            >
              {isSubmitting ? 'Recording Audit...' : 'Reconcile Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
