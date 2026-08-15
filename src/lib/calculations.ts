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
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= reorderLevel) return 'Low Stock';
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
    purchase.items.forEach((item) => {
      if (item.product_id === product.id) {
        totalCost += roundMoney(item.quantity * item.unit_cost);
        totalQty += item.quantity;
      }
    });
  });

  if (totalQty > 0) {
    return roundMoney(totalCost / totalQty);
  }

  return roundMoney(product.purchase_price_default || 0);
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
    p.items.forEach((item) => {
      if (item.product_id === product.id) {
        totalPurchased += item.quantity;
        totalPurchaseCost += roundMoney(item.quantity * item.unit_cost);
      }
    });
  });

  const avgPurchaseCost = totalPurchased > 0
    ? roundMoney(totalPurchaseCost / totalPurchased)
    : roundMoney(product.purchase_price_default || 0);

  let totalSold = 0;
  let revenueGenerated = 0;
  let totalCogsSold = 0;

  sales.forEach((s) => {
    if (s.fulfillment_status === 'Cancelled') return;

    s.items.forEach((item) => {
      if (item.product_id === product.id) {
        totalSold += item.quantity;
        
        // Exclude platform-collected shipping from Aroza product revenue
        const isPlatformShipping = s.platform === 'Meesho';
        const shippingAlloc = isPlatformShipping ? 0 : roundMoney((s.shipping_charged || 0) / s.items.length);
        const discountAlloc = roundMoney((s.discount || 0) / s.items.length);
        
        const itemRevenue = roundMoney((item.quantity * item.unit_price) + shippingAlloc - discountAlloc - (s.refund_amount || 0));
        revenueGenerated += itemRevenue;

        const itemCogs = roundMoney(item.quantity * (item.unit_cost || avgPurchaseCost));
        totalCogsSold += itemCogs;
      }
    });
  });

  const currentStock = Math.max(
    0,
    totalPurchased - totalSold - (product.damaged_qty || 0) + (product.returned_qty || 0)
  );

  const inventoryValue = roundMoney(currentStock * avgPurchaseCost);
  const grossProfit = roundMoney(revenueGenerated - totalCogsSold);
  const profitMargin = revenueGenerated > 0 ? roundMoney((grossProfit / revenueGenerated) * 100) : 0;
  const potentialRemainingProfit = roundMoney(
    Math.max(0, (currentStock * product.selling_price_default) - inventoryValue)
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
    const itemDateStr = item.date || item.purchase_date || item.sale_date || item.created_at;
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

  // 1. Total Realized Revenue (excluding platform-collected shipping & refunds)
  const total_revenue = validSales.reduce((acc, s) => {
    const platformCollectedShipping = s.platform === 'Meesho';
    const effectiveShipping = platformCollectedShipping ? 0 : (s.shipping_charged || 0);
    const itemTotal = s.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    const netSaleRev = roundMoney(itemTotal + effectiveShipping - (s.discount || 0) - (s.refund_amount || 0));
    return roundMoney(acc + netSaleRev);
  }, 0);

  // 2. COGS (Cost of Goods Sold)
  const total_cogs = validSales.reduce((acc, s) => {
    const saleCogs = s.items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0);
    return roundMoney(acc + saleCogs);
  }, 0);

  // 3. Gross Profit
  const gross_profit = roundMoney(total_revenue - total_cogs);

  // 4. Selling Expenses (shipping cost paid + platform fee + packaging cost + other)
  const total_selling_expenses = validSales.reduce(
    (acc, s) =>
      roundMoney(
        acc +
          (s.shipping_cost || 0) +
          (s.platform_fee || 0) +
          (s.packaging_cost || 0) +
          (s.other_expense || 0)
      ),
    0
  );

  // 5. Standalone Operating Expenses
  const total_operating_expenses = expenses.reduce((acc, e) => roundMoney(acc + (e.amount || 0)), 0);

  // 6. Total Expenses
  const total_expenses = roundMoney(total_selling_expenses + total_operating_expenses);

  // 7. Net Profit
  const total_profit = roundMoney(gross_profit - total_expenses);

  // 8. Total Investment (Total purchase orders)
  const total_investment = purchases.reduce((acc, p) => roundMoney(acc + (p.total_amount || 0)), 0);

  // 9. Inventory Valuation
  const current_inventory_value = products.reduce((acc, product) => {
    const fin = calculateProductFinancials(product, purchases, sales);
    return roundMoney(acc + fin.inventoryValue);
  }, 0);

  // 10. Counts
  const total_products = products.length;
  const total_units_in_stock = products.reduce((acc, product) => {
    const fin = calculateProductFinancials(product, purchases, sales);
    return acc + fin.currentStock;
  }, 0);

  const units_sold = validSales.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  const overall_profit_margin = total_revenue > 0 ? roundMoney((total_profit / total_revenue) * 100) : 0;

  return {
    total_revenue,
    total_profit,
    total_investment,
    current_inventory_value,
    total_products,
    total_units_in_stock,
    units_sold,
    total_expenses,
    gross_profit,
    overall_profit_margin,
  };
}

/**
 * Cash Flow Tracking System (Strictly Separates Liquidity Cash Flow from Accrual Profit)
 */
export function calculateCashFlowStats(
  purchases: Purchase[],
  sales: Sale[],
  expenses: Expense[]
): CashFlowStats {
  let cashReceived = 0;
  let outstandingPayments = 0;
  let totalRefunds = 0;

  sales.forEach((s) => {
    if (s.fulfillment_status === 'Cancelled') return;

    const platformCollectedShipping = s.platform === 'Meesho';
    const effectiveShipping = platformCollectedShipping ? 0 : (s.shipping_charged || 0);
    const itemTotal = s.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    const saleNetRev = roundMoney(itemTotal + effectiveShipping - (s.discount || 0));

    if (s.payment_status === 'Paid') {
      cashReceived = roundMoney(cashReceived + saleNetRev - (s.platform_fee || 0) - (s.refund_amount || 0));
    } else if (s.payment_status === 'Pending') {
      outstandingPayments = roundMoney(outstandingPayments + saleNetRev);
    }

    if (s.refund_amount && s.refund_amount > 0) {
      totalRefunds = roundMoney(totalRefunds + s.refund_amount);
    }
  });

  const cashSpentPurchases = purchases.reduce((acc, p) => roundMoney(acc + (p.total_amount || 0)), 0);
  const cashSpentExpenses = expenses.reduce((acc, e) => roundMoney(acc + (e.amount || 0)), 0);
  const cashSpentShipping = sales.reduce(
    (acc, s) => (s.fulfillment_status === 'Cancelled' ? acc : roundMoney(acc + (s.shipping_cost || 0))),
    0
  );

  const cashSpent = roundMoney(cashSpentPurchases + cashSpentExpenses + cashSpentShipping);
  const netCashFlow = roundMoney(cashReceived - cashSpent);

  return {
    cashReceived,
    cashSpent,
    netCashFlow,
    outstandingPayments,
    totalRefunds,
  };
}
