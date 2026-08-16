'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, Supplier } from '@/types';
import { saveProduct, recordPurchase, addCategory } from '@/lib/data-service';
import CameraUploader from './CameraUploader';
import DuplicateDetector from './DuplicateDetector';
import { X, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface SimpleAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  suppliers: Supplier[];
  products?: Product[];
  editingProduct?: Product | null;
  onSaveSuccess: () => void;
  onSelectExistingProduct?: (product: Product) => void;
  onOpenManageCategories?: () => void;
}

export default function SimpleAddProductModal({
  isOpen,
  onClose,
  categories,
  suppliers,
  products = [],
  editingProduct,
  onSaveSuccess,
  onSelectExistingProduct,
  onOpenManageCategories,
}: SimpleAddProductModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<string | number>('20');
  const [purchasePrice, setPurchasePrice] = useState<string | number>('40');
  const [sellingPrice, setSellingPrice] = useState<string | number>('199');
  const [supplierOrLocation, setSupplierOrLocation] = useState('Market');
  const [notes, setNotes] = useState('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [customSubcategory, setCustomSubcategory] = useState<string>('');

  // Advanced Collapsable State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('Aroza Collectibles');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute all available categories (combines registered categories + any categories on products)
  const availableCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    categories.forEach((c) => {
      if (c.name) map.set(c.name.trim().toLowerCase(), { id: c.id, name: c.name.trim() });
    });
    products.forEach((p) => {
      if (p.category_name && !map.has(p.category_name.trim().toLowerCase())) {
        map.set(p.category_name.trim().toLowerCase(), {
          id: p.category_id || `cat-${p.category_name.toLowerCase().replace(/\s+/g, '-')}`,
          name: p.category_name.trim(),
        });
      }
    });
    return Array.from(map.values());
  }, [categories, products]);

  // Compute all available subcategories (combines preset options + any subcategories on products)
  const availableSubcategories = useMemo(() => {
    const set = new Set<string>(['Rubbers', 'Metal Keychains', 'Weapon Keychains']);
    products.forEach((p) => {
      if (p.subcategory && p.subcategory.trim()) {
        set.add(p.subcategory.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    if (editingProduct) {
      setProductName(editingProduct.name || '');
      setQuantity(editingProduct.current_stock ?? '');
      setPurchasePrice(editingProduct.purchase_price_default ?? '');
      setSellingPrice(editingProduct.selling_price_default ?? '');
      setSupplierOrLocation(editingProduct.supplier_name || 'Market');
      setSku(editingProduct.sku || '');
      setCategoryId(editingProduct.category_id || categories[0]?.id || '');
      setSubcategory(editingProduct.subcategory || '');
      setCustomCategory('');
      setCustomSubcategory('');
      setDescription(editingProduct.description || '');
      setBrand(editingProduct.brand || 'Aroza Collectibles');
      setImagePreview(
        editingProduct.images && editingProduct.images[0]
          ? editingProduct.images[0].image_url
          : null
      );
    } else {
      setProductName('');
      setQuantity('');
      setPurchasePrice('40');
      setSellingPrice('199');
      setSupplierOrLocation('Market');
      setNotes('');
      setSku(`ARO-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(categories[0]?.id || '');
      setSubcategory('');
      setCustomCategory('');
      setCustomSubcategory('');
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

    const selectedCategoryObj = availableCategories.find((c) => c.id === categoryId);
    let finalCategoryName = selectedCategoryObj?.name || 'Collectible';
    let effectiveCategoryId = categoryId || categories[0]?.id;

    // Handle custom category addition
    if (customCategory.trim()) {
      finalCategoryName = customCategory.trim();
      const existing = categories.find(
        (c) => c.name.toLowerCase() === customCategory.trim().toLowerCase()
      );
      if (existing) {
        effectiveCategoryId = existing.id;
      } else {
        try {
          const newCat = await addCategory({ name: customCategory.trim() });
          if (newCat?.id) {
            effectiveCategoryId = newCat.id;
          }
        } catch (err) {
          console.error('Error auto-adding category:', err);
        }
      }
    }

    const finalSubcategory = subcategory === 'custom' ? customSubcategory.trim() : subcategory;
    const imgUrl = imagePreview; // No default placeholder image

    const parsedQuantity = quantity === '' ? 0 : Number(quantity);
    const parsedPurchasePrice = purchasePrice === '' ? 0 : Number(purchasePrice);
    const parsedSellingPrice = sellingPrice === '' ? 0 : Number(sellingPrice);

    // 1. Create Product
    const createdProduct = await saveProduct({
      ...(editingProduct?.id ? { id: editingProduct.id } : {}),
      name: productName.trim(),
      sku: sku || `ARO-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: effectiveCategoryId,
      category_name: finalCategoryName,
      subcategory: finalSubcategory || undefined,
      brand,
      description,
      purchase_price_default: parsedPurchasePrice,
      selling_price_default: parsedSellingPrice,
      instagram_price: parsedSellingPrice,
      meesho_price: Math.round(parsedSellingPrice * 1.15),
      direct_price: Math.round(parsedSellingPrice * 0.9),
      current_stock: parsedQuantity,
      supplier_name: supplierOrLocation,
      images: imgUrl ? [{
        id: `img-${Date.now()}`,
        product_id: editingProduct?.id || 'temp',
        image_url: imgUrl,
        is_main: true,
        display_order: 0,
      }] : [],
    });

    // 2. Automatically Record Initial Purchase Order in Background
    if (!editingProduct && parsedQuantity > 0) {
      await recordPurchase({
        purchase_number: `PUR-#${Math.floor(100 + Math.random() * 900)}`,
        supplier_name: supplierOrLocation,
        purchase_date: new Date().toISOString().split('T')[0],
        transport_cost: 0,
        packaging_cost: 0,
        other_expenses: 0,
        payment_method: 'UPI',
        notes: notes || `Initial purchase from ${supplierOrLocation}`,
        total_amount: parsedQuantity * parsedPurchasePrice,
        items: [
          {
            product_id: createdProduct.id,
            product_name: createdProduct.name,
            quantity: parsedQuantity,
            unit_cost: parsedPurchasePrice,
            total_cost: parsedQuantity * parsedPurchasePrice,
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
              products={products.length > 0 ? products : ((window as any).__aroza_products || [])}
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
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 20"
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
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g. 40"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-extrabold text-sm text-[#2D241E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <label className="block text-[#2D241E] font-bold">Category</label>
              {onOpenManageCategories && (
                <button
                  type="button"
                  onClick={onOpenManageCategories}
                  className="text-[11px] text-[#9E5827] font-semibold hover:underline"
                >
                  Manage / Remove Categories
                </button>
              )}
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-sm text-[#2D241E]"
            >
              {availableCategories.map((c, idx) => (
                <option key={`cat-opt-${c.id}-${c.name}-${idx}`} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-1">
              <label className="block text-[#6E6359] font-medium mb-1">Or enter custom Category name (optional):</label>
              <input
                type="text"
                placeholder="e.g. Action Figures, Anime Merch..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2D241E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="block text-[#2D241E] font-bold mb-1">Subcategory (optional)</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-medium text-sm text-[#2D241E]"
            >
              <option value="">None</option>
              {availableSubcategories.map((sub, idx) => (
                <option key={`sub-opt-${sub}-${idx}`} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="custom">Custom / Other...</option>
            </select>
            {subcategory === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom subcategory name"
                value={customSubcategory}
                onChange={(e) => setCustomSubcategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2D241E]"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2D241E] font-bold mb-1">4. Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 199"
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
              {showAdvanced ? 'Hide advanced details' : 'More details (SKU, Brand, Description)'}
            </button>

            {showAdvanced && (
              <div className="p-3 mt-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl space-y-3">
                <div>
                  <label className="block text-[#2D241E] font-semibold mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#2D241E] font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#2D241E] font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs"
                  />
                </div>
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
