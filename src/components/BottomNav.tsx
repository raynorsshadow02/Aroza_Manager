'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MoreHorizontal,
  Truck,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Plus,
  X,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: (actionType: 'product' | 'purchase' | 'sale' | 'expense' | 'supplier') => void;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
}: BottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
  ];

  const moreItems = [
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Quick Action FAB Button on Mobile */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsQuickActionsOpen(true)}
          className="w-13 h-13 rounded-full bg-[#9E5827] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Actions Mobile Sheet */}
      {isQuickActionsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="bg-white border border-[#E8E2D9] w-full rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
              <h3 className="font-semibold text-base text-[#2D241E]">Quick Record</h3>
              <button
                onClick={() => setIsQuickActionsOpen(false)}
                className="p-1 text-[#6E6359] rounded-lg hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onOpenQuickAction('sale');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold text-sm"
              >
                <ShoppingBag className="w-5 h-5" /> + Record Sale
              </button>
              <button
                onClick={() => {
                  onOpenQuickAction('product');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F4EBE1] text-[#9E5827] border border-[#E0CFBD] font-semibold text-sm"
              >
                <Package className="w-5 h-5" /> + Add Product
              </button>
              <button
                onClick={() => {
                  onOpenQuickAction('purchase');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] text-[#2D241E] border border-[#E8E2D9] font-medium text-sm"
              >
                <Truck className="w-5 h-5 text-[#D97706]" /> + Purchase
              </button>
              <button
                onClick={() => {
                  onOpenQuickAction('expense');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] text-[#2D241E] border border-[#E8E2D9] font-medium text-sm"
              >
                <Receipt className="w-5 h-5 text-[#DC2626]" /> + Expense
              </button>
            </div>
            <button
              onClick={() => {
                onOpenQuickAction('supplier');
                setIsQuickActionsOpen(false);
              }}
              className="w-full text-center py-2.5 rounded-xl bg-[#FAF7F2] text-[#6E6359] border border-[#E8E2D9] text-xs font-medium"
            >
              + Register New Supplier
            </button>
          </div>
        </div>
      )}

      {/* More Navigation Mobile Sheet */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="bg-white border border-[#E8E2D9] w-full rounded-2xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
              <h3 className="font-semibold text-base text-[#2D241E]">More Sections</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-[#6E6359] rounded-lg hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#9E5827] text-white border-[#9E5827]'
                        : 'bg-[#FAF7F2] text-[#2D241E] border-[#E8E2D9]'
                    }`}
                  >
                    <Icon className="w-5 h-5" /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E8E2D9] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMoreOpen(false);
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#9E5827]' : 'text-[#6E6359]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {item.label}
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
            moreItems.some((i) => i.id === activeTab) ? 'text-[#9E5827]' : 'text-[#6E6359]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          More
        </button>
      </nav>
    </>
  );
}
