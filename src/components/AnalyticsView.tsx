'use client';

import React, { useState } from 'react';
import { Product, Purchase, Sale, Expense, DateFilterOption } from '@/types';
import {
  calculateDashboardStats,
  formatCurrency,
  filterByDateRange,
  calculateProductFinancials,
} from '@/lib/calculations';
import { BarChart3, Download, Filter, TrendingUp, DollarSign, Package } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsViewProps {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
}

export default function AnalyticsView({
  products,
  purchases,
  sales,
  expenses,
}: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState<DateFilterOption>('This year');

  const filteredSales = filterByDateRange(sales, dateRange);
  const filteredPurchases = filterByDateRange(purchases, dateRange);
  const filteredExpenses = filterByDateRange(expenses, dateRange);

  const stats = calculateDashboardStats(products, filteredPurchases, filteredSales, filteredExpenses);

  // Chart 1: Sales & Profit by Product
  const productStatsData = products.map((p) => {
    const fin = calculateProductFinancials(p, purchases, sales);
    return {
      name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
      revenue: fin.revenueGenerated,
      profit: fin.grossProfit,
      sold: fin.totalSold,
    };
  });

  // Chart 2: Monthly Financial Breakdown
  const monthlyMap = new Map<string, { month: string; revenue: number; profit: number; expenses: number }>();
  filteredSales.forEach((s) => {
    const monthKey = s.sale_date ? s.sale_date.slice(0, 7) : '2026-08';
    const curr = monthlyMap.get(monthKey) || { month: monthKey, revenue: 0, profit: 0, expenses: 0 };
    curr.revenue += s.total_revenue;
    curr.profit += s.net_profit;
    monthlyMap.set(monthKey, curr);
  });

  filteredExpenses.forEach((e) => {
    const monthKey = e.date ? e.date.slice(0, 7) : '2026-08';
    const curr = monthlyMap.get(monthKey) || { month: monthKey, revenue: 0, profit: 0, expenses: 0 };
    curr.expenses += e.amount;
    monthlyMap.set(monthKey, curr);
  });

  const monthlyChartData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // CSV Report Generator
  const handleExportCSV = () => {
    const headers = ['Type', 'Identifier / Name', 'Date', 'Category / Platform', 'Amount / Revenue (₹)', 'Net Profit (₹)'];
    const rows: string[][] = [];

    filteredSales.forEach((s) => {
      rows.push(['SALE', s.order_number, s.sale_date, s.platform, s.total_revenue.toString(), s.net_profit.toString()]);
    });

    filteredPurchases.forEach((p) => {
      rows.push(['PURCHASE', p.purchase_number, p.purchase_date, p.supplier_name || '', p.total_amount.toString(), '0']);
    });

    filteredExpenses.forEach((e) => {
      rows.push(['EXPENSE', e.category, e.date, e.description || '', e.amount.toString(), `-${e.amount}`]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Aroza_Collectibles_Financial_Report_${dateRange.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Aroza Business Analytics & Financial Reports
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Audit-ready calculations and profit export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#9E5827]" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateFilterOption)}
              className="bg-transparent font-semibold text-[#2D241E] focus:outline-none cursor-pointer"
            >
              <option value="This month">This Month</option>
              <option value="Last month">Last Month</option>
              <option value="This year">This Year</option>
              <option value="Today">Today</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#9E5827] text-white text-xs font-bold rounded-xl hover:bg-[#86481E] shadow-xs"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="aroza-card p-4 space-y-1">
          <span className="text-xs text-[#6E6359] font-medium">Revenue</span>
          <div className="text-2xl font-extrabold text-[#2E7D32]">
            {formatCurrency(stats.total_revenue)}
          </div>
          <span className="text-[11px] text-[#6E6359]">{stats.units_sold} units sold</span>
        </div>

        <div className="aroza-card p-4 space-y-1">
          <span className="text-xs text-[#6E6359] font-medium">Gross Profit</span>
          <div className="text-2xl font-extrabold text-[#2D241E]">
            {formatCurrency(stats.gross_profit)}
          </div>
          <span className="text-[11px] text-[#6E6359]">Revenue minus COGS</span>
        </div>

        <div className="aroza-card p-4 space-y-1">
          <span className="text-xs text-[#6E6359] font-medium">Net Profit</span>
          <div className="text-2xl font-extrabold text-[#9E5827]">
            {formatCurrency(stats.total_profit)}
          </div>
          <span className="text-[11px] text-[#2E7D32] font-semibold">
            {stats.overall_profit_margin.toFixed(1)}% Profit Margin
          </span>
        </div>

        <div className="aroza-card p-4 space-y-1">
          <span className="text-xs text-[#6E6359] font-medium">Total Operating Expenses</span>
          <div className="text-2xl font-extrabold text-[#DC2626]">
            {formatCurrency(stats.total_expenses)}
          </div>
          <span className="text-[11px] text-[#6E6359]">Platform, shipping & expenses</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="aroza-card p-5 space-y-4">
          <h3 className="font-bold text-base text-[#2D241E]">Revenue & Profit by Product</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6E6359' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6E6359' }} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Bar dataKey="revenue" name="Revenue" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit" fill="#9E5827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="aroza-card p-5 space-y-4">
          <h3 className="font-bold text-base text-[#2D241E]">Monthly Financial Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6E6359' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6E6359' }} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Bar dataKey="revenue" name="Revenue" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
