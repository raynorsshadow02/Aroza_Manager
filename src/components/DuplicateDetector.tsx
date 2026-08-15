'use client';

import React from 'react';
import { Product } from '@/types';
import { Package, PlusCircle, AlertCircle } from 'lucide-react';

interface DuplicateDetectorProps {
  query: string;
  products: Product[];
  onSelectExisting: (product: Product) => void;
  onConfirmNew: () => void;
}

export default function DuplicateDetector({
  query,
  products,
  onSelectExisting,
  onConfirmNew,
}: DuplicateDetectorProps) {
  if (!query.trim() || query.length < 3) return null;

  const clean = query.toLowerCase().trim();
  const matches = products.filter(
    (p) =>
      p.name.toLowerCase().includes(clean) ||
      p.sku.toLowerCase().includes(clean) ||
      clean.includes(p.name.toLowerCase())
  );

  if (matches.length === 0) return null;

  return (
    <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl space-y-2.5 text-xs animate-in fade-in duration-150">
      <div className="flex items-center gap-2 text-[#78350F] font-bold">
        <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
        <span>Is this an existing product?</span>
      </div>

      <p className="text-[#92400E] text-[11px]">
        We found {matches.length} matching item(s) already in Aroza Collectibles. You can add stock to an existing item or proceed with creating a new item.
      </p>

      <div className="space-y-1.5">
        {matches.slice(0, 3).map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8E2D9]"
          >
            <div className="flex items-center gap-2">
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0].image_url}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover border border-[#E8E2D9]"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#F4EBE1] flex items-center justify-center text-[#9E5827]">
                  <Package className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="font-bold text-[#2D241E] block line-clamp-1">{product.name}</span>
                <span className="text-[10px] text-[#6E6359]">
                  Stock: <strong>{product.current_stock}</strong> • Avg Cost: ₹{product.purchase_price_default}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectExisting(product)}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#2E7D32] text-white rounded-lg hover:bg-[#256628] shrink-0"
            >
              + Add Stock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
