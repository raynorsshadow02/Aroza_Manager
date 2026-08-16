'use client';

import React, { useState } from 'react';
import { Category, Product } from '@/types';
import { deleteCategory, addCategory } from '@/lib/data-service';
import { X, Trash2, Plus, Tag, AlertCircle, Check } from 'lucide-react';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
}

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  categories,
  products,
  onRefresh,
}: ManageCategoriesModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Deduplicate all categories combining registered ones and any custom product category names
  const allCategoriesMap = new Map<string, { id: string; name: string; count: number }>();
  categories.forEach((c) => {
    if (c.name) {
      allCategoriesMap.set(c.name.trim().toLowerCase(), {
        id: c.id,
        name: c.name.trim(),
        count: products.filter((p) => p.category_id === c.id || p.category_name?.toLowerCase() === c.name.toLowerCase()).length,
      });
    }
  });

  products.forEach((p) => {
    if (p.category_name && !allCategoriesMap.has(p.category_name.trim().toLowerCase())) {
      allCategoriesMap.set(p.category_name.trim().toLowerCase(), {
        id: p.category_id || `cat-${p.category_name.toLowerCase().replace(/\s+/g, '-')}`,
        name: p.category_name.trim(),
        count: products.filter((item) => item.category_name?.toLowerCase() === p.category_name?.toLowerCase()).length,
      });
    }
  });

  const categoryList = Array.from(allCategoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAdding(true);
    setErrorMsg('');
    try {
      await addCategory({ name: newCatName.trim() });
      setNewCatName('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove the category "${name}"? Products using it will be re-assigned to 'Collectible'.`)) {
      setDeletingId(id);
      try {
        await deleteCategory(id);
        await deleteCategory(name); // also delete by name if custom
        onRefresh();
      } catch (err: any) {
        console.error('Error deleting category:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#9E5827] text-white flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D241E]">Manage Categories</h2>
              <p className="text-[11px] text-[#6E6359]">Add new or remove unwanted categories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6E6359] hover:bg-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Category Input */}
        <form onSubmit={handleAddCategory} className="p-4 border-b border-[#E8E2D9] bg-white flex gap-2">
          <input
            type="text"
            placeholder="New Category Name (e.g. Manga, Keychains...)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-medium focus:outline-none focus:border-[#9E5827]"
          />
          <button
            type="submit"
            disabled={isAdding || !newCatName.trim()}
            className="px-3 py-2 bg-[#9E5827] text-white rounded-xl font-bold text-xs hover:bg-[#86481E] disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>

        {errorMsg && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-xs flex items-center gap-1.5 border-b border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Categories List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {categoryList.length === 0 ? (
            <p className="text-center text-xs text-[#6E6359] py-8">No categories found.</p>
          ) : (
            categoryList.map((cat, idx) => (
              <div
                key={`manage-cat-${cat.id}-${cat.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#9E5827]" />
                  <span className="font-bold text-xs text-[#2D241E]">{cat.name}</span>
                  <span className="text-[10px] text-[#6E6359] bg-[#E8E2D9] px-1.5 py-0.5 rounded-full font-medium">
                    {cat.count} {cat.count === 1 ? 'product' : 'products'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={deletingId === cat.id}
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 text-[#9C9288] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title={`Delete category "${cat.name}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#E8E2D9] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2D241E] text-white font-bold text-xs rounded-xl hover:bg-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
