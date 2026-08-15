'use client';

import React, { useState } from 'react';
import { Sale, Product } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { deleteSale } from '@/lib/data-service';
import { ShoppingBag, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface SalesViewProps {
  sales: Sale[];
  products: Product[];
  onOpenRecordSale: () => void;
  onRefresh: () => void;
}

export default function SalesView({ sales, onOpenRecordSale, onRefresh }: SalesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this sale record?')) {
      await deleteSale(id);
      onRefresh();
    }
  };

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total_revenue || 0), 0);
  const totalProfit = sales.reduce((acc, s) => acc + (s.net_profit || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Sales Orders & Deliveries ({sales.length})
          </h1>
          <div className="flex items-center gap-3 text-xs mt-0.5">
            <span>
              Revenue: <strong className="text-[#2E7D32]">{formatCurrency(totalRevenue)}</strong>
            </span>
            <span>•</span>
            <span>
              Net Profit: <strong className="text-[#9E5827]">{formatCurrency(totalProfit)}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={onOpenRecordSale}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] text-white hover:bg-[#256628] font-bold text-xs shadow-xs transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> Record New Sale
        </button>
      </div>

      {sales.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E8E2D9] space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#2E7D32] opacity-40" />
          <h3 className="text-base font-bold text-[#2D241E]">No Sales Recorded Yet</h3>
          <p className="text-xs text-[#6E6359]">Record sales from Instagram, Meesho, Direct or WhatsApp.</p>
          <button
            onClick={onOpenRecordSale}
            className="px-4 py-2 bg-[#2E7D32] text-white text-xs font-bold rounded-xl"
          >
            + Record Sale
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const isExpanded = expandedId === sale.id;
            return (
              <div
                key={sale.id}
                className="aroza-card p-4 space-y-3 bg-white hover:border-[#D6CBC0] transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] font-bold text-xs">
                      ORD
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D241E]">{sale.order_number}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-semibold">
                          {sale.platform}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D9] text-[#6E6359]">
                          {sale.payment_status}
                        </span>
                      </div>
                      <span className="text-xs text-[#6E6359]">
                        Customer: <strong>{sale.customer_name || 'Walk-in'}</strong> • Date:{' '}
                        {sale.sale_date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-[#6E6359] block">Revenue / Profit</span>
                      <div className="text-sm font-bold text-[#2D241E]">
                        {formatCurrency(sale.total_revenue)}{' '}
                        <span className="text-xs text-[#2E7D32] font-extrabold">
                          (+{formatCurrency(sale.net_profit)})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                      className="p-2 text-[#6E6359] hover:bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl"
                      title="Delete Sale"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#E8E2D9] space-y-3 bg-[#FAF7F2] p-3 rounded-xl">
                    <h4 className="text-xs font-semibold text-[#6E6359] uppercase tracking-wider">
                      Sold Line Items
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left bg-white rounded-lg overflow-hidden border border-[#E8E2D9]">
                        <thead className="bg-[#FAF7F2] text-[#6E6359]">
                          <tr>
                            <th className="p-2.5">Product Name</th>
                            <th className="p-2.5 text-right">Qty</th>
                            <th className="p-2.5 text-right">Unit Price</th>
                            <th className="p-2.5 text-right">Unit Cost</th>
                            <th className="p-2.5 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E2D9]">
                          {sale.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-semibold text-[#2D241E]">{item.product_name}</td>
                              <td className="p-2.5 text-right font-bold">{item.quantity}</td>
                              <td className="p-2.5 text-right font-bold text-[#9E5827]">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="p-2.5 text-right text-[#6E6359]">
                                {formatCurrency(item.unit_cost)}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#2E7D32]">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#6E6359]">
                      <div>
                        Shipping Charged: <strong>{formatCurrency(sale.shipping_charged)}</strong>
                      </div>
                      <div>
                        Shipping Paid: <strong>{formatCurrency(sale.shipping_cost)}</strong>
                      </div>
                      <div>
                        Platform Fee: <strong>{formatCurrency(sale.platform_fee)}</strong>
                      </div>
                      <div>
                        Packaging Cost: <strong>{formatCurrency(sale.packaging_cost)}</strong>
                      </div>
                    </div>

                    {sale.notes && (
                      <div className="text-xs text-[#6E6359]">
                        Notes: <span className="text-[#2D241E]">{sale.notes}</span>
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
