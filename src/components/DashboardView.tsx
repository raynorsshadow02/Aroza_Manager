'use client';

import React, { useState } from 'react';
import {
  Product,
  Purchase,
  Sale,
  Expense,
  DateFilterOption,
  Supplier,
} from '@/types';
import {
  calculateDashboardStats,
  calculateCashFlowStats,
  formatCurrency,
  filterByDateRange,
  calculateProductFinancials,
  getStockStatus,
} from '@/lib/calculations';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Truck,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Plus,
  BarChart2,
  Wallet,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
  onOpenQuickAction: (actionType: 'product' | 'purchase' | 'sale' | 'expense' | 'supplier' | 'reconcile') => void;
  onSelectProduct: (product: Product) => void;
}

export default function DashboardView({
  products,
  purchases,
  sales,
  expenses,
  suppliers,
  onOpenQuickAction,
  onSelectProduct,
}: DashboardViewProps) {
  const [dateRange, setDateRange] = useState<DateFilterOption>('This month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter dataset by selected date range
  const filteredSales = filterByDateRange(sales, dateRange, customStart, customEnd);
  const filteredPurchases = filterByDateRange(purchases, dateRange, customStart, customEnd);
  const filteredExpenses = filterByDateRange(expenses, dateRange, customStart, customEnd);

  const stats = calculateDashboardStats(products, filteredPurchases, filteredSales, filteredExpenses);
  const cashStats = calculateCashFlowStats(filteredPurchases, filteredSales, filteredExpenses);

  // Identify Low Stock items
  const lowStockProducts = products.filter((p) => p.current_stock <= (p.min_reorder_level || 5));

  // Top Selling Products
  const productSalesMap = new Map<string, { product: Product; qtySold: number; revenue: number; profit: number }>();

  products.forEach((p) => {
    productSalesMap.set(p.id, { product: p, qtySold: 0, revenue: 0, profit: 0 });
  });

  filteredSales.forEach((s) => {
    if (s.fulfillment_status === 'Cancelled') return;
    s.items.forEach((item) => {
      const existing = productSalesMap.get(item.product_id);
      if (existing) {
        existing.qtySold += item.quantity;
        existing.revenue += item.quantity * item.unit_price;
        existing.profit += item.quantity * (item.unit_price - item.unit_cost);
      }
    });
  });

  const topSellingProducts = Array.from(productSalesMap.values())
    .filter((item) => item.qtySold > 0)
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, 5);

  const mostProfitableProducts = Array.from(productSalesMap.values())
    .filter((item) => item.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  // Prepare chart data for Revenue & Profit Over Time
  const salesByDateMap = new Map<string, { date: string; revenue: number; profit: number }>();
  filteredSales.forEach((s) => {
    if (s.fulfillment_status === 'Cancelled') return;
    const d = s.sale_date || '2026-08-01';
    const curr = salesByDateMap.get(d) || { date: d, revenue: 0, profit: 0 };
    curr.revenue += s.total_revenue;
    curr.profit += s.net_profit;
    salesByDateMap.set(d, curr);
  });

  const timeSeriesData = Array.from(salesByDateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Sales by Platform Data
  const platformMap = new Map<string, number>();
  filteredSales.forEach((s) => {
    if (s.fulfillment_status === 'Cancelled') return;
    const curr = platformMap.get(s.platform) || 0;
    platformMap.set(s.platform, curr + s.total_revenue);
  });
  const platformData = Array.from(platformMap.entries()).map(([name, value]) => ({ name, value }));

  const COLORS = ['#9E5827', '#2E7D32', '#D97706', '#0284C7', '#7C3AED'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Aroza Collectibles Business Dashboard
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Real-time financial performance & inventory overview
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8E2D9] px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#9E5827]" />
            <span className="font-medium text-[#6E6359]">Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateFilterOption)}
              className="bg-transparent font-semibold text-[#2D241E] focus:outline-none cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This week">This Week</option>
              <option value="This month">This Month</option>
              <option value="Last month">Last Month</option>
              <option value="This year">This Year</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'Custom' && (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-white border border-[#E8E2D9] rounded-lg"
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-white border border-[#E8E2D9] rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Large Quick-Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <button
          onClick={() => onOpenQuickAction('sale')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#2E7D32] text-white hover:bg-[#256628] shadow-sm font-bold text-xs transition-transform active:scale-98"
        >
          <ShoppingBag className="w-4 h-4" /> + Record Sale
        </button>
        <button
          onClick={() => onOpenQuickAction('product')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#9E5827] text-white hover:bg-[#86481E] shadow-sm font-bold text-xs transition-transform active:scale-98"
        >
          <Package className="w-4 h-4" /> + Add Product
        </button>
        <button
          onClick={() => onOpenQuickAction('purchase')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#2D241E] font-semibold text-xs transition-colors"
        >
          <Truck className="w-4 h-4 text-[#D97706]" /> + Purchase
        </button>
        <button
          onClick={() => onOpenQuickAction('expense')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#2D241E] font-semibold text-xs transition-colors"
        >
          <Receipt className="w-4 h-4 text-[#DC2626]" /> + Expense
        </button>
        <button
          onClick={() => onOpenQuickAction('reconcile')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#2D241E] font-semibold text-xs transition-colors"
        >
          Reconcile
        </button>
        <button
          onClick={() => onOpenQuickAction('supplier')}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#6E6359] font-semibold text-xs transition-colors"
        >
          + Supplier
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="aroza-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6359]">
            <span>Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D241E]">
            {formatCurrency(stats.total_revenue)}
          </div>
          <span className="text-[11px] text-[#2E7D32] font-semibold block">
            {stats.units_sold} units sold
          </span>
        </div>

        {/* Total Net Profit */}
        <div className="aroza-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6359]">
            <span>Total Net Profit</span>
            <div className="w-7 h-7 rounded-lg bg-[#F4EBE1] text-[#9E5827] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#9E5827]">
            {formatCurrency(stats.total_profit)}
          </div>
          <span className="text-[11px] text-[#6E6359] font-medium block">
            {stats.overall_profit_margin.toFixed(1)}% Net Margin
          </span>
        </div>

        {/* Total Investment */}
        <div className="aroza-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6359]">
            <span>Total Investment</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D241E]">
            {formatCurrency(stats.total_investment)}
          </div>
          <span className="text-[11px] text-[#6E6359] block">Total purchase orders spend</span>
        </div>

        {/* Current Inventory Value */}
        <div className="aroza-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6359]">
            <span>Inventory Value</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] text-[#2D241E] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D241E]">
            {formatCurrency(stats.current_inventory_value)}
          </div>
          <span className="text-[11px] text-[#6E6359] block">
            {stats.total_units_in_stock} stock units across {stats.total_products} items
          </span>
        </div>
      </div>

      {/* CASH FLOW VS ACCRUAL PROFIT BREAKDOWN CARD */}
      <div className="aroza-card p-5 space-y-3 bg-white">
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#9E5827]" />
            <h3 className="font-bold text-sm text-[#2D241E]">
              Cash Flow Liquidity vs. Accrual Accounting
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#6E6359] border border-[#E8E2D9]">
            Actual Cash Out/Inflow
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7]">
            <span className="text-[#2E7D32] block font-semibold text-[11px]">Cash Collected</span>
            <span className="text-base font-extrabold text-[#1B5E20]">
              {formatCurrency(cashStats.cashReceived)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5]">
            <span className="text-[#DC2626] block font-semibold text-[11px]">Cash Spent</span>
            <span className="text-base font-extrabold text-[#991B1B]">
              {formatCurrency(cashStats.cashSpent)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
            <span className="text-[#6E6359] block font-semibold text-[11px]">Net Cash Flow</span>
            <span
              className={`text-base font-extrabold ${
                cashStats.netCashFlow >= 0 ? 'text-[#2E7D32]' : 'text-[#DC2626]'
              }`}
            >
              {formatCurrency(cashStats.netCashFlow)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A]">
            <span className="text-[#D97706] block font-semibold text-[11px]">Pending Uncollected</span>
            <span className="text-base font-extrabold text-[#78350F]">
              {formatCurrency(cashStats.outstandingPayments)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue & Profit Over Time Area Chart */}
        <div className="lg:col-span-8 aroza-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#2D241E]">Revenue & Profit Performance</h3>
              <p className="text-xs text-[#6E6359]">Timeline trend based on sales</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timeSeriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#6E6359]">
                No sales data for selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9E5827" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9E5827" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6E6359' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6E6359' }} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E8E2D9' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#2E7D32"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Net Profit"
                    stroke="#9E5827"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sales by Platform Donut Chart */}
        <div className="lg:col-span-4 aroza-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-[#2D241E]">Sales by Platform</h3>
            <p className="text-xs text-[#6E6359]">Revenue breakdown by channel</p>
          </div>

          <div className="h-52 w-full">
            {platformData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#6E6359]">
                No sales yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E8E2D9]">
            {platformData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-[#6E6359] truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Highlight Lists & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="aroza-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2.5">
            <h3 className="font-bold text-sm text-[#2D241E]">Top Selling Products</h3>
            <span className="text-xs font-semibold text-[#9E5827]">By Units</span>
          </div>

          {topSellingProducts.length === 0 ? (
            <p className="text-xs text-[#6E6359] py-4 text-center">No sales recorded yet</p>
          ) : (
            <div className="space-y-2.5">
              {topSellingProducts.map(({ product, qtySold, revenue }) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].image_url}
                        alt=""
                        className="w-9 h-9 object-cover rounded-lg border border-[#E8E2D9]"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-[#F4EBE1] rounded-lg flex items-center justify-center text-[#9E5827]">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-xs text-[#2D241E] line-clamp-1">{product.name}</h4>
                      <span className="text-[11px] text-[#6E6359]">{qtySold} units sold</span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#2E7D32]">{formatCurrency(revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Profitable Products */}
        <div className="aroza-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2.5">
            <h3 className="font-bold text-sm text-[#2D241E]">Most Profitable Products</h3>
            <span className="text-xs font-semibold text-[#2E7D32]">By Profit (₹)</span>
          </div>

          {mostProfitableProducts.length === 0 ? (
            <p className="text-xs text-[#6E6359] py-4 text-center">No profit metrics yet</p>
          ) : (
            <div className="space-y-2.5">
              {mostProfitableProducts.map(({ product, profit }) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].image_url}
                        alt=""
                        className="w-9 h-9 object-cover rounded-lg border border-[#E8E2D9]"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-[#F4EBE1] rounded-lg flex items-center justify-center text-[#9E5827]">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-xs text-[#2D241E] line-clamp-1">{product.name}</h4>
                      <span className="text-[11px] text-[#6E6359]">{product.category_name}</span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#2E7D32]">+{formatCurrency(profit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="aroza-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2.5">
            <h3 className="font-bold text-sm text-[#2D241E] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" /> Low Stock Alerts
            </h3>
            <span className="text-xs font-bold text-[#D97706]">{lowStockProducts.length} items</span>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-[#2E7D32] py-4 text-center font-medium">
              All product stock levels are healthy!
            </p>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] cursor-pointer"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-[#78350F] line-clamp-1">{product.name}</h4>
                    <span className="text-[11px] text-[#92400E]">
                      Stock: <strong>{product.current_stock}</strong> / Reorder at {product.min_reorder_level}
                    </span>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-[#D97706] text-white">
                    Restock
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
