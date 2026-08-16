'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import SimpleBottomNav from '@/components/SimpleBottomNav';
import GlobalSearchModal from '@/components/GlobalSearchModal';

import HomeView from '@/components/HomeView';
import ProductsView from '@/components/ProductsView';
import MoneyView from '@/components/MoneyView';

import PurchasesView from '@/components/PurchasesView';
import SuppliersView from '@/components/SuppliersView';
import AnalyticsView from '@/components/AnalyticsView';
import SettingsView from '@/components/SettingsView';

import ProductDetailModal from '@/components/ProductDetailModal';
import SimpleAddProductModal from '@/components/SimpleAddProductModal';
import SimpleSaleModal from '@/components/SimpleSaleModal';
import SimpleExpenseModal from '@/components/SimpleExpenseModal';
import RecordPurchaseModal from '@/components/RecordPurchaseModal';
import AddSupplierModal from '@/components/AddSupplierModal';
import ReconciliationModal from '@/components/ReconciliationModal';
import NLPConfirmModal from '@/components/NLPConfirmModal';
import ManageCategoriesModal from '@/components/ManageCategoriesModal';

import { ParsedCommand } from '@/lib/nlp-parser';
import { Product, Purchase, Sale, Expense, Supplier, Category } from '@/types';
import {
  getProducts,
  getPurchases,
  getSales,
  getExpenses,
  getSuppliers,
  getCategories,
  initLocalStorage,
} from '@/lib/data-service';

import { Search, Plus, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('home');

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Visibility States
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState<boolean>(false);
  const [saleInitialProduct, setSaleInitialProduct] = useState<Product | null>(null);

  const [isRecordPurchaseOpen, setIsRecordPurchaseOpen] = useState<boolean>(false);
  const [purchaseInitialProduct, setPurchaseInitialProduct] = useState<Product | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState<boolean>(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState<boolean>(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState<boolean>(false);

  const [nlpCommand, setNlpCommand] = useState<ParsedCommand | null>(null);

  // Expose products globally for smart duplicate detector
  if (typeof window !== 'undefined') {
    (window as any).__aroza_products = products;
  }

  // Load all business data
  const loadData = useCallback(async () => {
    try {
      initLocalStorage();
      const [prods, purs, sls, exps, sups, cats] = await Promise.all([
        getProducts(),
        getPurchases(),
        getSales(),
        getExpenses(),
        getSuppliers(),
        getCategories(),
      ]);

      setProducts(prods);
      setPurchases(purs);
      setSales(sls);
      setExpenses(exps);
      setSuppliers(sups);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            console.log('Aroza PWA ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA ServiceWorker registration failed: ', err);
          });
      });
    }

    // Keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData]);

  // Handle Quick Action Triggers
  const handleOpenQuickAction = (
    type: 'product' | 'purchase' | 'sale' | 'expense' | 'supplier' | 'reconcile',
    prodTarget?: Product
  ) => {
    if (type === 'product') {
      setEditingProduct(prodTarget || null);
      setIsAddProductOpen(true);
    } else if (type === 'sale') {
      setSaleInitialProduct(prodTarget || null);
      setIsRecordSaleOpen(true);
    } else if (type === 'purchase') {
      setPurchaseInitialProduct(prodTarget || null);
      setIsRecordPurchaseOpen(true);
    } else if (type === 'expense') {
      setIsAddExpenseOpen(true);
    } else if (type === 'supplier') {
      setIsAddSupplierOpen(true);
    } else if (type === 'reconcile') {
      setIsReconcileOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D241E] flex flex-col lg:flex-row antialiased">
      {/* Sidebar Navigation for Desktop */}
      <Sidebar
        activeTab={activeTab === 'home' ? 'dashboard' : activeTab}
        setActiveTab={(t) => setActiveTab(t === 'dashboard' ? 'home' : t)}
        onOpenQuickAction={(type) => handleOpenQuickAction(type)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Aroza Collectibles"
              className="w-8 h-8 rounded-lg object-contain bg-black p-0.5 border border-[#E8E2D9]"
            />
            <div>
              <span className="font-bold text-sm text-[#2D241E]">Aroza Manager</span>
              <span className="text-[10px] text-[#6E6359] block font-medium">Aroza Collectibles</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#6E6359] hover:bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenQuickAction('sale')}
              className="px-3 py-1.5 bg-[#2E7D32] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              📷 SELL
            </button>
          </div>
        </header>

        {/* View Component Renderer */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#9E5827] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6E6359] font-medium">Loading Aroza Collectibles Store...</p>
            </div>
          ) : (
            <>
              {(activeTab === 'home' || activeTab === 'dashboard') && (
                <HomeView
                  products={products}
                  purchases={purchases}
                  sales={sales}
                  expenses={expenses}
                  onOpenAction={(type, prod) => handleOpenQuickAction(type, prod)}
                  onSelectProduct={(p) => setSelectedProductDetail(p)}
                  onNLPCommand={(cmd) => setNlpCommand(cmd)}
                  onNavigateTab={(t) => setActiveTab(t)}
                />
              )}

              {activeTab === 'products' && (
                <ProductsView
                  products={products}
                  categories={categories}
                  suppliers={suppliers}
                  onSelectProduct={(p) => setSelectedProductDetail(p)}
                  onOpenAddProduct={() => handleOpenQuickAction('product')}
                  onRecordSale={(p) => handleOpenQuickAction('sale', p)}
                  onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
                />
              )}

              {activeTab === 'money' && (
                <MoneyView
                  sales={sales}
                  expenses={expenses}
                  purchases={purchases}
                  products={products}
                  onOpenRecordSale={() => handleOpenQuickAction('sale')}
                  onOpenAddExpense={() => handleOpenQuickAction('expense')}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'purchases' && (
                <PurchasesView
                  purchases={purchases}
                  products={products}
                  suppliers={suppliers}
                  onOpenRecordPurchase={() => handleOpenQuickAction('purchase')}
                  onEditPurchase={(p) => {
                    setEditingPurchase(p);
                    setIsRecordPurchaseOpen(true);
                  }}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'suppliers' && (
                <SuppliersView
                  suppliers={suppliers}
                  purchases={purchases}
                  onOpenAddSupplier={() => handleOpenQuickAction('supplier')}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  products={products}
                  purchases={purchases}
                  sales={sales}
                  expenses={expenses}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView onRefreshAll={loadData} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile 4-Tab Bottom Navigation */}
      <SimpleBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAction={(type) => handleOpenQuickAction(type)}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        sales={sales}
        purchases={purchases}
        suppliers={suppliers}
        onSelectProduct={(p) => setSelectedProductDetail(p)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        isOpen={Boolean(selectedProductDetail)}
        onClose={() => setSelectedProductDetail(null)}
        purchases={purchases}
        sales={sales}
        onRefresh={loadData}
        onRecordSale={(p) => handleOpenQuickAction('sale', p)}
        onRecordPurchase={(p) => handleOpenQuickAction('purchase', p)}
        onEditProduct={(p) => handleOpenQuickAction('product', p)}
      />

      {/* Camera-First Simple Add Product Modal */}
      <SimpleAddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        categories={categories}
        suppliers={suppliers}
        products={products}
        editingProduct={editingProduct}
        onSaveSuccess={loadData}
        onSelectExistingProduct={(p) => handleOpenQuickAction('purchase', p)}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
      />

      {/* Simple Record Sale Modal */}
      <SimpleSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => {
          setIsRecordSaleOpen(false);
          setSaleInitialProduct(null);
        }}
        products={products}
        initialProduct={saleInitialProduct}
        onSaveSuccess={loadData}
      />

      {/* Simple Add Expense Modal */}
      <SimpleExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSaveSuccess={loadData}
      />

      {/* Record Purchase Modal */}
      <RecordPurchaseModal
        isOpen={isRecordPurchaseOpen}
        onClose={() => {
          setIsRecordPurchaseOpen(false);
          setPurchaseInitialProduct(null);
          setEditingPurchase(null);
        }}
        products={products}
        suppliers={suppliers}
        initialProduct={purchaseInitialProduct}
        editingPurchase={editingPurchase}
        onSaveSuccess={loadData}
      />

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSaveSuccess={loadData}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categories}
        products={products}
        onRefresh={loadData}
      />

      {/* Reconciliation Modal */}
      <ReconciliationModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        products={products}
        onSaveSuccess={loadData}
      />

      {/* Natural Language Confirmation Modal */}
      <NLPConfirmModal
        parsed={nlpCommand}
        isOpen={Boolean(nlpCommand)}
        onClose={() => setNlpCommand(null)}
        products={products}
        onSaveSuccess={loadData}
      />
    </div>
  );
}
