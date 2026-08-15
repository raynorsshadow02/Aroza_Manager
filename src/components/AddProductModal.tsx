'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier } from '@/types';
import { saveProduct } from '@/lib/data-service';
import { X, Package, Tag, Upload, DollarSign, Plus } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  suppliers: Supplier[];
  editingProduct?: Product | null;
  onSaveSuccess: () => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  categories,
  suppliers,
  editingProduct,
  onSaveSuccess,
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    subcategory: '',
    description: '',
    brand: 'Aroza Collectibles',
    supplier_id: '',
    purchase_price_default: 0,
    selling_price_default: 0,
    instagram_price: 0,
    meesho_price: 0,
    direct_price: 0,
    other_platform_price: 0,
    min_reorder_level: 5,
    current_stock: 0,
    tags: '',
    imageUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        category_id: editingProduct.category_id || '',
        subcategory: editingProduct.subcategory || '',
        description: editingProduct.description || '',
        brand: editingProduct.brand || 'Aroza Collectibles',
        supplier_id: editingProduct.supplier_id || '',
        purchase_price_default: editingProduct.purchase_price_default || 0,
        selling_price_default: editingProduct.selling_price_default || 0,
        instagram_price: editingProduct.instagram_price || editingProduct.selling_price_default || 0,
        meesho_price: editingProduct.meesho_price || editingProduct.selling_price_default || 0,
        direct_price: editingProduct.direct_price || editingProduct.selling_price_default || 0,
        other_platform_price: editingProduct.other_platform_price || editingProduct.selling_price_default || 0,
        min_reorder_level: editingProduct.min_reorder_level || 5,
        current_stock: editingProduct.current_stock || 0,
        tags: editingProduct.tags ? editingProduct.tags.join(', ') : '',
        imageUrl: editingProduct.images && editingProduct.images[0] ? editingProduct.images[0].image_url : '',
      });
    } else {
      setFormData({
        name: '',
        sku: `ARO-${Math.floor(1000 + Math.random() * 9000)}`,
        category_id: categories[0]?.id || '',
        subcategory: '',
        description: '',
        brand: 'Aroza Collectibles',
        supplier_id: suppliers[0]?.id || '',
        purchase_price_default: 40,
        selling_price_default: 199,
        instagram_price: 199,
        meesho_price: 229,
        direct_price: 180,
        other_platform_price: 199,
        min_reorder_level: 5,
        current_stock: 10,
        tags: 'One Piece, Keychain, Collectible',
        imageUrl: '',
      });
    }
  }, [editingProduct, categories, suppliers, isOpen]);

  if (!isOpen) return null;

  const handlePriceChange = (defaultPrice: number) => {
    setFormData((prev) => ({
      ...prev,
      selling_price_default: defaultPrice,
      instagram_price: prev.instagram_price || defaultPrice,
      meesho_price: prev.meesho_price || Math.round(defaultPrice * 1.15),
      direct_price: prev.direct_price || Math.round(defaultPrice * 0.9),
      other_platform_price: prev.other_platform_price || defaultPrice,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    const selectedCategory = categories.find((c) => c.id === formData.category_id);
    const selectedSupplier = suppliers.find((s) => s.id === formData.supplier_id);

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const defaultImg =
      formData.imageUrl.trim() ||
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80';

    await saveProduct({
      ...(editingProduct?.id ? { id: editingProduct.id } : {}),
      name: formData.name,
      sku: formData.sku,
      category_id: formData.category_id,
      category_name: selectedCategory?.name || 'Collectible',
      subcategory: formData.subcategory,
      description: formData.description,
      brand: formData.brand,
      supplier_id: formData.supplier_id,
      supplier_name: selectedSupplier?.name || '',
      purchase_price_default: Number(formData.purchase_price_default) || 0,
      selling_price_default: Number(formData.selling_price_default) || 0,
      instagram_price: Number(formData.instagram_price) || Number(formData.selling_price_default) || 0,
      meesho_price: Number(formData.meesho_price) || Number(formData.selling_price_default) || 0,
      direct_price: Number(formData.direct_price) || Number(formData.selling_price_default) || 0,
      other_platform_price: Number(formData.other_platform_price) || Number(formData.selling_price_default) || 0,
      min_reorder_level: Number(formData.min_reorder_level) || 5,
      current_stock: Number(formData.current_stock) || 0,
      tags: tagsArray,
      images: [
        {
          id: `img-${Date.now()}`,
          product_id: editingProduct?.id || 'temp',
          image_url: defaultImg,
          is_main: true,
          display_order: 0,
        },
      ],
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 lg:p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9E5827] flex items-center justify-center text-white font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-[#2D241E]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-[#6E6359]">Aroza Collectibles Inventory System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6E6359] hover:bg-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Main Specs Grid */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#9E5827] uppercase tracking-wider text-[11px]">
              Basic Product Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Zoro Spinner Keychain"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827] text-sm text-[#2D241E]"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">SKU / Code *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827] font-mono text-sm text-[#2D241E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827] text-xs text-[#2D241E]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Subcategory</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g. One Piece"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827] text-xs text-[#2D241E]"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827] text-xs text-[#2D241E]"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Product Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product material, size, finish details..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#9E5827] text-xs text-[#2D241E]"
              />
            </div>
          </div>

          {/* Pricing & Stock Section */}
          <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
            <h3 className="font-semibold text-[#9E5827] uppercase tracking-wider text-[11px]">
              Pricing & Stock Quantities (₹ INR)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.purchase_price_default}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_price_default: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-sm text-[#2D241E]"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Default Selling (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.selling_price_default}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-sm text-[#9E5827]"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Initial Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-sm text-[#2D241E]"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-semibold mb-1">Low-Stock Alert Qty</label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_reorder_level}
                  onChange={(e) => setFormData({ ...formData, min_reorder_level: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
                />
              </div>
            </div>

            {/* Platform Pricing Row */}
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-2">
              <span className="text-[11px] font-semibold text-[#6E6359] block">
                Platform Specific Selling Prices (Optional)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-[#6E6359]">Instagram</span>
                  <input
                    type="number"
                    value={formData.instagram_price}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram_price: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6359]">Meesho</span>
                  <input
                    type="number"
                    value={formData.meesho_price}
                    onChange={(e) =>
                      setFormData({ ...formData, meesho_price: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6359]">Direct/Meetup</span>
                  <input
                    type="number"
                    value={formData.direct_price}
                    onChange={(e) =>
                      setFormData({ ...formData, direct_price: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photo URL & Tags */}
          <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Product Photo URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://... direct image link"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-semibold mb-1">Tags (Comma Separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="One Piece, Katana, Metal, Bestseller"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-[#6E6359] font-medium hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#9E5827] text-white font-bold hover:bg-[#86481E] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
