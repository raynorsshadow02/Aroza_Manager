'use client';

import React, { useState, useEffect } from 'react';
import {
  Product,
  Purchase,
  Sale,
  StockMovement,
  ProductImage,
} from '@/types';
import {
  formatCurrency,
  getStockStatus,
  calculateProductFinancials,
} from '@/lib/calculations';
import { getStockMovements, saveProduct, deleteProduct } from '@/lib/data-service';
import {
  X,
  Package,
  TrendingUp,
  AlertTriangle,
  Upload,
  Trash2,
  Edit3,
  DollarSign,
  History,
  ShoppingBag,
  Truck,
  Layers,
  Tag,
  CheckCircle,
  PlusCircle,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  purchases: Purchase[];
  sales: Sale[];
  onRefresh: () => void;
  onRecordSale: (product: Product) => void;
  onRecordPurchase: (product: Product) => void;
  onEditProduct: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  purchases,
  sales,
  onRefresh,
  onRecordSale,
  onRecordPurchase,
  onEditProduct,
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'sales' | 'purchases' | 'movements'>('overview');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (product?.id) {
      getStockMovements(product.id).then(setMovements);
      setSelectedImageIdx(0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const stockStatus = getStockStatus(product.current_stock, product.min_reorder_level || 5);
  const financials = calculateProductFinancials(product, purchases, sales);

  // Filter sales & purchases for this product
  const productSales = sales.filter((s) => s.items.some((item) => item.product_id === product.id));
  const productPurchases = purchases.filter((p) => p.items.some((item) => item.product_id === product.id));

  const images = product.images && product.images.length > 0
    ? product.images
    : [
        {
          id: 'placeholder',
          product_id: product.id,
          image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80',
          is_main: true,
          display_order: 0,
        },
      ];

  const currentImage = images[selectedImageIdx] || images[0];

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setIsUploadingImage(true);
    const updatedImages: ProductImage[] = [
      ...images,
      {
        id: `img-${Date.now()}`,
        product_id: product.id,
        image_url: newImageUrl.trim(),
        is_main: images.length === 0,
        display_order: images.length,
      },
    ];

    await saveProduct({ ...product, images: updatedImages });
    setNewImageUrl('');
    setIsUploadingImage(false);
    onRefresh();
  };

  const handleDeleteImage = async (imgId: string) => {
    if (images.length <= 1) return;
    const updatedImages = images.filter((img) => img.id !== imgId);
    await saveProduct({ ...product, images: updatedImages });
    setSelectedImageIdx(0);
    onRefresh();
  };

  const handleDeleteProduct = async () => {
    await deleteProduct(product.id);
    setShowDeleteConfirm(false);
    onClose();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 lg:p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4EBE1] flex items-center justify-center text-[#9E5827]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#6E6359] px-2 py-0.5 bg-white border border-[#E8E2D9] rounded-md">
                  {product.sku}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    stockStatus === 'In Stock'
                      ? 'aroza-badge-instock'
                      : stockStatus === 'Low Stock'
                      ? 'aroza-badge-lowstock'
                      : 'aroza-badge-outstock'
                  }`}
                >
                  {stockStatus} ({product.current_stock} left)
                </span>
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-[#2D241E] mt-0.5">{product.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRecordSale(product)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#2E7D32] text-white hover:bg-[#256628] transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Record Sale
            </button>
            <button
              onClick={() => onEditProduct(product)}
              className="p-2 text-[#6E6359] hover:text-[#2D241E] hover:bg-white rounded-xl border border-[#E8E2D9] transition-colors"
              title="Edit Product"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl border border-transparent transition-colors"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#6E6359] hover:bg-[#FAF7F2] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8E2D9] bg-white px-4 overflow-x-auto no-scrollbar gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-[#9E5827] text-[#9E5827]'
                : 'border-transparent text-[#6E6359] hover:text-[#2D241E]'
            }`}
          >
            Overview & Images
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'financials'
                ? 'border-[#9E5827] text-[#9E5827]'
                : 'border-transparent text-[#6E6359] hover:text-[#2D241E]'
            }`}
          >
            Financial Analytics
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sales'
                ? 'border-[#9E5827] text-[#9E5827]'
                : 'border-transparent text-[#6E6359] hover:text-[#2D241E]'
            }`}
          >
            Sales History ({productSales.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'purchases'
                ? 'border-[#9E5827] text-[#9E5827]'
                : 'border-transparent text-[#6E6359] hover:text-[#2D241E]'
            }`}
          >
            Purchase Orders ({productPurchases.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'movements'
                ? 'border-[#9E5827] text-[#9E5827]'
                : 'border-transparent text-[#6E6359] hover:text-[#2D241E]'
            }`}
          >
            Stock Movement Audit ({movements.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & IMAGES */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Image Gallery Column */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-square rounded-2xl bg-[#F4EBE1] overflow-hidden border border-[#E8E2D9]">
                  <img
                    src={currentImage.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <button
                      onClick={() => handleDeleteImage(currentImage.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-[#DC2626] rounded-lg hover:bg-white shadow-xs"
                      title="Delete this photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Thumbnail Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 ${
                        selectedImageIdx === idx ? 'border-[#9E5827]' : 'border-[#E8E2D9] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Add New Image Input */}
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-2">
                  <span className="text-xs font-semibold text-[#2D241E] block">Add Product Image URL</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://... photo link"
                      className="flex-1 text-xs px-3 py-2 bg-white border border-[#E8E2D9] rounded-lg focus:outline-none focus:border-[#9E5827]"
                    />
                    <button
                      onClick={handleAddImage}
                      disabled={isUploadingImage || !newImageUrl}
                      className="px-3 py-2 text-xs font-semibold bg-[#9E5827] text-white rounded-lg disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Specs & Pricing Matrix Column */}
              <div className="lg:col-span-7 space-y-5">
                {/* Information Card */}
                <div className="aroza-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#9E5827] uppercase tracking-wider">
                    Product Catalog Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#6E6359] block">Category</span>
                      <span className="font-semibold text-[#2D241E]">{product.category_name || 'Collectible'}</span>
                    </div>
                    <div>
                      <span className="text-[#6E6359] block">Subcategory</span>
                      <span className="font-semibold text-[#2D241E]">{product.subcategory || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#6E6359] block">Brand</span>
                      <span className="font-semibold text-[#2D241E]">{product.brand || 'Aroza Collectibles'}</span>
                    </div>
                    <div>
                      <span className="text-[#6E6359] block">Supplier</span>
                      <span className="font-semibold text-[#2D241E]">{product.supplier_name || 'N/A'}</span>
                    </div>
                  </div>

                  {product.description && (
                    <div className="pt-2 border-t border-[#E8E2D9]">
                      <span className="text-[11px] text-[#6E6359] block">Description</span>
                      <p className="text-xs text-[#2D241E] mt-0.5 leading-relaxed">{product.description}</p>
                    </div>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {product.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-medium bg-[#F4EBE1] text-[#9E5827] rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Multi-Platform Selling Prices */}
                <div className="aroza-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#9E5827] uppercase tracking-wider">
                    Selling Price Matrix
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                      <span className="text-[10px] text-[#6E6359] block uppercase">Default</span>
                      <span className="text-sm font-bold text-[#2D241E]">
                        {formatCurrency(product.selling_price_default)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                      <span className="text-[10px] text-[#6E6359] block uppercase">Instagram</span>
                      <span className="text-sm font-bold text-[#2D241E]">
                        {formatCurrency(product.instagram_price || product.selling_price_default)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                      <span className="text-[10px] text-[#6E6359] block uppercase">Meesho</span>
                      <span className="text-sm font-bold text-[#2D241E]">
                        {formatCurrency(product.meesho_price || product.selling_price_default)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                      <span className="text-[10px] text-[#6E6359] block uppercase">Direct</span>
                      <span className="text-sm font-bold text-[#2D241E]">
                        {formatCurrency(product.direct_price || product.selling_price_default)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inventory Stock Breakdown */}
                <div className="aroza-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#9E5827] uppercase tracking-wider">
                      Inventory Breakdown
                    </h3>
                    <button
                      onClick={() => onRecordPurchase(product)}
                      className="text-xs font-semibold text-[#9E5827] hover:underline flex items-center gap-1"
                    >
                      + Restock Purchase
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#FAF7F2] rounded-lg">
                      <span className="text-[#6E6359] block text-[10px]">Purchased</span>
                      <span className="font-bold text-[#2D241E]">{financials.totalPurchased}</span>
                    </div>
                    <div className="p-2 bg-[#FAF7F2] rounded-lg">
                      <span className="text-[#6E6359] block text-[10px]">Sold</span>
                      <span className="font-bold text-[#2E7D32]">{financials.totalSold}</span>
                    </div>
                    <div className="p-2 bg-[#FAF7F2] rounded-lg">
                      <span className="text-[#6E6359] block text-[10px]">In Stock</span>
                      <span className="font-bold text-[#9E5827]">{financials.currentStock}</span>
                    </div>
                    <div className="p-2 bg-[#FAF7F2] rounded-lg">
                      <span className="text-[#6E6359] block text-[10px]">Damaged</span>
                      <span className="font-bold text-[#DC2626]">{product.damaged_qty || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL ANALYTICS */}
          {activeTab === 'financials' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="aroza-card p-4 space-y-1">
                  <span className="text-xs font-medium text-[#6E6359]">Avg Purchase Cost</span>
                  <div className="text-xl font-bold text-[#2D241E]">
                    {formatCurrency(financials.avgPurchaseCost)}
                  </div>
                  <span className="text-[11px] text-[#6E6359]">Per unit inventory cost</span>
                </div>

                <div className="aroza-card p-4 space-y-1">
                  <span className="text-xs font-medium text-[#6E6359]">Current Inventory Value</span>
                  <div className="text-xl font-bold text-[#9E5827]">
                    {formatCurrency(financials.inventoryValue)}
                  </div>
                  <span className="text-[11px] text-[#6E6359]">{financials.currentStock} units in hand</span>
                </div>

                <div className="aroza-card p-4 space-y-1">
                  <span className="text-xs font-medium text-[#6E6359]">Total Revenue</span>
                  <div className="text-xl font-bold text-[#2E7D32]">
                    {formatCurrency(financials.revenueGenerated)}
                  </div>
                  <span className="text-[11px] text-[#6E6359]">{financials.totalSold} total units sold</span>
                </div>

                <div className="aroza-card p-4 space-y-1">
                  <span className="text-xs font-medium text-[#6E6359]">Gross Profit</span>
                  <div className="text-xl font-bold text-[#2E7D32]">
                    {formatCurrency(financials.grossProfit)}
                  </div>
                  <span className="text-[11px] text-[#2E7D32] font-semibold">
                    {financials.profitMargin.toFixed(1)}% Gross Margin
                  </span>
                </div>
              </div>

              <div className="aroza-card p-5 space-y-3 bg-[#FAF7F2]">
                <h3 className="text-sm font-semibold text-[#2D241E]">Potential Remaining Profit</h3>
                <div className="flex items-baseline justify-between border-b border-[#E8E2D9] pb-3">
                  <span className="text-xs text-[#6E6359]">
                    If remaining {financials.currentStock} units are sold at default price ({formatCurrency(product.selling_price_default)})
                  </span>
                  <span className="text-xl font-bold text-[#9E5827]">
                    +{formatCurrency(financials.potentialRemainingProfit)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-[#6E6359] block">Expected Sales Revenue:</span>
                    <span className="font-semibold text-[#2D241E]">
                      {formatCurrency(financials.currentStock * product.selling_price_default)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6E6359] block">Stock Acquisition Cost:</span>
                    <span className="font-semibold text-[#2D241E]">{formatCurrency(financials.inventoryValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALES HISTORY */}
          {activeTab === 'sales' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D241E]">All Sales Involving This Product</h3>
                <button
                  onClick={() => onRecordSale(product)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#2E7D32] text-white hover:bg-[#256628]"
                >
                  + Record New Sale
                </button>
              </div>

              {productSales.length === 0 ? (
                <div className="py-12 text-center text-[#6E6359] bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9]">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#9E5827]" />
                  <p className="text-sm font-medium">No sales recorded yet for this product</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#E8E2D9] rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF7F2] text-[#6E6359] border-b border-[#E8E2D9] font-semibold">
                      <tr>
                        <th className="p-3">Order #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {productSales.map((sale) => {
                        const item = sale.items.find((i) => i.product_id === product.id);
                        return (
                          <tr key={sale.id} className="hover:bg-[#FAF7F2]">
                            <td className="p-3 font-semibold text-[#2D241E]">{sale.order_number}</td>
                            <td className="p-3 text-[#6E6359]">{sale.sale_date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-semibold">
                                {sale.platform}
                              </span>
                            </td>
                            <td className="p-3 text-[#6E6359]">{sale.customer_name || 'Walk-in'}</td>
                            <td className="p-3 text-right font-bold">{item?.quantity || 1}</td>
                            <td className="p-3 text-right font-bold text-[#2D241E]">
                              {formatCurrency(item?.unit_price || 0)}
                            </td>
                            <td className="p-3 text-right font-bold text-[#2E7D32]">
                              +{formatCurrency(sale.net_profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PURCHASE ORDERS */}
          {activeTab === 'purchases' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D241E]">Purchase History</h3>
                <button
                  onClick={() => onRecordPurchase(product)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#9E5827] text-white hover:bg-[#86481E]"
                >
                  + Add Purchase
                </button>
              </div>

              {productPurchases.length === 0 ? (
                <div className="py-12 text-center text-[#6E6359] bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9]">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#9E5827]" />
                  <p className="text-sm font-medium">No supplier purchase orders logged yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#E8E2D9] rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF7F2] text-[#6E6359] border-b border-[#E8E2D9] font-semibold">
                      <tr>
                        <th className="p-3">Purchase #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Cost</th>
                        <th className="p-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {productPurchases.map((purchase) => {
                        const item = purchase.items.find((i) => i.product_id === product.id);
                        return (
                          <tr key={purchase.id} className="hover:bg-[#FAF7F2]">
                            <td className="p-3 font-semibold text-[#2D241E]">{purchase.purchase_number}</td>
                            <td className="p-3 text-[#6E6359]">{purchase.purchase_date}</td>
                            <td className="p-3 text-[#2D241E]">{purchase.supplier_name || 'N/A'}</td>
                            <td className="p-3 text-right font-bold">{item?.quantity || 0}</td>
                            <td className="p-3 text-right font-bold">{formatCurrency(item?.unit_cost || 0)}</td>
                            <td className="p-3 text-right font-bold text-[#9E5827]">
                              {formatCurrency(item?.total_cost || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STOCK MOVEMENTS AUDIT LEDGER */}
          {activeTab === 'movements' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#2D241E]">Audit Stock Movements Ledger</h3>

              {movements.length === 0 ? (
                <div className="py-8 text-center text-[#6E6359]">
                  <p className="text-xs">No stock movement logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#E8E2D9] rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF7F2] text-[#6E6359] border-b border-[#E8E2D9] font-semibold">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Qty Change</th>
                        <th className="p-3 text-right">Resulting Stock</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {movements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-[#FAF7F2]">
                          <td className="p-3 text-[#6E6359] font-mono">
                            {new Date(mov.created_at).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                mov.movement_type === 'PURCHASE'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : mov.movement_type === 'SALE'
                                  ? 'bg-[#E0F2FE] text-[#0284C7]'
                                  : mov.movement_type === 'DAMAGED'
                                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                                  : 'bg-[#FEF3C7] text-[#D97706]'
                              }`}
                            >
                              {mov.movement_type}
                            </span>
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              mov.quantity_changed > 0 ? 'text-[#2E7D32]' : 'text-[#DC2626]'
                            }`}
                          >
                            {mov.quantity_changed > 0 ? `+${mov.quantity_changed}` : mov.quantity_changed}
                          </td>
                          <td className="p-3 text-right font-bold text-[#2D241E]">
                            {mov.resulting_stock}
                          </td>
                          <td className="p-3 text-[#6E6359]">{mov.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Product Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D9] max-w-md w-full rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#2D241E]">Delete Product?</h3>
            </div>
            <p className="text-xs text-[#6E6359] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#2D241E]">{product.name}</span> ({product.sku})? This action will permanently remove the product and image records.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] text-[#2D241E] border border-[#E8E2D9]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#DC2626] text-white hover:bg-[#B91C1C]"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
