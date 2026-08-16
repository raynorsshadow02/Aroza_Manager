'use client';

import React, { useState } from 'react';
import { Supplier, Purchase } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { deleteSupplier } from '@/lib/data-service';
import { Users, Plus, Phone, MapPin, Truck, Calendar, Trash2, Search, AlertCircle } from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  onOpenAddSupplier: () => void;
  onRefresh?: () => void;
}

export default function SuppliersView({
  suppliers,
  purchases,
  onOpenAddSupplier,
  onRefresh,
}: SuppliersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.location && s.location.toLowerCase().includes(q)) ||
      (s.contact_number && s.contact_number.includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (supplier: Supplier) => {
    setIsDeleting(true);
    try {
      await deleteSupplier(supplier.id);
      setSupplierToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting supplier:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Collectible Suppliers & Factories ({suppliers.length})
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Manage manufacturer relationships, purchase histories, and suppliers
          </p>
        </div>

        <button
          onClick={onOpenAddSupplier}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E5827] text-white hover:bg-[#86481E] font-bold text-xs shadow-xs transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6359]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, location, contact..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827]"
          />
        </div>
        <span className="text-xs text-[#6E6359] font-medium hidden sm:inline">
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
        </span>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E8E2D9] space-y-3">
          <Users className="w-12 h-12 mx-auto text-[#9E5827] opacity-40" />
          <h3 className="text-base font-bold text-[#2D241E]">
            {searchQuery ? 'No suppliers match your search' : 'No Suppliers Registered'}
          </h3>
          <p className="text-xs text-[#6E6359]">
            {searchQuery
              ? 'Try searching with a different name or location'
              : 'Register suppliers to associate purchase orders and contact details.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenAddSupplier}
              className="px-4 py-2 bg-[#9E5827] text-white text-xs font-bold rounded-xl"
            >
              + Add Supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSuppliers.map((supplier) => {
            const supplierPurchases = purchases.filter((p) => p.supplier_id === supplier.id);
            const totalSpent = supplierPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);

            return (
              <div key={`sup-card-${supplier.id}`} className="aroza-card p-5 space-y-4 bg-white relative group">
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

                  {/* Remove / Delete Supplier Button */}
                  <button
                    onClick={() => setSupplierToDelete(supplier)}
                    className="p-2 text-[#9C9288] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D9] w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#2D241E]">Delete Supplier?</h3>
              <p className="text-xs text-[#6E6359]">
                Are you sure you want to remove <span className="font-bold text-[#2D241E]">{supplierToDelete.name}</span>? This will not delete past purchases.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-bold text-[#6E6359] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(supplierToDelete)}
                className="py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
