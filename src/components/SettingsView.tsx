'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Platform } from '@/types';
import { getSettings, saveSettings, initLocalStorage } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Settings as SettingsIcon, Database, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface SettingsViewProps {
  onRefreshAll: () => void;
}

export default function SettingsView({ onRefreshAll }: SettingsViewProps) {
  const [settings, setSettingsData] = useState<Settings>({
    business_name: 'Aroza Collectibles',
    currency: '₹',
    default_platform: 'Instagram',
    default_packaging_cost: 12.0,
    default_shipping_cost: 50.0,
    low_stock_threshold: 5,
    theme_preference: 'warm',
  });

  const [isSaved, setIsSaved] = useState(false);
  const isSupabaseActive = isSupabaseConfigured();

  useEffect(() => {
    getSettings().then(setSettingsData);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetSeedData = () => {
    if (confirm('Reset and re-seed sample Aroza Collectibles products, purchases, sales, and suppliers?')) {
      initLocalStorage(true);
      onRefreshAll();
      alert('Demo data has been successfully re-seeded!');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <h1 className="text-xl lg:text-2xl font-bold text-[#2D241E]">
          Business Settings & Preferences
        </h1>
        <p className="text-xs text-[#6E6359] mt-0.5">
          Configure default prices, currency, low stock thresholds, and data options
        </p>
      </div>

      {/* Supabase Connection Status */}
      <div className="aroza-card p-5 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2D241E]">Database Storage Connection</h3>
              <p className="text-xs text-[#6E6359]">
                {isSupabaseActive
                  ? 'Connected to Supabase PostgreSQL & Auth'
                  : 'Operating in LocalStorage Fast Demo Mode'}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSupabaseActive ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FEF3C7] text-[#D97706]'
            }`}
          >
            {isSupabaseActive ? 'Supabase Connected' : 'Local Storage Demo'}
          </span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="aroza-card p-6 space-y-5 bg-white text-xs">
        <h3 className="font-bold text-sm text-[#9E5827] uppercase tracking-wider">
          Aroza Collectibles Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[#2D241E] mb-1">Business Name</label>
            <input
              type="text"
              value={settings.business_name}
              onChange={(e) => setSettingsData({ ...settings, business_name: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-semibold text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2D241E] mb-1">Currency Symbol</label>
            <input
              type="text"
              value={settings.currency}
              onChange={(e) => setSettingsData({ ...settings, currency: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-bold text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-[#2D241E] mb-1">Default Platform</label>
            <select
              value={settings.default_platform}
              onChange={(e) => setSettingsData({ ...settings, default_platform: e.target.value as Platform })}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl font-medium text-xs"
            >
              <option value="Instagram">Instagram</option>
              <option value="Meesho">Meesho</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Direct">Direct</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#2D241E] mb-1">Default Shipping Cost (₹)</label>
            <input
              type="number"
              value={settings.default_shipping_cost}
              onChange={(e) => setSettingsData({ ...settings, default_shipping_cost: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2D241E] mb-1">Default Packaging Cost (₹)</label>
            <input
              type="number"
              value={settings.default_packaging_cost}
              onChange={(e) => setSettingsData({ ...settings, default_packaging_cost: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#2D241E] mb-1">Low-Stock Alert Threshold (Units)</label>
          <input
            type="number"
            min="1"
            value={settings.low_stock_threshold}
            onChange={(e) => setSettingsData({ ...settings, low_stock_threshold: Number(e.target.value) })}
            className="w-full sm:w-1/3 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D9]">
          {isSaved ? (
            <span className="text-xs font-bold text-[#2E7D32] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved Successfully!
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#9E5827] text-white font-bold rounded-xl hover:bg-[#86481E]"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Seed Data Management */}
      <div className="aroza-card p-6 space-y-3 bg-white">
        <h3 className="font-bold text-sm text-[#2D241E] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9E5827]" /> Sample Data Controls
        </h3>
        <p className="text-xs text-[#6E6359]">
          Re-seed realistic sample products (*Zoro Spinner*, *Shusui Katana*, *Enma Katana*), sample sales, purchases, and supplier records for testing.
        </p>
        <button
          onClick={handleResetSeedData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EBE1] border border-[#E8E2D9] text-[#9E5827] font-bold text-xs"
        >
          <RefreshCw className="w-4 h-4" /> Reset & Re-Seed Demo Data
        </button>
      </div>
    </div>
  );
}
