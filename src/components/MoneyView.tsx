'use client';

import React, { useState } from 'react';
import { Sale, Expense, Purchase, Product } from '@/types';
import SalesView from './SalesView';
import ExpensesView from './ExpensesView';
import { calculateCashFlowStats, formatCurrency } from '@/lib/calculations';
import { ShoppingBag, Receipt, Wallet } from 'lucide-react';

interface MoneyViewProps {
  sales: Sale[];
  expenses: Expense[];
  purchases: Purchase[];
  products: Product[];
  onOpenRecordSale: () => void;
  onOpenAddExpense: () => void;
  onRefresh: () => void;
}

export default function MoneyView({
  sales,
  expenses,
  purchases,
  products,
  onOpenRecordSale,
  onOpenAddExpense,
  onRefresh,
}: MoneyViewProps) {
  const [subTab, setSubTab] = useState<'sales' | 'expenses' | 'cashflow'>('sales');
  const cashStats = calculateCashFlowStats(purchases, sales, expenses);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
          Money & Financial Transactions
        </h1>
        <p className="text-xs text-[#6E6359] mt-0.5">
          Sales revenues, operational expenses, and cash flow liquidity
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E8E2D9] bg-white rounded-2xl p-1 gap-1 border">
        <button
          onClick={() => setSubTab('sales')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'sales' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#6E6359] hover:bg-[#FAF7F2]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Sales ({sales.length})
        </button>

        <button
          onClick={() => setSubTab('expenses')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'expenses' ? 'bg-[#DC2626] text-white shadow-xs' : 'text-[#6E6359] hover:bg-[#FAF7F2]'
          }`}
        >
          <Receipt className="w-4 h-4" /> Expenses ({expenses.length})
        </button>

        <button
          onClick={() => setSubTab('cashflow')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'cashflow' ? 'bg-[#9E5827] text-white shadow-xs' : 'text-[#6E6359] hover:bg-[#FAF7F2]'
          }`}
        >
          <Wallet className="w-4 h-4" /> Cash Flow
        </button>
      </div>

      {/* Subtab Content */}
      {subTab === 'sales' && (
        <SalesView
          sales={sales}
          products={products}
          onOpenRecordSale={onOpenRecordSale}
          onRefresh={onRefresh}
        />
      )}

      {subTab === 'expenses' && (
        <ExpensesView
          expenses={expenses}
          onOpenAddExpense={onOpenAddExpense}
          onRefresh={onRefresh}
        />
      )}

      {subTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="aroza-card p-4 space-y-1 bg-white">
              <span className="text-xs font-semibold text-[#2E7D32]">Cash Collected</span>
              <div className="text-2xl font-extrabold text-[#1B5E20]">
                {formatCurrency(cashStats.cashReceived)}
              </div>
              <span className="text-[10px] text-[#6E6359]">Paid sales minus fees</span>
            </div>

            <div className="aroza-card p-4 space-y-1 bg-white">
              <span className="text-xs font-semibold text-[#DC2626]">Cash Outflow</span>
              <div className="text-2xl font-extrabold text-[#991B1B]">
                {formatCurrency(cashStats.cashSpent)}
              </div>
              <span className="text-[10px] text-[#6E6359]">Purchases, expenses, freight</span>
            </div>

            <div className="aroza-card p-4 space-y-1 bg-white">
              <span className="text-xs font-semibold text-[#2D241E]">Net Cash Flow</span>
              <div className={`text-2xl font-extrabold ${cashStats.netCashFlow >= 0 ? 'text-[#2E7D32]' : 'text-[#DC2626]'}`}>
                {formatCurrency(cashStats.netCashFlow)}
              </div>
              <span className="text-[10px] text-[#6E6359]">Net liquid cash position</span>
            </div>

            <div className="aroza-card p-4 space-y-1 bg-white">
              <span className="text-xs font-semibold text-[#D97706]">Pending Payments</span>
              <div className="text-2xl font-extrabold text-[#78350F]">
                {formatCurrency(cashStats.outstandingPayments)}
              </div>
              <span className="text-[10px] text-[#6E6359]">Accounts receivable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
