'use client';

import React, { useState } from 'react';
import { Product, Category, Supplier, StockStatus } from '@/types';
import ProductCard from './ProductCard';
import { getStockStatus, formatCurrency } from '@/lib/calculations';
import { Search, Filter, LayoutGrid, List, Plus, Package } from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onSelectProduct: (product: Product) => void;
  onOpenAddProduct: () => void;
  onRecordSale: (product: Product) => void;
}

export default function ProductsView({
  products,
  categories,
  suppliers,
  onSelectProduct,
  onOpenAddProduct,
  onRecordSale,
}: ProductsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');

  // Filtering Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSupplier = selectedSupplier === 'all' || p.supplier_id === selectedSupplier;

    const status = getStockStatus(p.current_stock, p.min_reorder_level || 5);
    const matchesStock = selectedStockStatus === 'all' || status === selectedStockStatus;

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
            Aroza Product Inventory ({filteredProducts.length})
          </h1>
          <p className="text-xs text-[#6E6359] mt-0.5">
            Visual product cards, catalog pricing, and real-time stock levels
          </p>
        </div>

        <button
          onClick={onOpenAddProduct}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E5827] text-white hover:bg-[#86481E] font-bold text-xs shadow-xs transition-transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6359]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827]"
            />
          </div>

          {/* View Mode Toggle & Clear */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D9]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-[#9E5827] shadow-xs' : 'text-[#6E6359]'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-[#9E5827] shadow-xs' : 'text-[#6E6359]'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E8E2D9] text-xs">
          <div>
            <span className="text-[10px] text-[#6E6359] block mb-0.5">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-[#2D241E] font-medium"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] text-[#6E6359] block mb-0.5">Stock Status</span>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-[#2D241E] font-medium"
            >
              <option value="all">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#6E6359] block mb-0.5">Supplier</span>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-[#2D241E] font-medium"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E8E2D9] shadow-xs space-y-3">
          <Package className="w-12 h-12 mx-auto text-[#9E5827] opacity-40" />
          <h3 className="text-base font-bold text-[#2D241E]">No Products Found</h3>
          <p className="text-xs text-[#6E6359]">Add your first product to start tracking inventory.</p>
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 bg-[#9E5827] text-white text-xs font-bold rounded-xl"
          >
            + Add Product
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onRecordSale={onRecordSale}
            />
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && filteredProducts.length > 0 && (
        <div className="aroza-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF7F2] text-[#6E6359] border-b border-[#E8E2D9] font-semibold">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3 text-right">Buy Cost</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-right">Profit/Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredProducts.map((p) => {
                  const status = getStockStatus(p.current_stock, p.min_reorder_level || 5);
                  const cost = p.purchase_price_default || 0;
                  const price = p.selling_price_default || 0;
                  const profit = Math.max(0, price - cost);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProduct(p)}
                      className="hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                    >
                      <td className="p-3 flex items-center gap-3">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0].image_url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-[#E8E2D9]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#F4EBE1] flex items-center justify-center text-[#9E5827]">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-semibold text-[#2D241E]">{p.name}</span>
                      </td>
                      <td className="p-3 font-mono text-[#6E6359]">{p.sku}</td>
                      <td className="p-3 text-[#6E6359]">{p.category_name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            status === 'In Stock'
                              ? 'aroza-badge-instock'
                              : status === 'Low Stock'
                              ? 'aroza-badge-lowstock'
                              : 'aroza-badge-outstock'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-[#2D241E]">{p.current_stock}</td>
                      <td className="p-3 text-right font-semibold text-[#6E6359]">
                        {formatCurrency(cost)}
                      </td>
                      <td className="p-3 text-right font-bold text-[#9E5827]">
                        {formatCurrency(price)}
                      </td>
                      <td className="p-3 text-right font-bold text-[#2E7D32]">
                        +{formatCurrency(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
