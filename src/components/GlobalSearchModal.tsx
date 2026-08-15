'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Package, ShoppingBag, Truck, Receipt, Tag } from 'lucide-react';
import { Product, Sale, Purchase, Supplier } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
  onSelectProduct: (product: Product) => void;
  onSelectSale?: (sale: Sale) => void;
  onSelectPurchase?: (purchase: Purchase) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  products,
  sales,
  purchases,
  suppliers,
  onSelectProduct,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingProducts = cleanQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.sku.toLowerCase().includes(cleanQuery) ||
          (p.category_name && p.category_name.toLowerCase().includes(cleanQuery)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(cleanQuery)))
      ).slice(0, 5)
    : [];

  const matchingSales = cleanQuery
    ? sales.filter(
        (s) =>
          s.order_number.toLowerCase().includes(cleanQuery) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(cleanQuery)) ||
          s.platform.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  const matchingPurchases = cleanQuery
    ? purchases.filter(
        (p) =>
          p.purchase_number.toLowerCase().includes(cleanQuery) ||
          (p.supplier_name && p.supplier_name.toLowerCase().includes(cleanQuery))
      ).slice(0, 4)
    : [];

  const matchingSuppliers = cleanQuery
    ? suppliers.filter(
        (sup) =>
          sup.name.toLowerCase().includes(cleanQuery) ||
          (sup.location && sup.location.toLowerCase().includes(cleanQuery))
      ).slice(0, 4)
    : [];

  const totalResults =
    matchingProducts.length + matchingSales.length + matchingPurchases.length + matchingSuppliers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E8E2D9] gap-3">
          <Search className="w-5 h-5 text-[#9E5827]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, SKUs, sales orders, purchases, suppliers..."
            className="flex-1 bg-transparent text-[#2D241E] text-base placeholder-[#9C9288] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#9C9288] hover:text-[#2D241E] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-[#6E6359] bg-[#F4EBE1] hover:bg-[#EBE0D3] rounded-md font-medium"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {!query && (
            <div className="py-8 text-center text-[#9C9288]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#9E5827]" />
              <p className="text-sm font-medium">Search anything in Aroza Collectibles</p>
              <p className="text-xs text-[#6E6359] mt-1">Try searching for "Zoro", "SKU", "Instagram", "Supplier", or "Order"</p>
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="py-8 text-center text-[#6E6359]">
              <p className="text-sm">No matches found for "{query}"</p>
            </div>
          )}

          {/* Product Results */}
          {matchingProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9E5827] uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5" />
                Products ({matchingProducts.length})
              </div>
              <div className="space-y-1.5">
                {matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg border border-[#E8E2D9]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#F4EBE1] flex items-center justify-center text-[#9E5827]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm text-[#2D241E] group-hover:text-[#9E5827] flex items-center gap-2">
                          {product.name}
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#F4EBE1] text-[#6E6359]">
                            {product.sku}
                          </span>
                        </div>
                        <div className="text-xs text-[#6E6359]">
                          Stock: <span className="font-semibold">{product.current_stock}</span> • {product.category_name || 'Collectible'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#2D241E]">
                        {formatCurrency(product.selling_price_default)}
                      </div>
                      <div className="text-xs text-[#9E5827]">
                        Cost: {formatCurrency(product.purchase_price_default)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sales Results */}
          {matchingSales.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E7D32] uppercase tracking-wider mb-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                Sales ({matchingSales.length})
              </div>
              <div className="space-y-1.5">
                {matchingSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#2D241E] flex items-center gap-2">
                        {sale.order_number}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-medium">
                          {sale.platform}
                        </span>
                      </div>
                      <div className="text-xs text-[#6E6359]">
                        Customer: {sale.customer_name || 'Walk-in'} • Date: {sale.sale_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#2E7D32]">
                        + {formatCurrency(sale.total_revenue)}
                      </div>
                      <div className="text-xs text-[#6E6359]">
                        Profit: {formatCurrency(sale.net_profit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchases Results */}
          {matchingPurchases.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D97706] uppercase tracking-wider mb-2">
                <Truck className="w-3.5 h-3.5" />
                Purchases ({matchingPurchases.length})
              </div>
              <div className="space-y-1.5">
                {matchingPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#2D241E]">
                        {purchase.purchase_number}
                      </div>
                      <div className="text-xs text-[#6E6359]">
                        Supplier: {purchase.supplier_name || 'N/A'} • {purchase.purchase_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#2D241E]">
                        {formatCurrency(purchase.total_amount)}
                      </div>
                      <div className="text-xs text-[#6E6359]">
                        {purchase.items.length} item types
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
