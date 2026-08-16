'use client';

import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X, Upload } from 'lucide-react';

interface CameraUploaderProps {
  imagePreview: string | null;
  onImageSelected: (base64OrUrl: string) => void;
  onClearImage?: () => void;
  label?: string;
}

// Client-side image compressor: scales down high-res phone camera photos (up to 12MP) to crisp 800px thumbnails (~30KB)
export function compressImage(file: File, maxDimension: number = 800, quality: number = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}

export default function CameraUploader({
  imagePreview,
  onImageSelected,
  onClearImage,
  label = 'Product Photo',
}: CameraUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const compressedBase64 = await compressImage(file, 800, 0.75);
        if (compressedBase64) {
          onImageSelected(compressedBase64);
        }
      } catch (err) {
        console.error('Error compressing image:', err);
      } finally {
        setIsProcessing(false);
        if (e.target) {
          e.target.value = '';
        }
      }
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-[#2D241E]">{label}</span>

      {/* Hidden Native File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isProcessing ? (
        <div className="flex items-center justify-center p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-x-2 text-xs font-semibold text-[#9E5827]">
          <div className="w-4 h-4 border-2 border-[#9E5827] border-t-transparent rounded-full animate-spin" />
          <span>Compressing & optimizing photo...</span>
        </div>
      ) : imagePreview ? (
        <div className="relative aspect-4/3 rounded-2xl bg-[#F4EBE1] overflow-hidden border border-[#E8E2D9] shadow-xs">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          {onClearImage && (
            <button
              type="button"
              onClick={onClearImage}
              className="absolute top-2 right-2 p-1.5 bg-white/90 text-[#DC2626] rounded-xl shadow-md hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#9E5827] text-white hover:bg-[#86481E] shadow-sm transition-transform active:scale-98 space-y-1.5 cursor-pointer"
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs font-bold">Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FAF7F2] text-[#2D241E] hover:bg-[#F4EBE1] border border-[#E8E2D9] transition-transform active:scale-98 space-y-1.5 cursor-pointer"
          >
            <ImageIcon className="w-6 h-6 text-[#9E5827]" />
            <span className="text-xs font-semibold">Choose Gallery</span>
          </button>
        </div>
      )}
    </div>
  );
}
