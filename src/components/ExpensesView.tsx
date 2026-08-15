'use client';

import React from 'react';
import { Expense } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { deleteExpense } from '@/lib/data-service';
import { Receipt, Plus, Trash2, Tag, FileText } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onRefresh: () => void;
}

export default function ExpensesView({ expenses, onOpenAddExpense, onRefresh }: ExpensesViewProps) {
  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense record?')) {
      await deleteExpense(id);
      onRefresh();
    }
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Operating Business Expenses ({expenses.length})
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Total Operational Deductions:{' '}
            <strong className="text-[#DC2626]">{formatCurrency(totalExpenses)}</strong>
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] text-white hover:bg-[#B91C1C] font-bold text-xs shadow-xs transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E8E2D9] space-y-3">
          <Receipt className="w-12 h-12 mx-auto text-[#DC2626] opacity-40" />
          <h3 className="text-base font-bold text-[#2D241E]">No Operating Expenses Logged</h3>
          <p className="text-xs text-[#6E6359]">Log petrol, packaging supplies, IG ads, or equipment.</p>
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-xl"
          >
            + Add Expense
          </button>
        </div>
      ) : (
        <div className="aroza-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF7F2] text-[#6E6359] border-b border-[#E8E2D9] font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Related Item</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[#FAF7F2]">
                    <td className="p-3 text-[#6E6359]">{expense.date}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-3 text-[#2D241E] font-medium">{expense.description || '-'}</td>
                    <td className="p-3 text-[#6E6359]">{expense.product_name || 'General Business'}</td>
                    <td className="p-3 text-right font-extrabold text-[#DC2626]">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
