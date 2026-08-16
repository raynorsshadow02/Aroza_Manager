'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier } from '@/types';
import { saveProduct, recordPurchase } from '@/lib/data-service';
import CameraUploader from './CameraUploader';
import DuplicateDetector from './DuplicateDetector';
import { X, ChevronDown, ChevronUp, Package, Sparkles } from 'lucide-react';

interface SimpleAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  suppliers: Supplier[];
  editingProduct?: Product | null;
  onSaveSuccess: () => void;
  onSelectExistingProduct?: (product: Product) => void;
}

export default function SimpleAddProductModal({
  isOpen,
  onClose,
  categories,
  suppliers,
  editingProduct,
  onSaveSuccess,
  onSelectExistingProduct,
}: SimpleAddProductModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(20);
  const [purchasePrice, setPurchasePrice] = useState<number>(40);
  const [sellingPrice, setSellingPrice] = useState<number>(199);
  const [supplierOrLocation, setSupplierOrLocation] = useState('Market');
  const [notes, setNotes] = useState('');

  // Advanced Collapsable State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('Aroza Collectibles');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setProductName(editingProduct.name || '');
      setQuantity(editingProduct.current_stock || 20);
      setPurchasePrice(editingProduct.purchase_price_default || 40);
      setSellingPrice(editingProduct.selling_price_default || 199);
      setSupplierOrLocation(editingProduct.supplier_name || 'Market');
      setSku(editingProduct.sku || '');
      setCategoryId(editingProduct.category_id || categories[0]?.id || '');
      setDescription(editingProduct.description || '');
      setBrand(editingProduct.brand || 'Aroza Collectibles');
      setImagePreview(
        editingProduct.images && editingProduct.images[0]
          ? editingProduct.images[0].image_url
          : null
      );
    } else {
      setProductName('');
      setQuantity(20);
      setPurchasePrice(40);
      setSellingPrice(199);
      setSupplierOrLocation('Market');
      setNotes('');
      setSku(`ARO-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(categories[0]?.id || '');
      setDescription('');
      setBrand('Aroza Collectibles');
      setImagePreview(null);
    }
  }, [editingProduct, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    setIsSubmitting(true);

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const imgUrl =
      imagePreview ||
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80';

    // 1. Create Product
    const createdProduct = await saveProduct({
      ...(editingProduct?.id ? { id: editingProduct.id } : {}),
      name: productName.trim(),
      sku: sku || `ARO-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: categoryId || categories[0]?.id,
      category_name: selectedCategory?.name || 'Collectible',
      brand,
      description,
      purchase_price_default: Number(purchasePrice) || 0,
      selling_price_default: Number(sellingPrice) || 0,
      instagram_price: Number(sellingPrice) || 0,
      meesho_price: Math.round(Number(sellingPrice) * 1.15),
      direct_price: Math.round(Number(sellingPrice) * 0.9),
      current_stock: editingProduct ? (Number(quantity) || 0) : 0,
      supplier_name: supplierOrLocation,
      images: [
        {
          id: `img-${Date.now()}`,
          product_id: editingProduct?.id || 'temp',
          image_url: imgUrl,
          is_main: true,
          display_order: 0,
        },
      ],
    });

    // 2. Automatically Record Initial Purchase Order in Background
    if (!editingProduct && quantity > 0) {
      await recordPurchase({
        purchase_number: `PUR-#${Math.floor(100 + Math.random() * 900)}`,
        supplier_name: supplierOrLocation,
        purchase_date: new Date().toISOString().split('T')[0],
        transport_cost: 0,
        packaging_cost: 0,
        other_expenses: 0,
        payment_method: 'UPI',
        notes: notes || `Initial purchase from ${supplierOrLocation}`,
        total_amount: Number(quantity) * Number(purchasePrice),
        items: [
          {
            product_id: createdProduct.id,
            product_name: createdProduct.name,
            quantity: Number(quantity),
            unit_cost: Number(purchasePrice),
            total_cost: Number(quantity) * Number(purchasePrice),
          },
        ],
      });
    }

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#9E5827] text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#2D241E]">
              {editingProduct ? 'Edit Product' : 'Add New Collectible'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6E6359] hover:bg-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* CAMERA / GALLERY FIRST */}
          <CameraUploader
            imagePreview={imagePreview}
            onImageSelected={(url) => setImagePreview(url)}
            onClearImage={() => setImagePreview(null)}
          />

          {/* 5 SIMPLE DEFAULT QUESTIONS */}
          <div>
            <label className="block text-[#2D241E] font-bold mb-1">1. Product Name *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Zoro Spinner Keychain"
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-sm font-semibold text-[#2D241E] focus:outline-none focus:border-[#9E5827]"
            />
          </div>

          {/* SMART DUPLICATE DETECTOR BANNER */}
          {!editingProduct && (
            <DuplicateDetector
              query={productName}
              products={categories.length > 0 ? (window as any).__aroza_products || [] : []}
              onSelectExisting={(p) => {
                if (onSelectExistingProduct) onSelectExistingProduct(p);
                onClose();
              }}
              onConfirmNew={() => {}}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2D241E] font-bold mb-1">2. Quantity Purchased *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#2D241E]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-bold mb-1">3. Buy Price / Piece (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#2D241E]"
              />
            </div>
          </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="block text-[#2D241E] font-bold mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#2D241E]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2D241E] font-bold mb-1">4. Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#9E5827]"
              />
            </div>

            <div>
              <label className="block text-[#2D241E] font-bold mb-1">5. Where bought?</label>
              <input
                type="text"
                value={supplierOrLocation}
                onChange={(e) => setSupplierOrLocation(e.target.value)}
                placeholder="Market / DragonCraft"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs text-[#2D241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Zinc alloy metal finish"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs"
            />
          </div>

          {/* ADVANCED COLLAPSABLE ACCORDION */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#9E5827] hover:underline"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide advanced details' : 'More details (SKU, Category, Brand)'}
            </button>

            {showAdvanced && (
              <div className="p-3 mt-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl space-y-3
              </div>
            )}
          </div>

          {/* LARGE BOLD CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#9E5827] text-white font-extrabold text-sm hover:bg-[#86481E] shadow-md transition-transform active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'ADD TO AROZA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
