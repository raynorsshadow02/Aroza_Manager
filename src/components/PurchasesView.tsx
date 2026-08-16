'use client';

import React, { useState } from 'react';
import { Purchase, Product, Supplier } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { deletePurchase } from '@/lib/data-service';
import { Truck, Plus, Trash2, Calendar, FileText, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onOpenRecordPurchase: () => void;
  onEditPurchase?: (purchase: Purchase) => void;
  onRefresh: () => void;
}

export default function PurchasesView({
  purchases,
  products,
  suppliers,
  onOpenRecordPurchase,
  onEditPurchase,
  onRefresh,
}: PurchasesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this purchase record?')) {
      await deletePurchase(id);
      onRefresh();
    }
  };

  const totalInvestmentAllTime = purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Purchase Orders & Inventory Restocking ({purchases.length})
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Total Inventory Investment Spend:{' '}
            <strong className="text-[#D97706]">{formatCurrency(totalInvestmentAllTime)}</strong>
          </p>
        </div>

        <button
          onClick={onOpenRecordPurchase}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97706] text-white hover:bg-[#B45309] font-bold text-xs shadow-xs transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> Record Purchase Order
        </button>
      </div>

      {purchases.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E8E2D9] space-y-3">
          <Truck className="w-12 h-12 mx-auto text-[#D97706] opacity-40" />
          <h3 className="text-base font-bold text-[#2D241E]">No Purchase Records</h3>
          <p className="text-xs text-[#6E6359]">Record your first batch purchase from a supplier.</p>
          <button
            onClick={onOpenRecordPurchase}
            className="px-4 py-2 bg-[#D97706] text-white text-xs font-bold rounded-xl"
          >
            + Record Purchase
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => {
            const isExpanded = expandedId === purchase.id;
            return (
              <div
                key={purchase.id}
                className="aroza-card p-4 space-y-3 bg-white hover:border-[#D6CBC0] transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706] font-bold text-xs">
                      PUR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D241E]">
                          {purchase.purchase_number}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-md text-[#6E6359]">
                          {purchase.payment_method}
                        </span>
                      </div>
                      <span className="text-xs text-[#6E6359]">
                        Supplier: <strong>{purchase.supplier_name || 'N/A'}</strong> • Date:{' '}
                        {purchase.purchase_date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-[#6E6359] block">Total Amount</span>
                      <span className="text-base font-extrabold text-[#D97706]">
                        {formatCurrency(purchase.total_amount)}
                      </span>
                    </div>

                    {onEditPurchase && (
                      <button
                        onClick={() => onEditPurchase(purchase)}
                        className="p-2 text-[#9E5827] hover:bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] flex items-center gap-1 text-xs font-semibold"
                        title="Edit Investment Order"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
                      className="p-2 text-[#6E6359] hover:bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(purchase.id)}
                      className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl"
                      title="Delete purchase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#E8E2D9] space-y-3 bg-[#FAF7F2] p-3 rounded-xl">
                    <h4 className="text-xs font-semibold text-[#6E6359] uppercase tracking-wider">
                      Purchased Items ({purchase.items.length} types)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left bg-white rounded-lg overflow-hidden border border-[#E8E2D9]">
                        <thead className="bg-[#FAF7F2] text-[#6E6359]">
                          <tr>
                            <th className="p-2.5">Product</th>
                            <th className="p-2.5 text-right">Quantity</th>
                            <th className="p-2.5 text-right">Unit Price</th>
                            <th className="p-2.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E2D9]">
                          {purchase.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-semibold text-[#2D241E]">
                                {item.product_name}
                              </td>
                              <td className="p-2.5 text-right font-bold">{item.quantity}</td>
                              <td className="p-2.5 text-right text-[#6E6359]">
                                {formatCurrency(item.unit_cost)}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#D97706]">
                                {formatCurrency(item.total_cost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#6E6359]">
                      <div>
                        Freight / Courier: <strong>{formatCurrency(purchase.transport_cost)}</strong>
                      </div>
                      <div>
                        Packaging Cost: <strong>{formatCurrency(purchase.packaging_cost)}</strong>
                      </div>
                      {purchase.notes && <div>Notes: {purchase.notes}</div>}
                    </div>

                    {purchase.invoice_url && (
                      <div className="pt-1">
                        <a
                          href={purchase.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#9E5827] hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Uploaded Invoice Attachment
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
