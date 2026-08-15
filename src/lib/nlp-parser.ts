import { Platform } from '@/types';

export interface ParsedCommand {
  type: 'PURCHASE' | 'SALE' | 'EXPENSE' | 'UNKNOWN';
  productName?: string;
  quantity?: number;
  price?: number;
  supplierOrLocation?: string;
  platform?: Platform;
  expenseDescription?: string;
  expenseAmount?: number;
  rawText: string;
}

export function parseNaturalLanguageInput(text: string): ParsedCommand {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. PURCHASE PARSING
  // Example: "Bought 20 Zoro spinner keychains for 40 each from market"
  // Example: "Purchased 15 Shusui katana keychains for ₹60 from DragonCraft"
  if (lower.startsWith('bought') || lower.startsWith('purchased') || lower.includes(' buy ') || lower.includes(' bought ')) {
    const qtyMatch = lower.match(/(?:bought|purchased|buy)\s+(\d+)/i);
    const priceMatch = lower.match(/(?:for|@|at)\s+₹?\s*(\d+(?:\.\d+)?)/i);
    const supplierMatch = lower.match(/(?:from|at|by)\s+([a-z0-9\s]+)$/i);

    // Extract product name between quantity and 'for'/'from'
    let productName = '';
    const nameMatch = clean.match(/(?:bought|purchased|buy)\s+\d+\s+(.*?)\s+(?:for|from|@|at)/i);
    if (nameMatch && nameMatch[1]) {
      productName = nameMatch[1].trim();
    } else {
      // Fallback extract
      const simpleName = clean.replace(/(?:bought|purchased|buy|for|₹|each|from|at|\d+)/gi, '').trim();
      productName = simpleName || 'Collectible Product';
    }

    return {
      type: 'PURCHASE',
      productName: capitalizeWords(productName),
      quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 10,
      price: priceMatch ? parseFloat(priceMatch[1]) : 40,
      supplierOrLocation: supplierMatch ? capitalizeWords(supplierMatch[1].trim()) : 'Market',
      rawText: clean,
    };
  }

  // 2. SALE PARSING
  // Example: "Sold 2 Zoro spinners for ₹199 each on Instagram"
  // Example: "Sell 1 Enma Katana for 319 on Meesho"
  if (lower.startsWith('sold') || lower.startsWith('sell') || lower.includes(' sale ')) {
    const qtyMatch = lower.match(/(?:sold|sell)\s+(\d+)/i);
    const priceMatch = lower.match(/(?:for|@|at)\s+₹?\s*(\d+(?:\.\d+)?)/i);
    
    let platform: Platform = 'Instagram';
    if (lower.includes('meesho')) platform = 'Meesho';
    else if (lower.includes('whatsapp')) platform = 'WhatsApp';
    else if (lower.includes('direct') || lower.includes('meetup')) platform = 'Direct';

    let productName = '';
    const nameMatch = clean.match(/(?:sold|sell)\s+\d+\s+(.*?)\s+(?:for|on|@|at)/i);
    if (nameMatch && nameMatch[1]) {
      productName = nameMatch[1].trim();
    } else {
      const simpleName = clean.replace(/(?:sold|sell|for|₹|each|on|at|instagram|meesho|whatsapp|direct|\d+)/gi, '').trim();
      productName = simpleName || 'Collectible Product';
    }

    return {
      type: 'SALE',
      productName: capitalizeWords(productName),
      quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 1,
      price: priceMatch ? parseFloat(priceMatch[1]) : 199,
      platform,
      rawText: clean,
    };
  }

  // 3. EXPENSE PARSING
  // Example: "Spent ₹500 for petrol"
  // Example: "Paid 300 for packaging boxes"
  if (lower.startsWith('spent') || lower.startsWith('paid') || lower.includes('expense')) {
    const amountMatch = lower.match(/(?:spent|paid|expense)\s+₹?\s*(\d+(?:\.\d+)?)/i);
    const descMatch = clean.match(/(?:for|on|towards)\s+(.*)/i);

    return {
      type: 'EXPENSE',
      expenseAmount: amountMatch ? parseFloat(amountMatch[1]) : 100,
      expenseDescription: descMatch ? descMatch[1].trim() : clean,
      rawText: clean,
    };
  }

  return {
    type: 'UNKNOWN',
    rawText: clean,
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}
