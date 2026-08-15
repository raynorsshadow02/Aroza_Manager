'use client';

import React, { useState } from 'react';
import { Supplier } from '@/types';
import { saveSupplier } from '@/lib/data-service';
import { X, Users, MapPin, Phone } from 'lucide-react';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function AddSupplierModal({
  isOpen,
  onClose,
  onSaveSuccess,
}: AddSupplierModalProps) {
  const [name, setName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await saveSupplier({
      name: name.trim(),
      contact_number: contactNumber.trim(),
      location: location.trim(),
      notes: notes.trim(),
    });

    setIsSubmitting(false);
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9E5827] flex items-center justify-center text-white font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D241E]">Register Supplier</h2>
              <p className="text-xs text-[#6E6359]">Aroza Collectibles Supplier Records</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6E6359] hover:bg-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Supplier / Factory Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DragonCraft Metalworks"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-sm font-semibold text-[#2D241E]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Contact Phone / WhatsApp</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Location / City</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Surat, Gujarat"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
            />
          </div>

          <div>
            <label className="block text-[#2D241E] font-semibold mb-1">Supplier Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mainly supplies metal anime Katana replica keychains..."
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#2D241E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-[#6E6359]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#9E5827] text-white font-bold hover:bg-[#86481E]"
            >
              {isSubmitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
