'use client';

import React from 'react';
import { Product } from '@/types';
import { formatCurrency, getStockStatus } from '@/lib/calculations';
import { Package, Tag, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onRecordSale?: (product: Product) => void;
}

export default function ProductCard({ product, onSelect, onRecordSale }: ProductCardProps) {
  const stock = Number(product.current_stock ?? 0);
  const stockStatus = getStockStatus(stock, product.min_reorder_level || 5);
  const mainImage = product.images && product.images.length > 0 ? product.images[0].image_url : null;

  const cost = Number(product.purchase_price_default || 0);
  const price = Number(product.selling_price_default || 0);
  const profitPerUnit = Math.max(0, price - cost);
  const marginPercent = price > 0 ? ((profitPerUnit / price) * 100).toFixed(0) : '0';

  return (
    <div
      onClick={() => onSelect(product)}
      className="aroza-card aroza-card-hover group cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Top Image & Badge Container */}
      <div className="relative aspect-4/3 bg-[#F4EBE1] overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#9E5827] p-4 text-center">
            <Package className="w-10 h-10 mb-1 opacity-60" />
            <span className="text-xs font-medium">No photo uploaded</span>
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#2D241E] shadow-xs">
          {product.category_name || 'Collectible'}
        </div>

        {/* Stock Status Badge */}
        <div
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-xs ${
            stockStatus === 'In Stock'
              ? 'aroza-badge-instock'
              : stockStatus === 'Low Stock'
              ? 'aroza-badge-lowstock'
              : 'aroza-badge-outstock'
          }`}
        >
          {stockStatus === 'Low Stock' && <AlertTriangle className="w-3 h-3" />}
          {stockStatus} ({product.current_stock})
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[11px] font-mono text-[#6E6359] uppercase mb-0.5 tracking-wide">
            {product.sku}
          </div>
          <h3 className="font-semibold text-base text-[#2D241E] line-clamp-1 group-hover:text-[#9E5827] transition-colors">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-[#6E6359] mt-0.5">{product.brand}</p>
          )}
        </div>

        {/* Financial Numbers Bar */}
        <div className="pt-2 border-t border-[#E8E2D9] grid grid-cols-3 gap-2 text-center bg-[#FAF7F2] p-2.5 rounded-xl">
          <div>
            <span className="block text-[10px] text-[#6E6359] font-medium uppercase">Buy Cost</span>
            <span className="text-xs font-bold text-[#2D241E]">{formatCurrency(cost)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-[#6E6359] font-medium uppercase">Selling</span>
            <span className="text-xs font-bold text-[#9E5827]">{formatCurrency(price)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-[#6E6359] font-medium uppercase">Profit/Unit</span>
            <span className="text-xs font-bold text-[#2E7D32]">
              +{formatCurrency(profitPerUnit)}
            </span>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between text-xs text-[#6E6359] pt-1">
          <span className="flex items-center gap-1 font-medium text-[#2E7D32]">
            <TrendingUp className="w-3.5 h-3.5" /> {marginPercent}% Margin
          </span>

          <span className="text-[11px] font-medium text-[#9E5827] group-hover:underline flex items-center gap-0.5">
            View Details <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
