'use client';

import React from 'react';
import { Supplier, Purchase } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { Users, Plus, Phone, MapPin, Truck, Calendar } from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  onOpenAddSupplier: () => void;
}

export default function SuppliersView({
  suppliers,
  purchases,
  onOpenAddSupplier,
}: SuppliersViewProps) {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Collectible Suppliers & Factories ({suppliers.length})
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Manage manufacturer relationships and purchase histories
          </p>
        </div>

        <button
          onClick={onOpenAddSupplier}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E5827] text-white hover:bg-[#86481E] font-bold text-xs shadow-xs transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E8E2D9] space-y-3">
          <Users className="w-12 h-12 mx-auto text-[#9E5827] opacity-40" />
          <h3 className="text-base font-bold text-[#2D241E]">No Suppliers Registered</h3>
          <p className="text-xs text-[#6E6359]">Register suppliers to associate purchase orders.</p>
          <button
            onClick={onOpenAddSupplier}
            className="px-4 py-2 bg-[#9E5827] text-white text-xs font-bold rounded-xl"
          >
            + Add Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suppliers.map((supplier) => {
            const supplierPurchases = purchases.filter((p) => p.supplier_id === supplier.id);
            const totalSpent = supplierPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);

            return (
              <div key={supplier.id} className="aroza-card p-5 space-y-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#F4EBE1] text-[#9E5827] flex items-center justify-center font-bold text-lg">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#2D241E]">{supplier.name}</h3>
                      {supplier.location && (
                        <div className="flex items-center gap-1 text-xs text-[#6E6359] mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#9E5827]" /> {supplier.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {supplier.notes && (
                  <p className="text-xs text-[#6E6359] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9] leading-relaxed">
                    {supplier.notes}
                  </p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
                  <div>
                    <span className="text-[10px] text-[#6E6359] block uppercase">Purchases</span>
                    <span className="text-sm font-bold text-[#2D241E]">
                      {supplierPurchases.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6E6359] block uppercase">Total Spent</span>
                    <span className="text-sm font-bold text-[#D97706]">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6E6359] block uppercase">Last Order</span>
                    <span className="text-xs font-semibold text-[#2D241E]">
                      {supplierPurchases[0]?.purchase_date || 'N/A'}
                    </span>
                  </div>
                </div>

                {supplier.contact_number && (
                  <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#6E6359] font-medium">
                      <Phone className="w-3.5 h-3.5 text-[#2E7D32]" /> {supplier.contact_number}
                    </span>
                    <a
                      href={`https://wa.me/${supplier.contact_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#E8F5E9] text-[#2E7D32] font-semibold text-[11px]"
                    >
                      WhatsApp Supplier
                    </a>
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
