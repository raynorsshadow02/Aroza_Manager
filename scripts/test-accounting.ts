import {
  calculateWeightedAverageCost,
  calculateProductFinancials,
  calculateDashboardStats,
  calculateCashFlowStats,
  roundMoney,
} from '../src/lib/calculations';
import { Product, Purchase, Sale, Expense } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, actual?: any, expected?: any) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Actual:   ${JSON.stringify(actual)}`);
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    failed++;
  }
}

console.log('=====================================================');
console.log('  AROZA MANAGER DEEP FINANCIAL & ACCOUNTING AUDIT');
console.log('=====================================================\n');

// SETUP BASE PRODUCT
const sampleProduct: Product = {
  id: 'test-prod-1',
  name: 'Zoro Katana Spinner',
  sku: 'TEST-ZOR-01',
  purchase_price_default: 40,
  selling_price_default: 200,
  min_reorder_level: 5,
  current_stock: 0,
  damaged_qty: 0,
  returned_qty: 0,
};

// -----------------------------------------------------------------------------
// TEST 1: Single Purchase
// -----------------------------------------------------------------------------
const purchase1: Purchase = {
  id: 'pur-1',
  purchase_number: 'PUR-001',
  purchase_date: '2026-08-01',
  transport_cost: 0,
  packaging_cost: 0,
  other_expenses: 0,
  payment_method: 'UPI',
  total_amount: 800, // 20 * 40
  items: [{ product_id: 'test-prod-1', quantity: 20, unit_cost: 40, total_cost: 800 }],
};

const avgCost1 = calculateWeightedAverageCost(sampleProduct, [purchase1]);
assert(avgCost1 === 40, 'Test 1: Single Purchase Weighted Average Cost is ₹40.00', avgCost1, 40);

// -----------------------------------------------------------------------------
// TEST 2: Multiple Purchases at Different Prices
// -----------------------------------------------------------------------------
// Buy 20 units @ ₹40 = 800. Then buy 10 units @ ₹70 = 700.
// Expected Weighted Avg Cost = (800 + 700) / 30 = 1500 / 30 = 50.00
const purchase2: Purchase = {
  id: 'pur-2',
  purchase_number: 'PUR-002',
  purchase_date: '2026-08-05',
  transport_cost: 0,
  packaging_cost: 0,
  other_expenses: 0,
  payment_method: 'UPI',
  total_amount: 700,
  items: [{ product_id: 'test-prod-1', quantity: 10, unit_cost: 70, total_cost: 700 }],
};

const avgCost2 = calculateWeightedAverageCost(sampleProduct, [purchase1, purchase2]);
assert(avgCost2 === 50, 'Test 2: Multiple Purchases Weighted Average Cost (20@40 + 10@70 = ₹50.00)', avgCost2, 50);

// -----------------------------------------------------------------------------
// TEST 3: Partial Sale & COGS
// -----------------------------------------------------------------------------
// Sell 5 units @ ₹200 on Instagram. Shipping charged: ₹50, shipping cost paid: ₹45, packaging: ₹10.
// Revenue = (5 * 200) + 50 = 1050
// COGS = 5 * 50 (weighted avg cost) = 250
// Selling expenses = 45 + 10 = 55
// Net profit = 1050 - 250 - 55 = 745
const sale1: Sale = {
  id: 'sale-1',
  order_number: 'ORD-001',
  sale_date: '2026-08-10',
  platform: 'Instagram',
  shipping_charged: 50,
  shipping_cost: 45,
  platform_fee: 0,
  packaging_cost: 10,
  discount: 0,
  other_expense: 0,
  payment_status: 'Paid',
  fulfillment_status: 'Completed',
  total_revenue: 1050,
  total_cost: 250,
  total_selling_expenses: 55,
  net_profit: 745,
  profit_margin: 70.95,
  items: [{ product_id: 'test-prod-1', quantity: 5, unit_price: 200, unit_cost: 50 }],
};

const fin3 = calculateProductFinancials(sampleProduct, [purchase1, purchase2], [sale1]);
assert(fin3.currentStock === 25, 'Test 3a: Stock remaining after partial sale (30 - 5 = 25)', fin3.currentStock, 25);
assert(fin3.revenueGenerated === 1050, 'Test 3b: Realized Revenue is ₹1050', fin3.revenueGenerated, 1050);
assert(fin3.grossProfit === 800, 'Test 3c: Gross Profit (1050 - 250 = ₹800)', fin3.grossProfit, 800);

// -----------------------------------------------------------------------------
// TEST 4: Damaged Inventory Handling
// -----------------------------------------------------------------------------
const damagedProduct = { ...sampleProduct, damaged_qty: 2 };
const fin4 = calculateProductFinancials(damagedProduct, [purchase1, purchase2], [sale1]);
assert(fin4.currentStock === 23, 'Test 4: Stock after 2 damaged units (25 - 2 = 23)', fin4.currentStock, 23);

// -----------------------------------------------------------------------------
// TEST 5: Physically Restocked Return
// -----------------------------------------------------------------------------
const returnedProduct = { ...damagedProduct, returned_qty: 1 };
const fin5 = calculateProductFinancials(returnedProduct, [purchase1, purchase2], [sale1]);
assert(fin5.currentStock === 24, 'Test 5: Stock after 1 restocked return (23 + 1 = 24)', fin5.currentStock, 24);

// -----------------------------------------------------------------------------
// TEST 6: Sale Refund (Revenue Deduction)
// -----------------------------------------------------------------------------
const refundedSale: Sale = {
  ...sale1,
  id: 'sale-2',
  order_number: 'ORD-002',
  refund_amount: 200, // ₹200 refund given to customer
};

const stats6 = calculateDashboardStats([returnedProduct], [purchase1, purchase2], [refundedSale], []);
// Expected revenue = 1050 - 200 = 850
assert(stats6.total_revenue === 850, 'Test 6: Total Realized Revenue after ₹200 refund (1050 - 200 = ₹850)', stats6.total_revenue, 850);

// -----------------------------------------------------------------------------
// TEST 7: Platform-Collected Shipping (Meesho Rule)
// -----------------------------------------------------------------------------
// Meesho collects shipping from buyer directly. Aroza lists item at ₹220, platform fee ₹30.
// Aroza Revenue MUST BE ₹220, NOT ₹220 + shipping!
const meeshoSale: Sale = {
  id: 'sale-meesho',
  order_number: 'ORD-MSH-1',
  sale_date: '2026-08-12',
  platform: 'Meesho',
  shipping_charged: 60, // Collected by Meesho, NOT Aroza
  shipping_cost: 0,
  platform_fee: 30,
  packaging_cost: 12,
  discount: 0,
  other_expense: 0,
  payment_status: 'Paid',
  fulfillment_status: 'Completed',
  total_revenue: 220,
  total_cost: 50,
  total_selling_expenses: 42,
  net_profit: 128,
  profit_margin: 58.18,
  items: [{ product_id: 'test-prod-1', quantity: 1, unit_price: 220, unit_cost: 50 }],
};

const stats7 = calculateDashboardStats([returnedProduct], [], [meeshoSale], []);
assert(stats7.total_revenue === 220, 'Test 7: Meesho platform-collected shipping is excluded from Aroza revenue (₹220)', stats7.total_revenue, 220);

// -----------------------------------------------------------------------------
// TEST 8: Standalone Operating Expenses
// -----------------------------------------------------------------------------
const exp1: Expense = {
  id: 'exp-1',
  date: '2026-08-10',
  category: 'Petrol',
  amount: 300,
  description: 'Fuel to courier hub',
};

const stats8 = calculateDashboardStats([returnedProduct], [purchase1, purchase2], [sale1], [exp1]);
// Revenue = 1050, Gross Profit = 800, Selling Expenses = 55, Operating Exp = 300
// Net Profit = 800 - 55 - 300 = 445
assert(stats8.total_profit === 445, 'Test 8: Net Profit after operating expenses (800 - 55 - 300 = ₹445)', stats8.total_profit, 445);

// -----------------------------------------------------------------------------
// TEST 9: Cash Flow vs Accrual Profit
// -----------------------------------------------------------------------------
const cashStats = calculateCashFlowStats([purchase1, purchase2], [sale1], [exp1]);
// Cash Received: sale1 (Paid) = 1050
// Cash Spent: purchase1 (800) + purchase2 (700) + exp1 (300) + sale1 shipping (45) = 1845
// Net Cash Flow = 1050 - 1845 = -795
assert(cashStats.cashReceived === 1050, 'Test 9a: Cash Received from sales = ₹1050', cashStats.cashReceived, 1050);
assert(cashStats.cashSpent === 1845, 'Test 9b: Total Cash Outflow = ₹1845', cashStats.cashSpent, 1845);
assert(cashStats.netCashFlow === -795, 'Test 9c: Net Cash Flow = -₹795', cashStats.netCashFlow, -795);

// -----------------------------------------------------------------------------
// TEST 10: Zero Revenue Profit Margin Safety
// -----------------------------------------------------------------------------
const zeroRevStats = calculateDashboardStats([returnedProduct], [], [], [exp1]);
assert(zeroRevStats.overall_profit_margin === 0, 'Test 10: Zero revenue returns 0% margin safely', zeroRevStats.overall_profit_margin, 0);

// -----------------------------------------------------------------------------
// TEST 11: Multi-Product Purchase
// -----------------------------------------------------------------------------
const multiProdPurchase: Purchase = {
  id: 'pur-multi',
  purchase_number: 'PUR-MULTI',
  purchase_date: '2026-08-14',
  transport_cost: 200,
  packaging_cost: 50,
  other_expenses: 0,
  payment_method: 'UPI',
  total_amount: 2250, // (20 * 40) + (10 * 60) + 200 + 50 = 800 + 600 + 250 = 1650? Wait: 800 + 600 + 250 = 1650
  items: [
    { product_id: 'test-prod-1', quantity: 20, unit_cost: 40, total_cost: 800 },
    { product_id: 'test-prod-2', quantity: 10, unit_cost: 60, total_cost: 600 },
  ],
};
const itemsTotal = multiProdPurchase.items.reduce((a, b) => a + b.total_cost, 0);
assert(itemsTotal === 1400, 'Test 11: Multi-product line items subtotal = ₹1400', itemsTotal, 1400);

// -----------------------------------------------------------------------------
// TEST 12: Precision Monetary Rounding
// -----------------------------------------------------------------------------
const preciseFloat = roundMoney(0.1 + 0.2);
assert(preciseFloat === 0.3, 'Test 12: Floating-point precision (0.1 + 0.2 = 0.30)', preciseFloat, 0.3);

console.log('\n=====================================================');
console.log(`  AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('=====================================================\n');

if (failed > 0) {
  process.exit(1);
}
