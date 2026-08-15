'use client';

import React, { useState, useEffect } from 'react';
import { Product, Supplier, Purchase, PurchaseItem } from '@/types';
import { recordPurchase } from '@/lib/data-service';
import { formatCurrency } from '@/lib/calculations';
import { X, Truck, Plus, Trash2, Upload, FileText } from 'lucide-react';

interface RecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  initialProduct?: Product | null;
  onSaveSuccess: () => void;
}

export default function RecordPurchaseModal({
  isOpen,
  onClose,
  products,
  suppliers,
  initialProduct,
  onSaveSuccess,
}: RecordPurchaseModalProps) {
  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseNumber, setPurchaseNumber] = useState<string>('');
  const [transportCost, setTransportCost] = useState<number>(200);
  const [packagingCost, setPackagingCost] = useState<number>(100);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [invoiceUrl, setInvoiceUrl] = useState<string>('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setPurchaseNumber(`PUR-#${Math.floor(100 + Math.random() * 900)}`);
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }

    if (initialProduct) {
      setItems([
        {
          product_id: initialProduct.id,
          product_name: initialProduct.name,
          quantity: 20,
          unit_cost: initialProduct.purchase_price_default || 40,
          total_cost: 20 * (initialProduct.purchase_price_default || 40),
        },
      ]);
    } else if (products.length > 0 && items.length === 0) {
      setItems([
        {
          product_id: products[0].id,
          product_name: products[0].name,
          quantity: 20,
          unit_cost: products[0].purchase_price_default || 40,
          total_cost: 20 * (products[0].purchase_price_default || 40),
        },
      ]);
    }
  }, [suppliers, products, initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstUnadded = products.find((p) => !items.some((i) => i.product_id === p.id)) || products[0];
    if (!firstUnadded) return;
    setItems([
      ...items,
      {
        product_id: firstUnadded.id,
        product_name: firstUnadded.name,
        quantity: 10,
        unit_cost: firstUnadded.purchase_price_default || 40,
        total_cost: 10 * (firstUnadded.purchase_price_default || 40),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  const handleItemChange = (index: number, field: 'product_id' | 'quantity' | 'unit_cost', value: any) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      item.product_id = value;
      item.product_name = prod?.name || '';
      item.unit_cost = prod?.purchase_price_default || item.unit_cost;
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value));
    } else if (field === 'unit_cost') {
      item.unit_cost = Math.max(0, Number(value));
    }

    item.total_cost = item.quantity * item.unit_cost;
    updated[index] = item;
    setItems(updated);
  };

  const itemsSubtotal = items.reduce((acc, item) => acc + item.total_cost, 0);
  const grandTotal =
    itemsSubtotal + Number(transportCost) + Number(packagingCost) + Number(otherExpenses);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);

    await recordPurchase({
      purchase_number: purchaseNumber || `PUR-#${Date.now().toString().slice(-4)}`,
      supplier_id: supplierId,
      supplier_name: selectedSupplier?.name || '',
      purchase_date: purchaseDate,
      transport_cost: Number(transportCost) || 0,
      packaging_cost: Number(packagingCost) || 0,
      other_expenses: Number(otherExpenses) || 0,
      payment_method: paymentMethod,
      notes,
      invoice_url: invoiceUrl,
      total_amount: grandTotal,
      items,
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 lg:p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FEF3C7]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97706] flex items-center justify-center text-white font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-[#78350F]">Record Supplier Purchase</h2>
              <p className="text-xs text-[#92400E]">Stock Investment & Ledger Inventory Addition</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#78350F] hover:bg-white/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Supplier & Purchase Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">NEFT / Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          {/* Multi-Product Items List */}
          <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#D97706] uppercase tracking-wider text-[11px]">
                Products Included in Order
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F4EBE1] border border-[#E8E2D9] text-[#9E5827] font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Product
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-5">
                    <span className="text-[10px] text-[#6E6359] block">Product</span>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg font-medium text-xs text-[#2D241E]"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-[#6E6359] block">Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-[#6E6359] block">Unit Cost (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="text-[10px] text-[#6E6359] block">Subtotal</span>
                    <span className="font-bold text-[#D97706] text-xs">
                      {formatCurrency(item.total_cost)}
                    </span>
                  </div>

                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-[#DC2626] hover:bg-white rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transportation & Freight Costs */}
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-2">
            <span className="text-[11px] font-semibold text-[#6E6359] block uppercase tracking-wider">
              Additional Transport & Freight Charges
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-[#6E6359]">Transport / Courier (₹)</span>
                <input
                  type="number"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6E6359]">Packaging Charge (₹)</span>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6E6359]">Other Expenses (₹)</span>
                <input
                  type="number"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Invoice Attachment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Invoice / Receipt Photo URL</label>
              <input
                type="url"
                value={invoiceUrl}
                onChange={(e) => setInvoiceUrl(e.target.value)}
                placeholder="https://... invoice picture link"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Purchase Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Batch #4 Zoro Spinners"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>
          </div>

          {/* Total Investment Summary */}
          <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#78350F]">Total Investment Amount</span>
              <p className="text-[11px] text-[#92400E]">
                Items Cost ({formatCurrency(itemsSubtotal)}) + Freight ({formatCurrency(Number(transportCost) + Number(packagingCost))})
              </p>
            </div>
            <div className="text-xl font-extrabold text-[#D97706]">{formatCurrency(grandTotal)}</div>
          </div>

          {/* Action buttons */}
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
              className="px-6 py-2.5 rounded-xl bg-[#D97706] text-white font-bold hover:bg-[#B45309] shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
