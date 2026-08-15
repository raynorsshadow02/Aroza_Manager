'use client';

import React, { useState } from 'react';
import { Product, Purchase, Sale, Expense } from '@/types';
import { calculateDashboardStats, formatCurrency } from '@/lib/calculations';
import { parseNaturalLanguageInput, ParsedCommand } from '@/lib/nlp-parser';
import {
  Package,
  ShoppingBag,
  Receipt,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Truck,
  Plus,
} from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  onOpenAction: (type: 'product' | 'sale' | 'expense' | 'purchase' | 'reconcile', prod?: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNLPCommand: (command: ParsedCommand) => void;
}

export default function HomeView({
  products,
  purchases,
  sales,
  expenses,
  onOpenAction,
  onSelectProduct,
  onNLPCommand,
}: HomeViewProps) {
  const [nlpText, setNlpText] = useState('');
  const stats = calculateDashboardStats(products, purchases, sales, expenses);

  const handleNLPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpText.trim()) return;
    const parsed = parseNaturalLanguageInput(nlpText);
    onNLPCommand(parsed);
    setNlpText('');
  };

  // Recent 5 sales & purchases combined activity
  const recentSales = sales.slice(0, 3).map((s) => ({
    id: s.id,
    title: `Sold ${s.items[0]?.product_name || 'Collectible'} (${s.platform})`,
    date: s.sale_date,
    amount: `+${formatCurrency(s.total_revenue)}`,
    profit: `+${formatCurrency(s.net_profit)} profit`,
    isProfit: true,
  }));

  const recentPurchases = purchases.slice(0, 3).map((p) => ({
    id: p.id,
    title: `Restocked ${p.items[0]?.product_name || 'Items'} (${p.supplier_name || 'Supplier'})`,
    date: p.purchase_date,
    amount: `-${formatCurrency(p.total_amount)}`,
    profit: `${p.items.reduce((acc, i) => acc + i.quantity, 0)} units`,
    isProfit: false,
  }));

  const recentActivities = [...recentSales, ...recentPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#9E5827] uppercase tracking-wider block">
            Aroza Collectibles
          </span>
          <h1 className="text-2xl font-extrabold text-[#2D241E] tracking-tight">AROZA</h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#9E5827] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
          A
        </div>
      </div>

      {/* HERO FINANCIAL METRIC CARD */}
      <div className="aroza-card p-6 bg-gradient-to-br from-white to-[#F4EBE1] border-[#E8E2D9] space-y-3 shadow-md">
        <span className="text-xs font-bold text-[#6E6359] uppercase tracking-wider block">
          Net Realized Profit
        </span>
        <div className="text-4xl sm:text-5xl font-black text-[#9E5827] tracking-tight">
          {formatCurrency(stats.total_profit)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E8E2D9] text-xs">
          <div>
            <span className="text-[#6E6359] text-[10px] block">Total Sales</span>
            <span className="font-bold text-[#2E7D32]">{formatCurrency(stats.total_revenue)}</span>
          </div>
          <div>
            <span className="text-[#6E6359] text-[10px] block">Inventory Value</span>
            <span className="font-bold text-[#2D241E]">{formatCurrency(stats.current_inventory_value)}</span>
          </div>
          <div>
            <span className="text-[#6E6359] text-[10px] block">Investment</span>
            <span className="font-bold text-[#D97706]">{formatCurrency(stats.total_investment)}</span>
          </div>
          <div>
            <span className="text-[#6E6359] text-[10px] block">Units in Stock</span>
            <span className="font-bold text-[#2D241E]">{stats.total_units_in_stock} units</span>
          </div>
        </div>
      </div>

      {/* NATURAL LANGUAGE EXPRESS SMART BAR */}
      <form onSubmit={handleNLPSubmit} className="space-y-1.5">
        <div className="relative">
          <input
            type="text"
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            placeholder='Type sentence: "Bought 20 Zoro spinners for ₹40 from market"...'
            className="w-full pl-4 pr-24 py-3 bg-white border border-[#E8E2D9] rounded-2xl text-xs font-medium text-[#2D241E] shadow-sm focus:outline-none focus:border-[#9E5827]"
          />
          <button
            type="submit"
            disabled={!nlpText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#9E5827] text-white text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> Parse
          </button>
        </div>
        <span className="text-[10px] text-[#6E6359] px-1 block">
          💡 Try typing: <em>"Sold 2 Zoro keychains for ₹199 on Instagram"</em>
        </span>
      </form>

      {/* 3 LARGE TOUCH ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onOpenAction('product')}
          className="flex items-center justify-between p-4 rounded-2xl bg-[#9E5827] text-white hover:bg-[#86481E] shadow-md transition-transform active:scale-98 text-left"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Onboard Item</span>
            <h3 className="text-base font-extrabold">+ ADD PRODUCT</h3>
          </div>
          <Package className="w-8 h-8 opacity-80" />
        </button>

        <button
          onClick={() => onOpenAction('sale')}
          className="flex items-center justify-between p-4 rounded-2xl bg-[#2E7D32] text-white hover:bg-[#256628] shadow-md transition-transform active:scale-98 text-left"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Quick Record</span>
            <h3 className="text-base font-extrabold">📷 SELL</h3>
          </div>
          <ShoppingBag className="w-8 h-8 opacity-80" />
        </button>

        <button
          onClick={() => onOpenAction('expense')}
          className="flex items-center justify-between p-4 rounded-2xl bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-md transition-transform active:scale-98 text-left"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Log Receipt</span>
            <h3 className="text-base font-extrabold">💸 EXPENSE</h3>
          </div>
          <Receipt className="w-8 h-8 opacity-80" />
        </button>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="aroza-card p-5 space-y-3 bg-white">
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2.5">
          <h3 className="font-bold text-sm text-[#2D241E]">Recent Business Activity</h3>
          <span className="text-xs text-[#6E6359] font-medium">Real-time log</span>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-[#6E6359] py-4 text-center">No recent business activity recorded</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-xs text-[#2D241E]">{act.title}</h4>
                  <span className="text-[10px] text-[#6E6359]">{act.date}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-extrabold block ${act.isProfit ? 'text-[#2E7D32]' : 'text-[#2D241E]'}`}>
                    {act.amount}
                  </span>
                  <span className="text-[10px] text-[#6E6359] font-medium">{act.profit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
