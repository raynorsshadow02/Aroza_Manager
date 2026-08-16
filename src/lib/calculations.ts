import {
  Product,
  Purchase,
  Sale,
  Expense,
  StockStatus,
  DashboardStats,
  DateFilterOption,
  CashFlowStats,
  ReconciliationRecord,
} from '@/types';

// Helper for exact 2-decimal monetary rounding to prevent floating-point precision bugs
export function roundMoney(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function getStockStatus(currentStock: number, reorderLevel: number = 5): StockStatus {
  const stock = Number(currentStock ?? 0);
  if (stock <= 0) return 'Out of Stock';
  if (stock <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const rounded = roundMoney(amount);
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);
  const parts = absAmount.toFixed(2).split('.');
  const formattedInt = new Intl.NumberFormat('en-IN').format(parseInt(parts[0], 10));

  const str = parts[1] === '00' ? `${currency}${formattedInt}` : `${currency}${formattedInt}.${parts[1]}`;
  return isNegative ? `-${str}` : str;
}

/**
 * Calculates weighted average unit cost for a product based on purchase history.
 */
export function calculateWeightedAverageCost(product: Product, purchases: Purchase[]): number {
  let totalCost = 0;
  let totalQty = 0;

  purchases.forEach((purchase) => {
    (purchase.items || []).forEach((item) => {
      if (item.product_id === product.id) {
        totalCost += roundMoney(Number(item.quantity || 0) * Number(item.unit_cost || 0));
        totalQty += Number(item.quantity || 0);
      }
    });
  });

  if (totalQty > 0) {
    return roundMoney(totalCost / totalQty);
  }

  return roundMoney(Number(product.purchase_price_default || 0));
}

/**
 * Comprehensive Product Financial Breakdown
 */
export function calculateProductFinancials(
  product: Product,
  purchases: Purchase[],
  sales: Sale[]
) {
  let totalPurchased = 0;
  let totalPurchaseCost = 0;

  purchases.forEach((p) => {
    (p.items || []).forEach((item) => {
      if (item.product_id === product.id) {
        const qty = Number(item.quantity || 0);
        const cost = Number(item.unit_cost || 0);
        totalPurchased += qty;
        totalPurchaseCost += roundMoney(qty * cost);
      }
    });
  });

  const avgPurchaseCost = totalPurchased > 0
    ? roundMoney(totalPurchaseCost / totalPurchased)
    : roundMoney(Number(product.purchase_price_default || 0));

  let totalSold = 0;
  let revenueGenerated = 0;
  let totalCogsSold = 0;

  sales.forEach((s) => {
    if (s.fulfillment_status === 'Cancelled') return;

    (s.items || []).forEach((item) => {
      if (item.product_id === product.id) {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unit_price || 0);
        const cost = Number(item.unit_cost || avgPurchaseCost);
        totalSold += qty;
        
        const itemCount = s.items.length || 1;
        const isPlatformShipping = s.platform === 'Meesho';
        const shippingAlloc = isPlatformShipping ? 0 : roundMoney(Number(s.shipping_charged || 0) / itemCount);
        const discountAlloc = roundMoney(Number(s.discount || 0) / itemCount);
        
        const itemRevenue = roundMoney((qty * price) + shippingAlloc - discountAlloc - Number(s.refund_amount || 0));
        revenueGenerated += itemRevenue;

        const itemCogs = roundMoney(qty * cost);
        totalCogsSold += itemCogs;
      }
    });
  });

  // Source of truth for current stock is the product's actual stock level
  const currentStock = Number(product.current_stock ?? (totalPurchased - totalSold));
  const effectiveStockForValuation = Math.max(0, currentStock);

  const inventoryValue = roundMoney(effectiveStockForValuation * avgPurchaseCost);
  const grossProfit = roundMoney(revenueGenerated - totalCogsSold);
  const profitMargin = revenueGenerated > 0 ? roundMoney((grossProfit / revenueGenerated) * 100) : 0;
  const potentialRemainingProfit = roundMoney(
    Math.max(0, (effectiveStockForValuation * Number(product.selling_price_default || 0)) - inventoryValue)
  );

  return {
    totalPurchased,
    totalSold,
    currentStock,
    avgPurchaseCost,
    inventoryValue,
    revenueGenerated: roundMoney(revenueGenerated),
    grossProfit: roundMoney(grossProfit),
    profitMargin,
    potentialRemainingProfit,
  };
}

export function filterByDateRange<
  T extends { date?: string; purchase_date?: string; sale_date?: string; created_at?: string }
>(items: T[], range: DateFilterOption, customStart?: string, customEnd?: string): T[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter((item) => {
    const itemDateStr = item.date || item.sale_date || item.purchase_date || item.created_at;
    if (!itemDateStr) return true;
    const date = new Date(itemDateStr);

    switch (range) {
      case 'Today':
        return date >= startOfDay;
      case 'This week': {
        const firstDayOfWeek = new Date(startOfDay);
        firstDayOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return date >= firstDayOfWeek;
      }
      case 'This month': {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= firstDayOfMonth;
      }
      case 'Last month': {
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return date >= firstDayOfLastMonth && date <= lastDayOfLastMonth;
      }
      case 'This year': {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        return date >= firstDayOfYear;
      }
      case 'Custom': {
        if (!customStart && !customEnd) return true;
        const start = customStart ? new Date(customStart) : new Date(0);
        const end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
        return date >= start && date <= end;
      }
      default:
        return true;
    }
  });
}

/**
 * Calculates Dashboard KPIs with exact financial differentiation
 */
export function calculateDashboardStats(
  products: Product[],
  purchases: Purchase[],
  sales: Sale[],
  expenses: Expense[]
): DashboardStats {
  const validSales = sales.filter((s) => s.fulfillment_status !== 'Cancelled');

  // 1. Total Realized Revenue
  const total_revenue = validSales.reduce((acc, s) => {
    if (typeof s.total_revenue === 'number' && !isNaN(s.total_revenue) && s.total_revenue > 0) {
      return roundMoney(acc + Number(s.total_revenue));
    }
    const platformCollectedShipping = s.platform === 'Meesho';
    const effectiveShipping = platformCollectedShipping ? 0 : Number(s.shipping_charged || 0);
    const itemTotal = (s.items || []).reduce(
      (sum, i) => sum + (Number(i.quantity || 0) * Number(i.unit_price || 0)),
      0
    );
    const netSaleRev = itemTotal + effectiveShipping - Number(s.discount || 0) - Number(s.refund_amount || 0);
    return roundMoney(acc + Math.max(0, netSaleRev));
  }, 0);

  // 2. COGS (Cost of Goods Sold)
  const total_cogs = validSales.reduce((acc, s) => {
    if (typeof s.total_cost === 'number' && !isNaN(s.total_cost) && s.total_cost > 0) {
      return roundMoney(acc + Number(s.total_cost));
    }
    const saleCogs = (s.items || []).reduce(
      (sum, i) => sum + (Number(i.quantity || 0) * Number(i.unit_cost || 0)),
      0
    );
    return roundMoney(acc + saleCogs);
  }, 0);

  // 3. Gross Profit
  const gross_profit = roundMoney(total_revenue - total_cogs);

  // 4. Selling Expenses
  const total_selling_expenses = validSales.reduce((acc, s) => {
    if (typeof s.total_selling_expenses === 'number' && !isNaN(s.total_selling_expenses)) {
      return roundMoney(acc + Number(s.total_selling_expenses));
    }
    return roundMoney(
      acc +
        Number(s.shipping_cost || 0) +
        Number(s.platform_fee || 0) +
        Number(s.packaging_cost || 0) +
        Number(s.other_expense || 0)
    );
  }, 0);

  // 5. Standalone Operating Expenses
  const total_operating_expenses = expenses.reduce((acc, e) => roundMoney(acc + Number(e.amount || 0)), 0);

  // 6. Total Expenses
  const total_expenses = roundMoney(total_selling_expenses + total_operating_expenses);

  // 7. Net Profit
  const total_profit = roundMoney(gross_profit - total_expenses);

  // 8. Total Investment (Total purchase costs + initial inventory cost)
  const purchasesTotal = purchases.reduce((acc, p) => roundMoney(acc + Number(p.total_amount || 0)), 0);

  // 9. Current Inventory Valuation (Cost vs Retail Selling Value)
  const inventory_cost_value = products.reduce((acc, product) => {
    const stock = Number(product.current_stock ?? 0);
    const unitCost = Number(product.purchase_price_default ?? 0);
    return roundMoney(acc + Math.max(0, stock) * unitCost);
  }, 0);

  const current_inventory_value = products.reduce((acc, product) => {
    const stock = Number(product.current_stock ?? 0);
    const sellingPrice = Number(product.selling_price_default || product.purchase_price_default || 0);
    return roundMoney(acc + Math.max(0, stock) * sellingPrice);
  }, 0);

  const total_investment = purchasesTotal > 0 ? purchasesTotal : inventory_cost_value;
  const potential_profit = roundMoney(Math.max(0, current_inventory_value - inventory_cost_value));

  // 10. Counts
  const total_products = products.length;
  const total_units_in_stock = products.reduce((acc, product) => {
    return acc + Number(product.current_stock ?? 0);
  }, 0);

  const units_sold = validSales.reduce((acc, s) => {
    return acc + (s.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, 0);

  const overall_profit_margin = total_revenue > 0 ? roundMoney((total_profit / total_revenue) * 100) : 0;

  return {
    total_revenue,
    total_profit,
    total_investment,
    current_inventory_value,
    inventory_cost_value,
    potential_profit,
    total_products,
    total_units_in_stock,
    units_sold,
    total_expenses,
    gross_profit,
    overall_profit_margin,
  };
}

/**
 * Cash Flow Tracking System
 */
export function calculateCashFlowStats(
  purchases: Purchase[],
  sales: Sale[],
  expenses: Expense[]
): CashFlowStats {
  const cashReceived = sales
    .filter((s) => s.payment_status === 'Paid' && s.fulfillment_status !== 'Cancelled')
    .reduce((acc, s) => {
      const rev = Number(s.total_revenue || 0);
      const fee = Number(s.platform_fee || 0);
      return roundMoney(acc + (rev - fee));
    }, 0);

  const purchasesCash = purchases.reduce((acc, p) => roundMoney(acc + Number(p.total_amount || 0)), 0);
  const expensesCash = expenses.reduce((acc, e) => roundMoney(acc + Number(e.amount || 0)), 0);
  const salesShippingSpent = sales
    .filter((s) => s.fulfillment_status !== 'Cancelled')
    .reduce((acc, s) => roundMoney(acc + Number(s.shipping_cost || 0) + Number(s.packaging_cost || 0)), 0);

  const cashSpent = roundMoney(purchasesCash + expensesCash + salesShippingSpent);
  const netCashFlow = roundMoney(cashReceived - cashSpent);
  const outstandingPayments = sales
    .filter((s) => s.payment_status === 'Pending' && s.fulfillment_status !== 'Cancelled')
    .reduce((acc, s) => roundMoney(acc + Number(s.total_revenue || 0)), 0);

  const totalRefunds = sales.reduce((acc, s) => roundMoney(acc + Number(s.refund_amount || 0)), 0);

  return {
    cashReceived,
    cashSpent,
    netCashFlow,
    outstandingPayments,
    totalRefunds,
  };
}
