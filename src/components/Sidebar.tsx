'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingBag,
  Receipt,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Sparkles,
  Search,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: (actionType: 'product' | 'purchase' | 'sale' | 'expense' | 'supplier' | 'reconcile') => void;
  onOpenSearch: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
  onOpenSearch,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-[#E8E2D9] bg-white h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#9E5827] flex items-center justify-center text-white shadow-xs font-serif text-lg font-bold">
            A
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-[#2D241E]">Aroza Manager</h1>
            <p className="text-xs text-[#6E6359] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#9E5827]" /> Aroza Collectibles
            </p>
          </div>
        </div>
      </div>

      {/* Global Search Trigger */}
      <div className="p-3">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs bg-[#FAF7F2] hover:bg-[#F4EBE1] border border-[#E8E2D9] text-[#6E6359] rounded-xl transition-colors group"
        >
          <span className="flex items-center gap-2 font-medium">
            <Search className="w-3.5 h-3.5 text-[#9E5827]" /> Search everything...
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E8E2D9] rounded text-[#6E6359] group-hover:border-[#9E5827]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Quick Action Button Dropdown / Bar */}
      <div className="px-3 py-2 border-b border-[#E8E2D9]">
        <div className="text-[11px] font-semibold text-[#6E6359] uppercase tracking-wider mb-2 px-2">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenQuickAction('sale')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg bg-[#2E7D32] text-white hover:bg-[#256628] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> + Sale
          </button>
          <button
            onClick={() => onOpenQuickAction('product')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg bg-[#9E5827] text-white hover:bg-[#86481E] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> + Product
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          <button
            onClick={() => onOpenQuickAction('purchase')}
            className="py-1 px-1 text-[11px] font-medium text-center rounded bg-[#FAF7F2] hover:bg-[#F4EBE1] border border-[#E8E2D9] text-[#2D241E]"
          >
            + Purchase
          </button>
          <button
            onClick={() => onOpenQuickAction('expense')}
            className="py-1 px-1 text-[11px] font-medium text-center rounded bg-[#FAF7F2] hover:bg-[#F4EBE1] border border-[#E8E2D9] text-[#2D241E]"
          >
            + Expense
          </button>
          <button
            onClick={() => onOpenQuickAction('supplier')}
            className="py-1 px-1 text-[11px] font-medium text-center rounded bg-[#FAF7F2] hover:bg-[#F4EBE1] border border-[#E8E2D9] text-[#2D241E]"
          >
            + Supplier
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-[#6E6359] uppercase tracking-wider mb-2 px-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#9E5827] text-white shadow-xs'
                  : 'text-[#5A4E45] hover:bg-[#FAF7F2] hover:text-[#2D241E]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#6E6359]'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-[#E8E2D9] bg-[#FAF7F2] text-xs text-[#6E6359] flex items-center justify-between">
        <div>
          <span className="font-semibold text-[#2D241E]">INR (₹)</span> • Personal Business
        </div>
        <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" title="System Ready" />
      </div>
    </aside>
  );
}
