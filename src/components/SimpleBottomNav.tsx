'use client';

import React, { useState } from 'react';
import {
  Home,
  Package,
  Wallet,
  MoreHorizontal,
  Plus,
  X,
  ShoppingBag,
  Receipt,
  Truck,
  RefreshCw,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';

interface SimpleBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: (actionType: 'product' | 'purchase' | 'sale' | 'expense' | 'supplier' | 'reconcile') => void;
}

export default function SimpleBottomNav({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
}: SimpleBottomNavProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'products', label: 'PRODUCTS', icon: Package },
    { id: 'money', label: 'MONEY', icon: Wallet },
  ];

  const moreTabs = [
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) on Mobile */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="w-14 h-14 rounded-full bg-[#9E5827] text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <Plus className={`w-7 h-7 transition-transform duration-200 ${isFabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* FAB Options Drawer Sheet */}
      {isFabOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="bg-white border border-[#E8E2D9] w-full rounded-3xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
              <h3 className="font-bold text-base text-[#2D241E]">Quick Action</h3>
              <button onClick={() => setIsFabOpen(false)} className="p-1 text-[#6E6359]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  onOpenQuickAction('product');
                  setIsFabOpen(false);
                }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#F4EBE1] text-[#9E5827] border border-[#E0CFBD] font-extrabold text-xs"
              >
                <Package className="w-5 h-5" /> + Add Product
              </button>

              <button
                onClick={() => {
                  onOpenQuickAction('sale');
                  setIsFabOpen(false);
                }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-extrabold text-xs"
              >
                <ShoppingBag className="w-5 h-5" /> 📷 Record Sale
              </button>

              <button
                onClick={() => {
                  onOpenQuickAction('expense');
                  setIsFabOpen(false);
                }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] font-extrabold text-xs"
              >
                <Receipt className="w-5 h-5" /> 💸 Add Expense
              </button>

              <button
                onClick={() => {
                  onOpenQuickAction('reconcile');
                  setIsFabOpen(false);
                }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#FAF7F2] text-[#2D241E] border border-[#E8E2D9] font-bold text-xs"
              >
                <RefreshCw className="w-5 h-5 text-[#9E5827]" /> Reconcile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Sections Drawer Sheet */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="bg-white border border-[#E8E2D9] w-full rounded-3xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
              <h3 className="font-bold text-base text-[#2D241E]">More Options</h3>
              <button onClick={() => setIsMoreOpen(false)} className="p-1 text-[#6E6359]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-[#9E5827] text-white border-[#9E5827]'
                        : 'bg-[#FAF7F2] text-[#2D241E] border-[#E8E2D9]'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4-Tab Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E8E2D9] px-2 py-2 flex items-center justify-around shadow-lg">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMoreOpen(false);
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-extrabold tracking-wider transition-colors ${
                isActive ? 'text-[#9E5827]' : 'text-[#6E6359]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {item.label}
            </button>
          );
        })}

        {/* MORE Tab */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-extrabold tracking-wider transition-colors ${
            moreTabs.some((i) => i.id === activeTab) ? 'text-[#9E5827]' : 'text-[#6E6359]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          MORE
        </button>
      </nav>
    </>
  );
}
